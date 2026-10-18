import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { Readable } from "node:stream";
import { RequirePermission } from "../auth/route-access";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { GalleryService } from "./gallery.service";
@RequirePermission("gallery")
@Controller("admin/gallery")
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}
  @Get("photos") list(
    @Query() query: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.set("Cache-Control", "private, no-store");
    return this.gallery.list(query);
  }
  @Put("photos/:id") update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.gallery.update(id, body, req.session.user.username);
  }
  @Get("photos/:id") async read(@Param("id") id: string, @Res() res: Response) {
    const { file } = await this.gallery.read(id);
    res.set({
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Disposition": 'inline; filename="foto.webp"',
    });
    if (file.ContentLength)
      res.set("Content-Length", String(file.ContentLength));
    (file.Body as Readable).pipe(res);
  }
}
