import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  ProjectsController,
  PublicProjectsController,
} from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectsRepository } from "./projects.repository";
@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, PublicProjectsController],
  providers: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
