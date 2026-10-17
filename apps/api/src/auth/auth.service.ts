import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash, verify } from "argon2";
import { ObjectId } from "mongodb";
import { Database } from "../database/database.module";
import type {
  UserDocument,
  SessionDocument,
  AuthenticatedSession,
} from "./auth.types";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export const equal = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
@Injectable()
export class AuthService {
  constructor(private readonly database: Database) {}
  async prepareAdmin(key: string) {
    const { config } = await import("../common/config");
    if (!config.ADMIN_BOOTSTRAP_KEY || !equal(key, config.ADMIN_BOOTSTRAP_KEY))
      throw new ForbiddenException();
    if (
      await this.database.db
        .collection<UserDocument>("users")
        .findOne({ username: "admin" })
    )
      throw new ConflictException("El administrador ya fue creado.");
    const token = randomBytes(32).toString("base64url");
    await this.database.db.collection<UserDocument>("users").insertOne({
      _id: new ObjectId(),
      username: "admin",
      role: "admin",
      passwordHash: null,
      setupHash: digest(token),
      setupExpires: new Date(Date.now() + 24 * 3600_000),
      createdAt: new Date(),
    });
    return {
      username: "admin",
      activationUrl: config.PANEL_ORIGIN + "/#activate=" + token,
    };
  }
  async login(username: string, password: string) {
    const user = await this.database.db
      .collection<UserDocument>("users")
      .findOne({ username: username.toLowerCase(), role: "admin" });
    if (!user?.passwordHash || !(await verify(user.passwordHash, password)))
      throw new UnauthorizedException("Usuario o contraseña incorrectos.");
    return this.session(user._id);
  }
  private async session(userId: ObjectId) {
    const token = randomBytes(32).toString("base64url"),
      csrf = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);
    await this.database.db
      .collection<SessionDocument>("sessions")
      .insertOne({ userId, tokenHash: digest(token), csrf, expiresAt });
    return {
      token,
      csrf,
      expiresAt,
      user: { username: "admin", role: "admin" },
    };
  }
  async authenticate(token: string): Promise<AuthenticatedSession> {
    const s = await this.database.db
      .collection<SessionDocument>("sessions")
      .findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } });
    if (!s) throw new UnauthorizedException("Inicia sesión para continuar.");
    const user = await this.database.db
      .collection<UserDocument>("users")
      .findOne({ _id: s.userId, role: "admin" });
    if (!user) throw new UnauthorizedException();
    return {
      ...s,
      csrf: String(s.csrf),
      user: { username: user.username, role: "admin" },
    };
  }
  async logout(token: string) {
    await this.database.db
      .collection<SessionDocument>("sessions")
      .deleteOne({ tokenHash: digest(token) });
  }
  async setup(token: string, password: string) {
    const user = await this.database.db
      .collection<UserDocument>("users")
      .findOne({
        username: "admin",
        passwordHash: null,
        setupHash: digest(token),
        setupExpires: { $gt: new Date() },
      });
    if (!user)
      throw new ForbiddenException(
        "El enlace de activación no es válido o ha caducado.",
      );
    const passwordHash = await hash(password);
    const result = await this.database.db
      .collection<UserDocument>("users")
      .updateOne(
        { _id: user._id, passwordHash: null, setupHash: digest(token) },
        { $set: { passwordHash }, $unset: { setupHash: "", setupExpires: "" } },
      );
    if (!result.modifiedCount)
      throw new ConflictException("El administrador ya fue activado.");
    return this.session(user._id);
  }
}
