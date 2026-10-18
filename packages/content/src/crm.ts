import { z } from "zod";
export const LEAD_STAGES = [
  { id: "prelead", name: "Prelead" },
  { id: "contacted", name: "Lead contactado" },
  { id: "coordination", name: "Coordinación" },
  { id: "execution", name: "Obra en ejecución" },
  { id: "completed", name: "Obra realizada" },
  { id: "discarded", name: "Descartado" },
] as const;
export const LEAD_SEGMENTS = [
  {
    id: "high",
    name: "High ticket",
    description: "Viviendas de lujo y remodelaciones de mayor valor",
  },
  {
    id: "low",
    name: "Low ticket",
    description: "Arreglos y viviendas pequeñas",
  },
  {
    id: "large",
    name: "Obras grandes",
    description: "Edificios y proyectos de gran escala",
  },
] as const;
export const REQUEST_TYPES = [
  {
    id: "repair",
    name: "Arreglo o reemplazo",
    description: "Una ventana, un vidrio o un detalle puntual",
    segment: "low",
  },
  {
    id: "home",
    name: "Casa o departamento",
    description: "Mejoras y soluciones para tu hogar",
    segment: "low",
  },
  {
    id: "premium",
    name: "Residencia o remodelación integral",
    description: "Un proyecto residencial de mayor alcance",
    segment: "high",
  },
  {
    id: "building",
    name: "Edificio u obra de gran escala",
    description: "Fachadas y proyectos inmobiliarios",
    segment: "large",
  },
] as const;
export const stageSchema = z.enum([
  "prelead",
  "contacted",
  "coordination",
  "execution",
  "completed",
  "discarded",
]);
export const segmentSchema = z.enum(["high", "low", "large"]);
export const requestSchema = z.enum(["repair", "home", "premium", "building"]);
const text = (max: number) => z.string().trim().max(max);
export const contactFields = {
  name: text(100).min(2, "Escribe tu nombre."),
  email: text(180).email("Escribe un correo válido."),
  phone: text(30).regex(/^\+?[\d ()-]{7,30}$/, "Escribe un teléfono válido."),
  district: text(120).min(2, "Indica el distrito."),
  requestType: requestSchema,
  idea: text(4000).min(10, "Cuéntanos un poco más de tu proyecto."),
};
export const publicLeadSchema = z
  .object({
    ...contactFields,
    submissionId: z.string().uuid(),
    website: text(200).optional().default(""),
  })
  .strict();
export const leadUpdateSchema = z
  .object({
    ...contactFields,
    version: z.number().int().positive(),
    segment: segmentSchema,
    stage: stageSchema,
    assignedTo: text(100),
    contactResult: text(1000),
    appointment: text(40),
    address: text(500),
    workPlan: text(6000),
    contractStatus: z.enum([
      "pending",
      "preparing",
      "sent",
      "signed",
      "not_required",
    ]),
    contractReference: text(500),
    completionNote: text(3000),
    discardReason: text(1000),
  })
  .strict();
export type LeadStage = z.infer<typeof stageSchema>;
export type LeadInput = z.infer<typeof leadUpdateSchema>;
export type LeadEvent = {
  at: string;
  actor: string;
  kind: string;
  text: string;
  from?: LeadStage;
  to?: LeadStage;
};
export type Lead = Omit<LeadInput, "version"> & {
  id: string;
  version: number;
  source: "web" | "manual";
  createdAt: string;
  updatedAt: string;
  contactedAt: string | null;
  completedAt: string | null;
  events: LeadEvent[];
};
export const MATERIAL_UNITS = [
  { id: "m2", name: "m²" },
  { id: "m", name: "Metro lineal" },
  { id: "unit", name: "Unidad" },
  { id: "kg", name: "kg" },
  { id: "l", name: "Litro" },
] as const;
export const MATERIAL_CATEGORIES = [
  "Vidrio",
  "Aluminio",
  "Herrajes",
  "Selladores",
  "Otros",
] as const;
export const quantitySchema = z
  .number()
  .finite()
  .positive()
  .max(1_000_000)
  .refine(
    (n) => Math.abs(n * 1000 - Math.round(n * 1000)) < 0.000001,
    "Usa hasta tres decimales.",
  );
export const materialSchema = z
  .object({
    sku: text(60)
      .min(1)
      .transform((s) => s.toUpperCase()),
    name: text(160).min(2),
    unit: z.enum(["m2", "m", "unit", "kg", "l"]),
    category: z.enum(MATERIAL_CATEGORIES),
    location: text(200),
    description: text(1000),
    minimum: z.number().finite().min(0).max(1_000_000),
  })
  .strict();
export const movementSchema = z
  .object({
    operationId: z.string().uuid(),
    kind: z.enum(["receipt", "consumption", "return"]),
    quantity: quantitySchema,
    leadId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .nullable(),
    reason: text(1000).min(4, "Indica el motivo o detalle del movimiento."),
  })
  .strict();
export type Material = z.infer<typeof materialSchema> & {
  id: string;
  balance: number;
  version: number;
  updatedAt: string;
};
export type Movement = {
  id: string;
  materialId: string;
  materialName: string;
  unit: string;
  leadId: string | null;
  kind: "receipt" | "consumption" | "return";
  quantity: number;
  reason: string;
  actor: string;
  at: string;
  balanceAfter: number;
};
export const PHOTO_TAGS = [
  "Antes",
  "Avance",
  "Resultado",
  "Detalle",
  "Instalación",
  "Materiales",
] as const;
export const photoMetadataSchema = z
  .object({
    caption: z.string().trim().max(500).default(""),
    tags: z
      .array(z.enum(PHOTO_TAGS))
      .max(6)
      .refine((v) => new Set(v).size === v.length)
      .default([]),
    sharing: z.enum(["internal", "clients"]).default("internal"),
  })
  .strict();
export type PhotoMetadata = z.infer<typeof photoMetadataSchema>;
export type GalleryPhoto = LeadAttachment & {
  lead: Pick<
    Lead,
    "id" | "name" | "district" | "requestType" | "segment" | "stage"
  >;
};
export type GalleryPage = {
  items: GalleryPhoto[];
  total: number;
  page: number;
  pages: number;
};
export type LeadAttachment = PhotoMetadata & {
  revision: number;
  id: string;
  leadId: string;
  name: string;
  type: "photo" | "contract";
  caption: string;
  url: string;
  createdAt: string;
};
export const crmLeadDefaults = {
  assignedTo: "",
  contactResult: "",
  appointment: "",
  address: "",
  workPlan: "",
  contractStatus: "pending" as const,
  contractReference: "",
  completionNote: "",
  discardReason: "",
};
