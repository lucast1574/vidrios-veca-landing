import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ObjectId } from "mongodb";
import {
  projectInputSchema,
  seoFor,
  slugify,
  plainText,
  type ProjectInput,
  type RichNode,
} from "@veca/content";
import { Database } from "../database/database.module";
import type { ProjectDocument } from "./project.document";
import { ProjectsRepository } from "./projects.repository";
import { parse } from "../common/validation";
@Injectable()
export class ProjectsService {
  constructor(
    private readonly repo: ProjectsRepository,
    private readonly database: Database,
  ) {}
  admin(d: ProjectDocument) {
    return {
      ...d.draft,
      id: String(d._id),
      slug: d.slug,
      status: d.published ? "published" : "draft",
      version: d.version,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      publishedAt: d.published?.publishedAt || null,
      seo: seoFor(d.draft, d.slug),
      hasUnpublishedChanges: !!d.published && d.publishedVersion !== d.version,
    };
  }
  async list() {
    return (
      await this.repo.collection
        .find({})
        .sort({ updatedAt: -1 })
        .limit(500)
        .toArray()
    ).map((d) => this.admin(d));
  }
  async get(id: string) {
    return this.admin(await this.repo.get(id));
  }
  async validated(input: unknown) {
    const value = parse(projectInputSchema, input);
    if (new Set(value.images.map((i) => i.id)).size !== value.images.length)
      throw new BadRequestException("Hay fotos duplicadas.");
    for (const image of value.images) {
      const media = ObjectId.isValid(image.id)
        ? await this.database.db
            .collection("media")
            .findOne({ _id: new ObjectId(image.id), status: "ready" })
        : null;
      if (
        !media ||
        media.url !== image.url ||
        media.width !== image.width ||
        media.height !== image.height
      )
        throw new BadRequestException("Usa una foto subida desde el panel.");
    }
    if (value.coverId && !value.images.some((i) => i.id === value.coverId))
      throw new BadRequestException("Selecciona una portada disponible.");
    const walk = (node: RichNode) => {
      if (
        node.type === "image" &&
        !value.images.some((i) => i.id === node.attrs?.mediaId)
      )
        throw new BadRequestException(
          "Hay una imagen del texto que no está en la biblioteca.",
        );
      node.content?.forEach(walk);
    };
    walk(value.body);
    return value;
  }
  async create(input: unknown) {
    const value = await this.validated(input);
    const _id = new ObjectId();
    const slug =
      (slugify(value.title) || "proyecto") + "-" + String(_id).slice(-6);
    const now = new Date().toISOString();
    const d = {
      _id,
      slug,
      draft: value,
      published: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.collection.insertOne(d);
    return this.admin(d);
  }
  async save(id: string, input: unknown) {
    const value = await this.validated(input);
    if (value.version === undefined)
      throw new BadRequestException("Falta la versión del proyecto.");
    return this.admin(
      await this.repo.update(id, value.version, {
        draft: value,
        updatedAt: new Date().toISOString(),
      }),
    );
  }
  async publish(id: string, version: number) {
    const d = await this.repo.get(id);
    const value = await this.validated(d.draft);
    if (
      !value.coverId ||
      !value.images.find((i) => i.id === value.coverId)?.alt.trim()
    )
      throw new BadRequestException(
        "Selecciona una portada y escribe su descripción.",
      );
    if (plainText(value.body).trim().length < 60)
      throw new BadRequestException(
        "Describe el proyecto con al menos 60 caracteres antes de publicarlo.",
      );
    if (value.images.some((i) => !i.alt.trim()))
      throw new BadRequestException(
        "Describe todas las fotos para accesibilidad y SEO.",
      );
    const now = new Date().toISOString();
    const published = {
      version: version + 1,
      ...value,
      id,
      slug: d.slug,
      status: "published",
      seo: seoFor(value, d.slug),
      createdAt: d.createdAt,
      updatedAt: now,
      publishedAt: d.published?.publishedAt || now,
    };
    return this.admin(
      await this.repo.update(id, version, {
        published,
        publishedVersion: version + 1,
        updatedAt: now,
      }),
    );
  }
  async unpublish(id: string, version: number) {
    return this.admin(
      await this.repo.update(id, version, {
        published: null,
        publishedVersion: null,
        updatedAt: new Date().toISOString(),
      }),
    );
  }
  async publicList(
    q: string,
    category: string,
    featured: boolean,
    page: number,
  ) {
    const filter: any = { published: { $ne: null } };
    if (category) filter["published.category"] = category;
    if (featured) filter["published.featured"] = true;
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = ["title", "excerpt", "location", "tags"].map((k) => ({
        ["published." + k]: { $regex: escaped, $options: "i" },
      }));
    }
    const limit = 12;
    const docs = await this.repo.collection
      .find(filter)
      .sort(
        featured
          ? { "published.featuredOrder": 1, "published.publishedAt": -1 }
          : { "published.publishedAt": -1 },
      )
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    return {
      items: docs.map((d) => d.published),
      total: await this.repo.collection.countDocuments(filter),
      page,
      pageSize: limit,
    };
  }
  async publicOne(slug: string) {
    const d = await this.repo.collection.findOne({
      slug,
      published: { $ne: null },
    });
    if (!d) throw new NotFoundException();
    return d.published;
  }
  async sitemap() {
    return (
      await this.repo.collection
        .find(
          { published: { $ne: null } },
          {
            projection: {
              slug: 1,
              "published.updatedAt": 1,
              "published.category": 1,
            },
          },
        )
        .toArray()
    ).map((d) => ({
      slug: d.slug,
      updatedAt: d.published!.updatedAt,
      category: d.published!.category,
    }));
  }
}
