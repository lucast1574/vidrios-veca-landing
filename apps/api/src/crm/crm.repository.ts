import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { ObjectId } from "mongodb";
import type { Lead, LeadEvent, LeadInput } from "@veca/content";
import { Database } from "../database/database.module";
export type LeadDocument = Omit<Lead, "id"> & {
  _id: ObjectId;
  submissionId: string;
};
@Injectable()
export class CrmRepository {
  constructor(private readonly database: Database) {}
  get collection() {
    return this.database.db.collection<LeadDocument>("crm_leads");
  }
  id(id: string) {
    if (!ObjectId.isValid(id))
      throw new NotFoundException("Oportunidad no encontrada.");
    return new ObjectId(id);
  }
  async get(id: string) {
    const doc = await this.collection.findOne({ _id: this.id(id) });
    if (!doc) throw new NotFoundException("Oportunidad no encontrada.");
    return doc;
  }
  view(doc: LeadDocument): Lead {
    const { _id, submissionId, ...rest } = doc;
    return { ...rest, id: String(_id) };
  }
  async change(
    id: string,
    version: number,
    set: Partial<LeadInput> & Record<string, unknown>,
    event: LeadEvent,
  ) {
    const doc = await this.collection.findOneAndUpdate(
      { _id: this.id(id), version },
      {
        $set: { ...set, updatedAt: new Date().toISOString() },
        $inc: { version: 1 },
        $push: { events: event },
      },
      { returnDocument: "after" },
    );
    if (!doc)
      throw new ConflictException(
        "Esta ficha cambió en otra ventana. Recárgala antes de guardar.",
      );
    return this.view(doc);
  }
}
