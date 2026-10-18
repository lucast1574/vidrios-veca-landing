import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  ServiceUnavailableException,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { hash, verify } from "argon2";
import { ObjectId } from "mongodb";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { type RoleDefinition, type SessionUser } from "@veca/content";
import { RolesService } from "./roles.service";
import { Database } from "../database/database.module";
import { config } from "../common/config";
import { VerificationService } from "./verification.service";
import { MailService } from "../mail/mail.service";
import { panelAction } from "../mail/templates";
import type {
  UserDocument,
  SessionDocument,
  AuthenticatedSession,
} from "./auth.types";
import { digest, equal } from "./auth.crypto";
@Injectable()
export class AuthService {
  constructor(
    private readonly database: Database,
    readonly roles: RolesService,
    private readonly codes: VerificationService,
    private readonly mail: MailService,
  ) {}
  get users() {
    return this.database.db.collection<UserDocument>("users");
  }
  async view(
    user: UserDocument,
    catalog?: RoleDefinition[],
  ): Promise<SessionUser> {
    const role = (catalog || (await this.roles.list())).find(
      (r) => r.id === user.role,
    );
    const legacy = user.username === "admin" && !user.email;
    const status = user.status || (legacy ? "active" : "pending");
    const emailVerified = user.emailVerified || legacy;
    return {
      id: String(user._id),
      username: user.username,
      name: user.name || (legacy ? "Administrador" : user.username),
      email: user.email || null,
      role: user.role,
      roleName: role?.name || null,
      status,
      emailVerified,
      permissions:
        status === "active" && emailVerified
          ? [...(role?.permissions || [])]
          : [],
    };
  }
  async prepareAdmin(key: string) {
    if (config.NODE_ENV === "production") throw new NotFoundException();
    if (!config.ADMIN_BOOTSTRAP_KEY || !equal(key, config.ADMIN_BOOTSTRAP_KEY))
      throw new ForbiddenException();
    if (await this.users.findOne({ username: "admin" }))
      throw new ConflictException("El administrador ya fue creado.");
    const defaults = await this.roles.defaults();
    const catalog = await this.roles.list();
    if (
      !catalog.some(
        (r) =>
          r.id === defaults.bootstrapRole && r.permissions.includes("users"),
      )
    )
      throw new ServiceUnavailableException(
        "Configura un rol de administración válido.",
      );
    const token = randomBytes(32).toString("base64url");
    await this.users.insertOne({
      _id: new ObjectId(),
      username: "admin",
      role: defaults.bootstrapRole,
      passwordHash: null,
      setupHash: digest(token),
      setupExpires: new Date(Date.now() + 24 * 3600000),
      createdAt: new Date(),
    });
    return {
      username: "admin",
      activationUrl: config.PANEL_ORIGIN + "/#activate=" + token,
    };
  }
  async login(username: string, password: string) {
    const user = await this.users.findOne({
      username: username.trim().toLowerCase(),
    });
    if (!user?.passwordHash || !(await verify(user.passwordHash, password)))
      throw new UnauthorizedException("Correo o contraseña incorrectos.");
    if (!(await this.view(user)).emailVerified) {
      return {
        verificationRequired: true,
        ...(await this.codes.issue(
          user._id,
          user.email!,
          user.name || "",
          "verify",
        )),
      };
    }
    return this.session(user._id);
  }
  async register(name: string, email: string, password: string) {
    if (!this.mail.configured)
      throw new ServiceUnavailableException(
        "El registro por correo estará disponible cuando se active el envío de códigos.",
      );
    email = email.trim().toLowerCase();
    if (await this.users.findOne({ username: email }))
      throw new ConflictException(
        "Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.",
      );
    const user: UserDocument = {
      _id: new ObjectId(),
      username: email,
      email,
      name: name.trim(),
      passwordHash: await hash(password),
      role: null,
      status: "pending",
      emailVerified: false,
      provider: "password",
      revision: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      await this.users.insertOne(user);
    } catch (e) {
      if ((e as { code?: number }).code === 11000)
        throw new ConflictException("Este correo ya tiene una cuenta.");
      throw e;
    }
    return {
      verificationRequired: true,
      ...(await this.codes.issue(user._id, email, user.name!, "verify")),
    };
  }
  async resend(email: string, password: string) {
    return this.login(email, password);
  }
  private async verified(userId: ObjectId, patch: Partial<UserDocument> = {}) {
    const user = await this.users.findOne({ _id: userId });
    if (!user) throw new UnauthorizedException();
    const defaults = await this.roles.defaults();
    const catalog = await this.roles.list();
    const corporateRole = catalog.find((r) => r.id === defaults.corporateRole);
    const corporate =
      user.email?.split("@")[1] === defaults.corporateDomain && !!corporateRole;
    const invited =
      user.trustedInvitation &&
      catalog.some((r) => r.id === user.role) &&
      user.status === "pending";
    const auto =
      (corporate || invited) &&
      (!user.emailVerified || user.status === "pending") &&
      user.status !== "suspended" &&
      user.status !== "rejected";
    const fields: Partial<UserDocument> = {
      ...patch,
      emailVerified: true,
      updatedAt: new Date(),
      ...(auto
        ? {
            status: "active",
            role:
              user.trustedInvitation && user.role
                ? user.role
                : corporateRole!.id,
            approvedBy: invited
              ? "Invitación verificada"
              : "Dominio corporativo verificado",
            approvedAt: new Date(),
          }
        : {}),
    };
    await this.users.updateOne(
      { _id: userId },
      { $set: fields, $inc: { revision: 1 } },
    );
    if (!user.emailVerified && !auto)
      await this.mail
        .queue(
          config.MAIL_NOTIFY_TO,
          "Nueva solicitud de acceso · VECA",
          {
            title: "Una persona solicita acceso",
            preview: "Revisa una nueva solicitud en el panel",
            paragraphs: [
              `${user.name || user.email} confirmó su correo y espera tu aprobación. Asigna un rol desde el panel de usuarios.`,
            ],
            action: panelAction("Revisar solicitudes", "#users"),
          },
          `access-request:${userId}`,
        )
        .catch(() => {});
    return this.session(userId);
  }
  async confirm(token: string, code: string) {
    return this.verified(await this.codes.consume(token, code, "verify"));
  }
  async google(idToken: string) {
    if (!config.FIREBASE_PROJECT_ID || !config.FIREBASE_API_KEY)
      throw new ServiceUnavailableException(
        "El acceso con Google aún no está configurado.",
      );
    let identity;
    try {
      const name = "veca-login";
      const app =
        getApps().find((a) => a.name === name) ||
        initializeApp({ projectId: config.FIREBASE_PROJECT_ID }, name);
      identity = await getAuth(app).verifyIdToken(idToken);
      if (
        !identity.email_verified ||
        !identity.email ||
        identity.firebase.sign_in_provider !== "google.com"
      )
        throw Error();
    } catch {
      throw new UnauthorizedException(
        "No pudimos comprobar tu identidad con Google. Intenta nuevamente.",
      );
    }
    const email = identity.email!.toLowerCase();
    let user = await this.users.findOne({ username: email });
    if (!user) {
      user = {
        _id: new ObjectId(),
        username: email,
        email,
        name: identity.name || email,
        passwordHash: null,
        role: null,
        status: "pending",
        emailVerified: false,
        provider: "google",
        firebaseUid: identity.uid,
        revision: 1,
        createdAt: new Date(),
      };
      try {
        await this.users.insertOne(user);
      } catch (e) {
        if ((e as { code?: number }).code !== 11000) throw e;
        user = (await this.users.findOne({ username: email }))!;
      }
    }
    if (user.firebaseUid && user.firebaseUid !== identity.uid)
      throw new UnauthorizedException(
        "Esta cuenta ya está vinculada a otra identidad.",
      );
    return this.verified(user._id, {
      firebaseUid: identity.uid,
      ...(!user.emailVerified && !user.trustedInvitation
        ? { passwordHash: null }
        : {}),
      name: user.name || identity.name || email,
    });
  }
  async forgot(email: string) {
    const user = await this.users.findOne({
      username: email.trim().toLowerCase(),
    });
    if (!user?.email)
      return { challenge: randomBytes(32).toString("base64url"), email };
    return this.codes.issue(user._id, user.email, user.name || "", "reset");
  }
  async reset(token: string, code: string, password: string) {
    const id = await this.codes.consume(token, code, "reset");
    await this.users.updateOne(
      { _id: id },
      { $set: { passwordHash: await hash(password), updatedAt: new Date() } },
    );
    await this.database.db
      .collection<SessionDocument>("sessions")
      .deleteMany({ userId: id });
    return this.verified(id);
  }
  private async session(userId: ObjectId) {
    const user = await this.users.findOne({ _id: userId });
    if (!user) throw new UnauthorizedException();
    const token = randomBytes(32).toString("base64url"),
      csrf = randomBytes(24).toString("base64url"),
      expiresAt = new Date(Date.now() + 12 * 3600000);
    await this.database.db
      .collection<SessionDocument>("sessions")
      .insertOne({ userId, tokenHash: digest(token), csrf, expiresAt });
    return { token, csrf, expiresAt, user: await this.view(user) };
  }
  async authenticate(token: string): Promise<AuthenticatedSession> {
    const session = await this.database.db
      .collection<SessionDocument>("sessions")
      .findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } });
    if (!session)
      throw new UnauthorizedException("Inicia sesión para continuar.");
    const user = await this.users.findOne({ _id: session.userId });
    if (!user) throw new UnauthorizedException();
    return { ...session, user: await this.view(user) };
  }
  async logout(token: string) {
    await this.database.db
      .collection<SessionDocument>("sessions")
      .deleteOne({ tokenHash: digest(token) });
  }
  async setup(token: string, password: string) {
    const user = await this.users.findOne({
      username: "admin",
      passwordHash: null,
      setupHash: digest(token),
      setupExpires: { $gt: new Date() },
    });
    if (!user)
      throw new ForbiddenException(
        "El enlace de activación no es válido o ha caducado.",
      );
    const result = await this.users.updateOne(
      { _id: user._id, passwordHash: null, setupHash: digest(token) },
      {
        $set: { passwordHash: await hash(password) },
        $unset: { setupHash: "", setupExpires: "" },
      },
    );
    if (!result.modifiedCount)
      throw new ConflictException("El administrador ya fue activado.");
    return this.session(user._id);
  }
}
