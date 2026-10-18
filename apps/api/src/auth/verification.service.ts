import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  HttpException,
} from "@nestjs/common";
import { randomBytes, randomInt } from "node:crypto";
import { hash, verify } from "argon2";
import { ObjectId } from "mongodb";
import { Database } from "../database/database.module";
import { MailService } from "../mail/mail.service";
import { digest } from "./auth.crypto";
type Challenge = {
  _id: string;
  userId: ObjectId;
  tokenHash: string;
  purpose: "verify" | "reset";
  hash: string;
  expiresAt: Date;
  createdAt: Date;
  attempts: number;
};
@Injectable()
export class VerificationService {
  constructor(
    private readonly database: Database,
    private readonly mail: MailService,
  ) {}
  async issue(
    userId: ObjectId,
    email: string,
    name: string,
    purpose: "verify" | "reset",
  ) {
    if (!this.mail.configured)
      throw new ServiceUnavailableException(
        "El envío de códigos aún no está disponible. Usa Google o intenta más tarde.",
      );
    const collection = this.database.db.collection<Challenge>(
      "verification_challenges",
    );
    const token = randomBytes(32).toString("base64url"),
      code = String(randomInt(100000, 1000000));
    const doc: Challenge = {
      _id: `${userId}:${purpose}`,
      tokenHash: digest(token),
      userId,
      purpose,
      hash: await hash(code),
      attempts: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60000),
    };
    // Keep only the salted hash in the database; the plaintext code stays in memory for delivery.
    const { _id, ...fields } = doc;
    try {
      await collection.findOneAndUpdate(
        {
          _id,
          $or: [
            { createdAt: { $lte: new Date(Date.now() - 60000) } },
            { createdAt: { $exists: false } },
          ],
        },
        { $set: fields },
        { upsert: true },
      );
    } catch (e) {
      if ((e as { code?: number }).code === 11000)
        throw new HttpException(
          "Espera un minuto antes de solicitar otro código.",
          429,
        );
      throw e;
    }
    try {
      await this.mail.send(
        email,
        purpose === "verify"
          ? "Verifica tu correo · Vidrios VECA"
          : "Recupera tu acceso · Vidrios VECA",
        {
          title:
            purpose === "verify"
              ? "Un paso para confirmar tu correo"
              : "Recupera tu acceso",
          preview: "Tu código de verificación de Vidrios VECA",
          name,
          paragraphs: [
            purpose === "verify"
              ? "Usa este código para confirmar que este correo te pertenece."
              : "Usa este código para elegir una nueva contraseña.",
            "Caduca en 10 minutos y solo se puede utilizar una vez. No lo compartas. Si no solicitaste este mensaje, puedes ignorarlo.",
          ],
          code,
        },
      );
    } catch (e) {
      await collection.deleteOne({ _id: doc._id, tokenHash: doc.tokenHash });
      throw e;
    }
    return { challenge: token, email };
  }
  async consume(token: string, code: string, purpose: "verify" | "reset") {
    const collection = this.database.db.collection<Challenge>(
      "verification_challenges",
    );
    const doc = await collection.findOneAndUpdate(
      {
        tokenHash: digest(token),
        purpose,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 5 },
      },
      { $inc: { attempts: 1 } },
      { returnDocument: "after" },
    );
    if (!doc || !(await verify(doc.hash, code)))
      throw new BadRequestException(
        "El código no es válido o ha caducado. Solicita otro si es necesario.",
      );
    const used = await collection.findOneAndDelete({
      _id: doc._id,
      hash: doc.hash,
    });
    if (!used) throw new BadRequestException("El código ya fue utilizado.");
    return doc.userId;
  }
}
