import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response, Request } from "express";
import { Readable } from "node:stream";
import { MediaService } from "./media.service";
import { AdminGuard } from "../auth/admin.guard";
@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}
  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 12 * 1024 * 1024, files: 1, fields: 0 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.media.upload(file);
  }
  @Get(":id") async read(
    @Param("id") id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const file = await this.media.read(id, req.cookies?.veca_session || "");
    res.set({
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (file.ContentLength)
      res.set("Content-Length", String(file.ContentLength));
    (file.Body as Readable).pipe(res);
  }
}
