import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { CATEGORIES, TAGS } from "@veca/content";
import { AdminGuard } from "../auth/admin.guard";
import { ProjectsService } from "./projects.service";
import { parse } from "../common/validation";
const versionSchema = z
  .object({ version: z.number().int().positive() })
  .strict();
@Controller("admin/projects")
@UseGuards(AdminGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}
  @Get() list() {
    return this.projects.list();
  }
  @Get(":id") get(@Param("id") id: string) {
    return this.projects.get(id);
  }
  @Post() create(@Body() input: unknown) {
    return this.projects.create(input);
  }
  @Put(":id") save(@Param("id") id: string, @Body() input: unknown) {
    return this.projects.save(id, input);
  }
  @Post(":id/publish") publish(
    @Param("id") id: string,
    @Body() input: unknown,
  ) {
    return this.projects.publish(id, parse(versionSchema, input).version);
  }
  @Post(":id/unpublish") unpublish(
    @Param("id") id: string,
    @Body() input: unknown,
  ) {
    return this.projects.unpublish(id, parse(versionSchema, input).version);
  }
}
@Controller("public")
export class PublicProjectsController {
  constructor(private readonly projects: ProjectsService) {}
  @Get("taxonomy") taxonomy() {
    return { categories: CATEGORIES, tags: TAGS };
  }
  @Get("projects") list(@Query() input: unknown) {
    const q = parse(
      z.object({
        q: z.string().max(120).default(""),
        category: z.string().max(50).default(""),
        featured: z.enum(["true", "false"]).default("false"),
        page: z.coerce.number().int().min(1).max(10000).default(1),
      }),
      input,
    );
    return this.projects.publicList(
      q.q,
      q.category,
      q.featured === "true",
      q.page,
    );
  }
  @Get("sitemap") sitemap() {
    return this.projects.sitemap();
  }
  @Get("projects/:slug") get(@Param("slug") slug: string) {
    return this.projects.publicOne(slug);
  }
}
