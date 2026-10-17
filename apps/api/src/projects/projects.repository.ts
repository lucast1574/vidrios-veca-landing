import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import type { ProjectDocument } from "./project.document";
import { ObjectId } from "mongodb";
import { Database } from "../database/database.module";
@Injectable()
export class ProjectsRepository {
  constructor(private readonly database: Database) {}
  get collection() {
    return this.database.db.collection<ProjectDocument>("projects");
  }
  id(id: string) {
    if (!ObjectId.isValid(id))
      throw new NotFoundException("Proyecto no encontrado.");
    return new ObjectId(id);
  }
  async get(id: string) {
    const d = await this.collection.findOne({ _id: this.id(id) });
    if (!d) throw new NotFoundException("Proyecto no encontrado.");
    return d;
  }
  async update(id: string, version: number, set: object) {
    const d = await this.collection.findOneAndUpdate(
      { _id: this.id(id), version },
      { $set: set, $inc: { version: 1 } },
      { returnDocument: "after" },
    );
    if (!d)
      throw new ConflictException(
        "Otra ventana modificó este proyecto. Recarga antes de guardar.",
      );
    return d;
  }
}
