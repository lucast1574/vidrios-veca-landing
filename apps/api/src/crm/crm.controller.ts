import { CrmEvents } from "./crm.events";
import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  Sse,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { Readable } from "node:stream";
import { z } from "zod";
import { PublicEndpoint, RequirePermission } from "../auth/route-access";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
import { parse } from "../common/validation";
import { CrmService } from "./crm.service";
import { CrmRepository } from "./crm.repository";
import { CrmFiles } from "./crm.files";
import { InventoryService } from "../inventory/inventory.service";
@Controller("public/consultations")
class ConsultationController {
  constructor(private readonly crm: CrmService) {}
  @PublicEndpoint()
  @Post()
  create(@Body() body: unknown) {
    return this.crm.create(body);
  }
}
@RequirePermission("leads")
@Controller("admin/crm")
class CrmController {
  constructor(
    private readonly crm: CrmService,
    private readonly files: CrmFiles,
    private readonly inventory: InventoryService,
    private readonly events: CrmEvents,
  ) {}
  @RequirePermission("dashboard")
  @Sse("events")
  stream() {
    return this.events.stream;
  }
  @Get("leads") list(
    @Query("search") search = "",
    @Query("page") page = "1",
    @Query("stage") stage = "",
    @Query("segment") segment = "",
  ) {
    return this.crm.list(search, Number(page), stage, segment);
  }
  @Post("leads") create(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.crm.create(body, "manual", req.session.user.username);
  }
  @Get("leads/:id") async detail(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      lead: await this.crm.get(id),
      attachments: await this.files.list(id),
      movements: req.session.user.permissions.includes("inventory")
        ? await this.inventory.movements(id)
        : [],
    };
  }
  @Put("leads/:id") update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.crm.update(id, body, req.session.user.username);
  }
  @Post("leads/:id/notes") note(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = parse(
      z
        .object({
          version: z.number().int().positive(),
          text: z.string().trim().min(1).max(4000),
        })
        .strict(),
      body,
    );
    return this.crm.note(
      id,
      data.version,
      data.text,
      req.session.user.username,
    );
  }
  @Post("leads/:id/files")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 12 * 1024 * 1024, files: 1, fields: 1 },
    }),
  )
  upload(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("caption") caption: string,
  ) {
    return this.files.upload(id, file, caption);
  }
  @Get("files/:id") async read(@Param("id") id: string, @Res() res: Response) {
    const { doc, file } = await this.files.read(id);
    res.set({
      "Content-Type": doc.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${doc.type === "contract" ? "attachment" : "inline"}; filename="${doc.type === "contract" ? "contrato.pdf" : "foto.webp"}"`,
    });
    (file.Body as Readable).pipe(res);
  }
  @RequirePermission("inventory")
  @Get("materials")
  materials(@Query("search") search = "") {
    return this.inventory.list(search);
  }
  @RequirePermission("inventory")
  @Post("materials")
  createMaterial(@Body() body: unknown) {
    return this.inventory.create(body);
  }
  @RequirePermission("inventory")
  @Get("movements")
  movements(
    @Query("leadId") leadId?: string,
    @Query("materialId") materialId?: string,
    @Query("page") page = "1",
  ) {
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1 || p > 10000)
      throw new BadRequestException("Página inválida.");
    return this.inventory.movements(leadId, materialId, p);
  }
  @RequirePermission("inventory")
  @Post("materials/:id/movements")
  move(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventory.move(id, body, req.session.user.username);
  }
}
@Module({
  imports: [AuthModule, MediaModule],
  controllers: [ConsultationController, CrmController],
  providers: [CrmRepository, CrmService, CrmFiles, InventoryService, CrmEvents],
})
export class CrmModule {}
