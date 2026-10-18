import { CrmEvents } from "./crm.events";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import type { Filter } from "mongodb";
import {
  crmLeadDefaults,
  LEAD_STAGES,
  REQUEST_TYPES,
  leadUpdateSchema,
  publicLeadSchema,
  type LeadInput,
} from "@veca/content";
import { parse } from "../common/validation";
import { CrmRepository, type LeadDocument } from "./crm.repository";
@Injectable()
export class CrmService {
  constructor(
    readonly repository: CrmRepository,
    private readonly events: CrmEvents,
  ) {}
  async create(
    input: unknown,
    source: "web" | "manual" = "web",
    actor = "Web",
  ) {
    const data = parse(publicLeadSchema, input);
    if (data.website) return { reference: "received" };
    const existing = await this.repository.collection.findOne({
      submissionId: data.submissionId,
    });
    if (existing) return { reference: String(existing._id) };
    const { submissionId, website, ...fields } = data;
    const now = new Date().toISOString();
    const doc: LeadDocument = {
      _id: new ObjectId(),
      ...fields,
      ...crmLeadDefaults,
      submissionId,
      source,
      segment: REQUEST_TYPES.find((t) => t.id === data.requestType)!.segment,
      stage: "prelead",
      version: 1,
      createdAt: now,
      updatedAt: now,
      contactedAt: null,
      completedAt: null,
      events: [
        {
          at: now,
          actor,
          kind: "created",
          text:
            source === "web"
              ? "Consulta recibida desde la web."
              : "Oportunidad registrada por el equipo.",
        },
      ],
    };
    try {
      await this.repository.collection.insertOne(doc);
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
      const old = await this.repository.collection.findOne({ submissionId });
      return { reference: String(old!._id) };
    }
    this.events.emit("leads");
    return { reference: String(doc._id) };
  }
  async list(search: string, page: number, stage?: string, segment?: string) {
    if (!Number.isInteger(page) || page < 1 || page > 10000)
      throw new BadRequestException("Página inválida.");
    const safe = search
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter: Filter<LeadDocument> = {
      ...(["high", "low", "large"].includes(segment || "")
        ? { segment: segment as LeadDocument["segment"] }
        : {}),
      ...(safe
        ? {
            $or: ["name", "email", "phone", "district", "idea"].map((k) => ({
              [k]: { $regex: safe, $options: "i" },
            })),
          }
        : {}),
      ...(LEAD_STAGES.some((s) => s.id === stage)
        ? { stage: stage as LeadDocument["stage"] }
        : {}),
    };
    const size = 100;
    const p = Math.max(1, Math.min(page || 1, 10000));
    const [docs, total, counts] = await Promise.all([
      this.repository.collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((p - 1) * size)
        .limit(size)
        .toArray(),
      this.repository.collection.countDocuments(filter),
      this.repository.collection
        .aggregate<{
          _id: string;
          count: number;
        }>([{ $group: { _id: "$stage", count: { $sum: 1 } } }])
        .toArray(),
    ]);
    return {
      items: docs.map((d) => this.repository.view(d)),
      total,
      page: p,
      pageSize: size,
      counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
    };
  }
  async get(id: string) {
    return this.repository.view(await this.repository.get(id));
  }
  async update(id: string, input: unknown, actor: string) {
    const data = parse(leadUpdateSchema, input);
    // A datetime-local value from the panel represents Lima, not the server timezone.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data.appointment))
      data.appointment += ":00-05:00";
    const old = await this.repository.get(id);
    const stages = [
      "prelead",
      "contacted",
      "coordination",
      "execution",
      "completed",
    ];
    const changed = data.stage !== old.stage;
    if (changed) {
      const next = stages.indexOf(old.stage) + 1;
      if (old.stage === "discarded" && data.stage !== "prelead")
        throw new BadRequestException(
          "Reabre primero la oportunidad como prelead.",
        );
      if (
        old.stage !== "discarded" &&
        data.stage !== "discarded" &&
        data.stage !== stages[next]
      )
        throw new BadRequestException(
          "Avanza una etapa a la vez para conservar el seguimiento.",
        );
    }
    if (data.stage === "discarded" && !data.discardReason.trim())
      throw new BadRequestException(
        "Indica por qué se descarta la oportunidad.",
      );
    if (
      data.stage !== "discarded" &&
      data.stage !== "prelead" &&
      !data.contactResult.trim()
    )
      throw new BadRequestException(
        "Registra el contacto exitoso con el cliente.",
      );
    if (
      ["coordination", "execution", "completed"].includes(data.stage) &&
      (!data.appointment || !Number.isFinite(Date.parse(data.appointment)))
    )
      throw new BadRequestException(
        "Registra la fecha y hora de coordinación.",
      );
    if (
      ["execution", "completed"].includes(data.stage) &&
      (!data.address.trim() || !data.workPlan.trim())
    )
      throw new BadRequestException(
        "Completa la dirección y el alcance de la obra.",
      );
    if (data.stage === "completed" && !data.completionNote.trim())
      throw new BadRequestException(
        "Registra el resultado y cierre de la obra.",
      );
    if (data.appointment && !Number.isFinite(Date.parse(data.appointment)))
      throw new BadRequestException("Fecha de coordinación inválida.");
    if (data.contractStatus === "signed" && !data.contractReference.trim())
      throw new BadRequestException(
        "Indica la referencia del contrato firmado.",
      );
    const { version, ...set } = data;
    const at = new Date().toISOString();
    const saved = await this.repository.change(
      id,
      version,
      {
        ...set,
        ...(changed && data.stage === "contacted" ? { contactedAt: at } : {}),
        ...(changed && data.stage === "completed" ? { completedAt: at } : {}),
      },
      {
        at,
        actor,
        kind: changed ? "stage" : "updated",
        text: changed
          ? `Etapa: ${LEAD_STAGES.find((s) => s.id === data.stage)!.name}.`
          : "Datos de la ficha actualizados.",
        ...(changed ? { from: old.stage, to: data.stage } : {}),
      },
    );
    this.events.emit("leads");
    return saved;
  }
  async note(id: string, version: number, text: string, actor: string) {
    if (!text.trim() || text.length > 4000)
      throw new BadRequestException(
        "Escribe una nota de hasta 4000 caracteres.",
      );
    const saved = await this.repository.change(
      id,
      version,
      {},
      { at: new Date().toISOString(), actor, kind: "note", text: text.trim() },
    );
    this.events.emit("leads");
    return saved;
  }
}
