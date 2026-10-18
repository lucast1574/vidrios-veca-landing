import { z } from "zod";
export const PERMISSIONS = [
  "dashboard",
  "projects",
  "leads",
  "inventory",
  "users",
] as const;
export type Permission = (typeof PERMISSIONS)[number];
export const ROLES = [
  {
    id: "admin",
    name: "Administrador",
    description: "Administra usuarios, accesos y toda la operación.",
    permissions: ["dashboard", "projects", "leads", "inventory", "users"],
  },
  {
    id: "management",
    name: "Gerencia",
    description: "Supervisa proyectos, atención comercial, obras y almacén.",
    permissions: ["dashboard", "projects", "leads", "inventory"],
  },
  {
    id: "commercial",
    name: "Comercial",
    description: "Gestiona oportunidades y publica proyectos.",
    permissions: ["dashboard", "projects", "leads"],
  },
  {
    id: "operations",
    name: "Operaciones",
    description: "Coordina obras y registra el uso de materiales.",
    permissions: ["dashboard", "leads", "inventory"],
  },
  {
    id: "warehouse",
    name: "Almacén",
    description: "Controla materiales, entradas y existencias.",
    permissions: ["dashboard", "inventory"],
  },
  {
    id: "accounting",
    name: "Contabilidad",
    description: "Consulta el resumen general de la empresa.",
    permissions: ["dashboard"],
  },
  {
    id: "viewer",
    name: "Consulta",
    description: "Consulta el resumen sin modificar la operación.",
    permissions: ["dashboard"],
  },
] as const;
export const roleSchema = z.enum([
  "admin",
  "management",
  "commercial",
  "operations",
  "warehouse",
  "accounting",
  "viewer",
]);
export type Role = z.infer<typeof roleSchema>;
export const accountStatusSchema = z.enum([
  "pending",
  "active",
  "rejected",
  "suspended",
]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export function permissionsFor(role: Role | null): Permission[] {
  return [...(ROLES.find((r) => r.id === role)?.permissions || [])];
}
export type SessionUser = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: Role | null;
  status: AccountStatus;
  emailVerified: boolean;
  permissions: Permission[];
};
export type UserSummary = SessionUser & {
  createdAt: string;
  revision: number;
  provider: "google" | "password";
};
export type AuthSession = { user: SessionUser; csrf: string };
