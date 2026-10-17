import { Controller, Get, Module, Res } from "@nestjs/common";
import type { Response } from "express";
import { DatabaseModule, Database } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { ProjectsModule } from "./projects/projects.module";
import { MediaModule } from "./media/media.module";
import { StorageService } from "./media/storage.service";
@Controller()
class HealthController {
  constructor(
    private readonly database: Database,
    private readonly storage: StorageService,
  ) {}
  @Get("health") async health(@Res({ passthrough: true }) res: Response) {
    res.setHeader("X-Robots-Tag", "noindex");
    await this.database.db.command({ ping: 1 });
    return { status: "ok" };
  }
  @Get("health/ready")
  async ready(@Res({ passthrough: true }) res: Response) {
    res.setHeader("X-Robots-Tag", "noindex");
    await this.database.db.command({ ping: 1 });
    await this.storage.check();
    return { status: "ok", database: "connected", storage: "connected" };
  }
}
@Module({
  imports: [DatabaseModule, AuthModule, ProjectsModule, MediaModule],
  controllers: [HealthController],
})
export class AppModule {}
