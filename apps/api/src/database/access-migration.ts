import type { Db } from "mongodb";
// Initial data only: runtime names, permissions and defaults live in MongoDB.
const initialRoles = [
  {
    id: "admin",
    name: "Administrador",
    description: "Administra usuarios, accesos y toda la operación.",
    permissions: [
      "dashboard",
      "projects",
      "leads",
      "gallery",
      "inventory",
      "users",
    ],
  },
  {
    id: "management",
    name: "Gerencia",
    description: "Supervisa proyectos, atención comercial, obras y almacén.",
    permissions: ["dashboard", "projects", "leads", "gallery", "inventory"],
  },
  {
    id: "commercial",
    name: "Comercial",
    description: "Gestiona oportunidades y publica proyectos.",
    permissions: ["dashboard", "projects", "leads", "gallery"],
  },
  {
    id: "operations",
    name: "Operaciones",
    description: "Coordina obras y registra el uso de materiales.",
    permissions: ["dashboard", "leads", "gallery", "inventory"],
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

export async function migrateAccess(db: Db) {
  const migrations = db.collection("schema_migrations");
  if (!(await migrations.findOne({ name: "database-roles-v1" }))) {
    await db.collection("roles").createIndex({ id: 1 }, { unique: true });
    await db.collection("roles").bulkWrite(
      initialRoles.map((role) => ({
        updateOne: {
          filter: { id: role.id },
          update: {
            $setOnInsert: {
              ...role,
              revision: 1,
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      })),
    );
    await db.collection("access_settings").updateOne(
      { name: "defaults" },
      {
        $setOnInsert: {
          corporateDomain: "veca.com.pe",
          corporateRole: "management",
          bootstrapRole: "admin",
        },
      },
      { upsert: true },
    );
    await migrations.updateOne(
      { name: "database-roles-v1" },
      {
        $setOnInsert: { completedAt: new Date() },
      },
      { upsert: true },
    );
  }
  // Grant the photo library once to roles that already manage these same private lead photos.
  if (!(await migrations.findOne({ name: "private-gallery-v1" }))) {
    await db
      .collection("roles")
      .updateMany(
        { permissions: "leads", $nor: [{ permissions: "gallery" }] },
        { $addToSet: { permissions: "gallery" }, $inc: { revision: 1 } },
      );
    await migrations.updateOne(
      { name: "private-gallery-v1" },
      { $setOnInsert: { completedAt: new Date() } },
      { upsert: true },
    );
  }
}
