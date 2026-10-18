import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { ObjectId } from "mongodb";
import { z } from "zod";
import {
  PHOTO_TAGS,
  photoMetadataSchema,
  requestSchema,
  segmentSchema,
  stageSchema,
  type GalleryPhoto,
  type GalleryPage,
} from "@veca/content";
import { parse } from "../common/validation";
import { CrmFiles, type AttachmentDocument } from "../crm/crm.files";
const filtersSchema = z
  .object({
    search: z.string().trim().max(120).default(""),
    sharing: z.enum(["", "internal", "clients"]).default(""),
    tag: z.union([z.literal(""), z.enum(PHOTO_TAGS)]).default(""),
    stage: z.union([z.literal(""), stageSchema]).default(""),
    segment: z.union([z.literal(""), segmentSchema]).default(""),
    requestType: z.union([z.literal(""), requestSchema]).default(""),
    page: z.coerce.number().int().min(1).max(10000).default(1),
  })
  .strict();
const updateSchema = photoMetadataSchema
  .extend({ revision: z.number().int().min(0) })
  .strict();
type JoinedPhoto = AttachmentDocument & { lead: GalleryPhoto["lead"] };
@Injectable()
export class GalleryService {
  constructor(private readonly files: CrmFiles) {}
  view(doc: JoinedPhoto): GalleryPhoto {
    return {
      ...this.files.view(doc),
      url: `/admin/gallery/photos/${doc._id}`,
      lead: doc.lead,
    };
  }
  async list(query: unknown): Promise<GalleryPage> {
    const data = parse(filtersSchema, query);
    const match: Record<string, unknown> = { type: "photo" };
    if (data.sharing === "internal") match.sharing = { $ne: "clients" };
    if (data.sharing === "clients") match.sharing = "clients";
    if (data.tag) match.tags = data.tag;
    const after: Record<string, unknown> = {};
    for (const field of ["stage", "segment", "requestType"] as const)
      if (data[field]) after[`lead.${field}`] = data[field];
    if (data.search) {
      const regex = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      after.$or = ["caption", "name", "lead.name", "lead.district"].map(
        (field) => ({ [field]: { $regex: regex, $options: "i" } }),
      );
    }
    const [result] = await this.files.collection
      .aggregate<{
        items: JoinedPhoto[];
        count: { total: number }[];
      }>(
        [
          { $match: match },
          {
            $addFields: {
              leadObjectId: {
                $convert: {
                  input: "$leadId",
                  to: "objectId",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },
          {
            $lookup: {
              from: "crm_leads",
              localField: "leadObjectId",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    _id: 0,
                    id: { $toString: "$_id" },
                    name: 1,
                    district: 1,
                    requestType: 1,
                    stage: 1,
                    segment: 1,
                  },
                },
              ],
              as: "lead",
            },
          },
          { $unwind: "$lead" },
          { $match: after },
          {
            $facet: {
              items: [
                { $sort: { createdAt: -1, _id: -1 } },
                { $skip: (data.page - 1) * 36 },
                { $limit: 36 },
              ],
              count: [{ $count: "total" }],
            },
          },
        ],
        { maxTimeMS: 5000 },
      )
      .toArray();
    const total = result?.count[0]?.total || 0;
    return {
      items: (result?.items || []).map((d) => this.view(d)),
      total,
      page: data.page,
      pages: Math.ceil(total / 36),
    };
  }
  async update(id: string, input: unknown, actor: string) {
    if (!ObjectId.isValid(id)) throw new NotFoundException();
    const { revision, ...data } = parse(updateSchema, input);
    const doc = await this.files.collection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        type: "photo",
        ...(revision === 0
          ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] }
          : { revision }),
      },
      {
        $set: {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: actor,
        },
        $inc: { revision: 1 },
      },
      { returnDocument: "after" },
    );
    if (!doc)
      throw new ConflictException(
        "La foto cambió en otra ventana o ya no está disponible. Cierra y recarga la galería.",
      );
    return this.files.view(doc);
  }
  async read(id: string) {
    if (!ObjectId.isValid(id)) throw new NotFoundException();
    // Check the kind before retrieving an object: gallery permission never grants access to contracts.
    if (
      !(await this.files.collection.findOne({
        _id: new ObjectId(id),
        type: "photo",
      }))
    )
      throw new NotFoundException();
    return this.files.read(id);
  }
}
