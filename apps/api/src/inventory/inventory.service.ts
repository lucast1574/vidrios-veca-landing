import { CrmEvents } from "../crm/crm.events";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { ObjectId } from "mongodb";
import {
  materialSchema,
  movementSchema,
  type Material,
  type Movement,
} from "@veca/content";
import { Database } from "../database/database.module";
import { parse } from "../common/validation";
import { CrmRepository } from "../crm/crm.repository";
type StoredMovement = Movement & { _id: string; fingerprint: string };
type MaterialDocument = Omit<Material, "id" | "balance" | "minimum"> & {
  _id: ObjectId;
  balanceMilli: number;
  minimumMilli: number;
  pending: StoredMovement[];
};
@Injectable()
export class InventoryService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private timer?: ReturnType<typeof setInterval>;
  constructor(
    private readonly database: Database,
    private readonly leads: CrmRepository,
    private readonly events: CrmEvents,
  ) {}
  get materials() {
    return this.database.db.collection<MaterialDocument>("inventory_materials");
  }
  get ledger() {
    return this.database.db.collection<StoredMovement>("inventory_movements");
  }
  async onApplicationBootstrap() {
    await this.flush().catch(() => {});
    this.timer = setInterval(() => void this.flush().catch(() => {}), 15000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  id(id: string) {
    if (!ObjectId.isValid(id))
      throw new NotFoundException("Material no encontrado.");
    return new ObjectId(id);
  }
  view(doc: MaterialDocument): Material {
    const { _id, balanceMilli, minimumMilli, pending, ...rest } = doc;
    return {
      ...rest,
      id: String(_id),
      balance: balanceMilli / 1000,
      minimum: minimumMilli / 1000,
    };
  }
  /** Stock and its pending audit event commit together in one MongoDB document.
   * The outbox is drained idempotently to the append-only ledger. A crash between
   * writes cannot lose a movement or apply its stock change a second time. */
  async flush(materialId?: ObjectId) {
    const docs = await this.materials
      .find({
        ...(materialId ? { _id: materialId } : {}),
        "pending.0": { $exists: true },
      })
      .limit(100)
      .toArray();
    for (const doc of docs)
      for (const event of doc.pending) {
        await this.ledger.updateOne(
          { _id: event._id },
          { $setOnInsert: event },
          { upsert: true },
        );
        await this.materials.updateOne(
          { _id: doc._id },
          { $pull: { pending: { _id: event._id } } },
        );
      }
  }
  async list(search = "") {
    const safe = search
      .trim()
      .slice(0, 80)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = safe
      ? {
          $or: [
            { name: { $regex: safe, $options: "i" } },
            { sku: { $regex: safe, $options: "i" } },
          ],
        }
      : {};
    const docs = await this.materials
      .find(filter)
      .sort({ name: 1 })
      .limit(1000)
      .toArray();
    return docs.map((d) => this.view(d));
  }
  async create(input: unknown) {
    const data = parse(materialSchema, input);
    const { minimum, ...fields } = data;
    const now = new Date().toISOString();
    const doc: MaterialDocument = {
      ...fields,
      _id: new ObjectId(),
      minimumMilli: Math.round(minimum * 1000),
      balanceMilli: 0,
      pending: [],
      version: 1,
      updatedAt: now,
    };
    try {
      await this.materials.insertOne(doc);
    } catch (e) {
      if ((e as { code?: number }).code === 11000)
        throw new ConflictException("Ya existe un material con ese código.");
      throw e;
    }
    this.events.emit("inventory");
    return this.view(doc);
  }
  async move(materialId: string, input: unknown, actor: string) {
    const data = parse(movementSchema, input);
    const id = this.id(materialId);
    const key = `${materialId}:${data.operationId}`;
    const fingerprint = JSON.stringify(data);
    await this.flush(id);
    const old = await this.ledger.findOne({ _id: key });
    if (old) {
      if (old.fingerprint !== fingerprint)
        throw new ConflictException(
          "La referencia de este movimiento ya fue utilizada con otros datos.",
        );
      return old;
    }
    if (data.kind !== "receipt" && !data.leadId)
      throw new BadRequestException(
        "Asocia el consumo o devolución a una obra.",
      );
    if (data.leadId) {
      const lead = await this.leads.get(data.leadId);
      if (!["execution", "completed"].includes(lead.stage))
        throw new BadRequestException(
          "Registra materiales cuando la obra esté en ejecución o realizada.",
        );
    }
    const doc = await this.materials.findOne({ _id: id });
    if (!doc) throw new NotFoundException("Material no encontrado.");
    const pending = doc.pending.find((e) => e._id === key);
    if (pending) {
      if (pending.fingerprint !== fingerprint)
        throw new ConflictException(
          "Movimiento repetido con datos diferentes.",
        );
      await this.flush(id);
      return pending;
    }
    const milli = Math.round(data.quantity * 1000),
      delta = data.kind === "consumption" ? -milli : milli;
    const event: StoredMovement = {
      _id: key,
      id: key,
      fingerprint,
      materialId,
      materialName: doc.name,
      unit: doc.unit,
      leadId: data.leadId,
      kind: data.kind,
      quantity: milli / 1000,
      reason: data.reason,
      actor,
      at: new Date().toISOString(),
      balanceAfter: 0,
    };
    // Optimistic revision makes balanceAfter exact even when other operators use
    // the same material simultaneously. Reattempting is safe with operationId.
    const result = await this.materials.findOneAndUpdate(
      {
        _id: id,
        version: doc.version,
        "pending._id": { $ne: key },
        ...(delta < 0 ? { balanceMilli: { $gte: milli } } : {}),
      },
      {
        $inc: { balanceMilli: delta, version: 1 },
        $set: { updatedAt: event.at },
        $push: {
          pending: {
            ...event,
            balanceAfter: (doc.balanceMilli + delta) / 1000,
          },
        },
      },
      { returnDocument: "after" },
    );
    if (!result) {
      await this.flush(id);
      const duplicate = await this.ledger.findOne({ _id: key });
      if (duplicate) {
        if (duplicate.fingerprint !== fingerprint)
          throw new ConflictException(
            "Movimiento repetido con datos diferentes.",
          );
        return duplicate;
      }
      throw new ConflictException(
        "Stock insuficiente o actualizado por otra persona. Revisa el saldo y vuelve a intentar.",
      );
    }
    this.events.emit("inventory");
    await this.flush(id);
    return { ...event, balanceAfter: result.balanceMilli / 1000 };
  }
  async movements(leadId?: string, materialId?: string, page = 1) {
    if (leadId) await this.leads.get(leadId);
    await this.flush();
    const filter = {
      ...(leadId ? { leadId } : {}),
      ...(materialId ? { materialId } : {}),
    };
    const docs = await this.ledger
      .find(filter)
      .sort({ at: -1, _id: -1 })
      .skip((Math.max(1, page) - 1) * 100)
      .limit(100)
      .toArray();
    return docs.map(({ _id, fingerprint, ...rest }) => rest);
  }
}
