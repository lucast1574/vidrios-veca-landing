import { Gauge, LayoutGrid, Kanban, Package, Users } from "lucide-react";
import type { Permission } from "@veca/content";
export type WorkspaceView = Permission | "profile";
export const WORKSPACE_ITEMS = [
  {
    id: "dashboard",
    label: "Resumen",
    description: "Tu día en VECA",
    Icon: Gauge,
    group: "Seguimiento",
  },
  {
    id: "leads",
    label: "Oportunidades",
    description: "Consultas y obras",
    Icon: Kanban,
    group: "Seguimiento",
  },
  {
    id: "projects",
    label: "Proyectos",
    description: "El trabajo que publicamos",
    Icon: LayoutGrid,
    group: "Seguimiento",
  },
  {
    id: "inventory",
    label: "Inventario",
    description: "Materiales y movimientos",
    Icon: Package,
    group: "Empresa",
  },
  {
    id: "users",
    label: "Equipo",
    description: "Personas y accesos",
    Icon: Users,
    group: "Empresa",
  },
] as const;
export const VIEW_LABELS: Record<WorkspaceView, string> = {
  ...Object.fromEntries(WORKSPACE_ITEMS.map((item) => [item.id, item.label])),
  profile: "Mi perfil",
} as Record<WorkspaceView, string>;
export function currentView(): WorkspaceView {
  const section = location.hash.slice(1).split("/")[0];
  return section === "profile" ||
    WORKSPACE_ITEMS.some((item) => item.id === section)
    ? (section as WorkspaceView)
    : "dashboard";
}
