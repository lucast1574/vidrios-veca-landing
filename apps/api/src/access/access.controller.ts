import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { ROLES, roleSchema, accountStatusSchema } from "@veca/content";
import { Database } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { AuthService } from "../auth/auth.service";
import { AdminGuard } from "../auth/admin.guard";
import type { AuthenticatedRequest, UserDocument } from "../auth/auth.types";
import { parse } from "../common/validation";
import { MailService } from "../mail/mail.service";
import { panelAction } from "../mail/templates";
@UseGuards(AdminGuard)
@Controller("admin/users")
class UsersController {
  constructor(
    private readonly database: Database,
    private readonly auth: AuthService,
    private readonly mail: MailService,
  ) {}
  @Get() async list(@Query("page") page = "1", @Query("search") search = "") {
    const p = parse(z.coerce.number().int().min(1).max(10000), page);
    const safe = search
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = safe
      ? {
          $or: [
            { name: { $regex: safe, $options: "i" } },
            { email: { $regex: safe, $options: "i" } },
            { username: { $regex: safe, $options: "i" } },
          ],
        }
      : {};
    const [items, total, pending] = await Promise.all([
      this.auth.users
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((p - 1) * 50)
        .limit(50)
        .toArray(),
      this.auth.users.countDocuments(filter),
      this.auth.users.countDocuments({
        status: "pending",
        emailVerified: true,
      }),
    ]);
    return {
      items: items.map((u) => ({
        ...this.auth.view(u),
        createdAt: (u.createdAt || new Date(0)).toISOString(),
        revision: u.revision || 1,
        provider: u.provider || "password",
      })),
      total,
      pending,
      page: p,
    };
  }
  @Put(":id") async update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = parse(
      z
        .object({
          role: roleSchema,
          status: accountStatusSchema,
          revision: z.number().int().positive(),
        })
        .strict(),
      body,
    );
    if (id === req.session.user.id)
      throw new ForbiddenException(
        "Otro administrador debe modificar tu acceso. Así evitamos que pierdas el control del panel.",
      );
    if (!ObjectId.isValid(id)) throw new NotFoundException();
    const user = await this.auth.users.findOne({ _id: new ObjectId(id) });
    if (!user) throw new NotFoundException();
    if (!this.auth.view(user).emailVerified && data.status === "active")
      throw new ForbiddenException(
        "La persona debe verificar su correo antes de recibir acceso.",
      );
    const saved = await this.auth.users.findOneAndUpdate(
      {
        _id: user._id,
        ...(user.revision
          ? { revision: data.revision }
          : {
              $or: [
                { revision: { $exists: false } },
                { revision: data.revision },
              ],
            }),
      },
      {
        $set: {
          role: data.role,
          status: data.status,
          updatedAt: new Date(),
          approvedBy: req.session.user.id,
          approvedAt: new Date(),
        },
        $inc: { revision: 1 },
        $push: {
          accessEvents: {
            actor: req.session.user.id,
            at: new Date(),
            from: { role: user.role, status: user.status },
            to: { role: data.role, status: data.status },
          },
        },
      },
      { returnDocument: "after" },
    );
    if (!saved)
      throw new ConflictException(
        "Este acceso cambió en otra sesión. Actualiza la lista.",
      );
    await this.database.db.collection("access_audit").insertOne({
      userId: id,
      actor: req.session.user.id,
      at: new Date(),
      from: { role: user.role, status: user.status },
      to: { role: saved.role, status: saved.status },
    });
    if (saved.email)
      await this.mail
        .queue(
          saved.email,
          "Actualización de acceso · Vidrios VECA",
          {
            title:
              saved.status === "active"
                ? "Tu acceso a VECA está listo"
                : "Tu acceso ha sido actualizado",
            preview: "Novedades sobre tu cuenta de Vidrios VECA",
            name: saved.name,
            paragraphs: [
              saved.status === "active"
                ? `Tu acceso fue aprobado con el rol ${ROLES.find((r) => r.id === saved.role)!.name}. Encontrarás las secciones disponibles al entrar al panel.`
                : "Un administrador actualizó el estado de tu acceso. Si necesitas ayuda, comunícate con el equipo de VECA.",
            ],
            action: panelAction("Ir al panel"),
          },
          `access:${id}:${saved.revision}`,
        )
        .catch(() => {});
    return { ...this.auth.view(saved), revision: saved.revision };
  }
}
@UseGuards(AdminGuard)
@Controller("admin/dashboard")
class DashboardController {
  constructor(
    private readonly database: Database,
    private readonly mail: MailService,
  ) {}
  @Get() async summary(@Req() req: AuthenticatedRequest) {
    const db = this.database.db,
      p = req.session.user.permissions;
    const [
      stages,
      recent,
      upcoming,
      materials,
      projects,
      pending,
      mailPending,
    ] = await Promise.all([
      p.includes("leads")
        ? db
            .collection("crm_leads")
            .aggregate([{ $group: { _id: "$stage", count: { $sum: 1 } } }])
            .toArray()
        : [],
      p.includes("leads")
        ? db
            .collection("crm_leads")
            .find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .project({ name: 1, stage: 1, district: 1, createdAt: 1 })
            .toArray()
        : [],
      p.includes("leads")
        ? db
            .collection("crm_leads")
            .find({
              stage: "coordination",
              appointment: {
                $gte: new Date(Date.now() - 86400000)
                  .toISOString()
                  .slice(0, 10),
              },
            })
            .sort({ appointment: 1 })
            .limit(8)
            .project({ name: 1, appointment: 1, district: 1 })
            .toArray()
        : [],
      p.includes("inventory")
        ? db
            .collection("inventory_materials")
            .find({ $expr: { $lte: ["$balanceMilli", "$minimumMilli"] } })
            .sort({ name: 1 })
            .limit(8)
            .project({
              name: 1,
              sku: 1,
              unit: 1,
              balanceMilli: 1,
              minimumMilli: 1,
            })
            .toArray()
        : [],
      p.includes("projects")
        ? db.collection("projects").countDocuments({ published: { $ne: null } })
        : null,
      p.includes("users")
        ? db
            .collection("users")
            .countDocuments({ status: "pending", emailVerified: true })
        : null,
      p.includes("users")
        ? db
            .collection("mail_deliveries")
            .countDocuments({ status: { $ne: "sent" } })
        : null,
    ]);
    return {
      stages: Object.fromEntries(stages.map((s) => [s._id, s.count])),
      recent: recent.map(({ _id, ...rest }) => ({ ...rest, id: String(_id) })),
      upcoming: upcoming.map(({ _id, ...rest }) => ({
        ...rest,
        id: String(_id),
      })),
      lowStock: materials.map(
        ({ _id, balanceMilli, minimumMilli, ...rest }) => ({
          ...rest,
          id: String(_id),
          balance: balanceMilli / 1000,
          minimum: minimumMilli / 1000,
        }),
      ),
      publishedProjects: projects,
      pendingUsers: pending,
      ...(p.includes("users")
        ? { mail: { configured: this.mail.configured, pending: mailPending } }
        : {}),
    };
  }
}
@Module({
  imports: [AuthModule],
  controllers: [UsersController, DashboardController],
})
export class AccessModule {}
