import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { Readable } from "node:stream";
import { z } from "zod";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
import { SessionEndpoint } from "../auth/route-access";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { parse } from "../common/validation";
import { ProfileService } from "./profile.service";
@SessionEndpoint()
@Controller("account/avatar")
class ProfileController {
  constructor(private readonly profile: ProfileService) {}
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 4 * 1024 * 1024, files: 1, fields: 0 },
    }),
  )
  upload(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.profile.upload(req.session.user, file);
  }
  @Post("preference")
  preference(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const data = parse(
      z.object({ source: z.enum(["google", "none"]) }).strict(),
      body,
    );
    return this.profile.preference(req.session.user, data.source);
  }
  @Post("google")
  async google(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const data = parse(
      z.object({ idToken: z.string().min(20).max(10000) }).strict(),
      body,
    );
    return this.profile.google(req.session.user, data.idToken);
  }
  @Get(":id")
  async read(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const photo = await this.profile.read(req.session.user, id);
    res.set({
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    (photo.Body as Readable).pipe(res);
  }
}
@Module({
  imports: [AuthModule, MediaModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
