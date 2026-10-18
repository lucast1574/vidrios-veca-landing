import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ObjectId } from "mongodb";
import sharp from "sharp";
import { Database } from "../database/database.module";
import { StorageService } from "../media/storage.service";
import { CrmRepository } from "./crm.repository";
import type { LeadAttachment } from "@veca/content";
type AttachmentDocument = Omit<LeadAttachment, "id" | "url"> & {
  _id: ObjectId;
  key: string;
  mime: string;
};
@Injectable()
export class CrmFiles {
  constructor(
    private readonly database: Database,
    private readonly storage: StorageService,
    private readonly leads: CrmRepository,
  ) {}
  get collection() {
    return this.database.db.collection<AttachmentDocument>("crm_files");
  }
  view(d: AttachmentDocument): LeadAttachment {
    return {
      id: String(d._id),
      leadId: d.leadId,
      name: d.name,
      type: d.type,
      caption: d.caption,
      createdAt: d.createdAt,
      url: `/admin/crm/files/${d._id}`,
    };
  }
  async list(leadId: string) {
    await this.leads.get(leadId);
    return (
      await this.collection
        .find({ leadId })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray()
    ).map((d) => this.view(d));
  }
  async upload(leadId: string, file: Express.Multer.File, caption: string) {
    await this.leads.get(leadId);
    if (!file)
      throw new BadRequestException("Selecciona una foto o contrato PDF.");
    const pdf = file.buffer.subarray(0, 5).toString() === "%PDF-";
    let body = file.buffer;
    if (!pdf) {
      try {
        const image = sharp(file.buffer, {
          limitInputPixels: 40_000_000,
          animated: false,
          failOn: "error",
        });
        const meta = await image.metadata();
        if (!["jpeg", "png", "webp", "avif"].includes(meta.format || ""))
          throw Error();
        body = await image
          .rotate()
          .resize({
            width: 2400,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw new BadRequestException(
          "Sube fotos JPG, PNG, WebP o AVIF, o un contrato PDF de hasta 12 MB.",
        );
      }
    }
    const id = new ObjectId();
    const doc: AttachmentDocument = {
      _id: id,
      leadId,
      name:
        file.originalname.replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 150) ||
        "Archivo",
      type: pdf ? "contract" : "photo",
      caption: String(caption || "")
        .trim()
        .slice(0, 500),
      createdAt: new Date().toISOString(),
      key: `veca/leads/${leadId}/${id}.${pdf ? "pdf" : "webp"}`,
      mime: pdf ? "application/pdf" : "image/webp",
    };
    await this.storage.put(doc.key, body, doc.mime);
    await this.collection.insertOne(doc);
    return this.view(doc);
  }
  async read(id: string) {
    if (!ObjectId.isValid(id)) throw new NotFoundException();
    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!doc) throw new NotFoundException();
    return { doc, file: await this.storage.get(doc.key) };
  }
}
