import {
  Global,
  Injectable,
  Module,
  OnApplicationBootstrap,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createTransport } from "nodemailer";
import { randomUUID } from "node:crypto";
import { Database } from "../database/database.module";
import { config } from "../common/config";
import { emailMarkup, type MailContent } from "./templates";
type Delivery = {
  _id: string;
  to: string;
  subject: string;
  content: MailContent;
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
  nextAt: Date;
  lockUntil?: Date;
  createdAt: Date;
  sentAt?: Date;
};
@Injectable()
export class MailService implements OnApplicationBootstrap, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private working = false;
  private smtp = config.SMTP_HOST
    ? createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: config.SMTP_USER
          ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }
          : undefined,
      })
    : null;
  constructor(private readonly database: Database) {}
  get configured() {
    return !!(
      config.RESEND_API_KEY ||
      this.smtp ||
      (config.NODE_ENV === "test" && config.EMAIL_TEST_ENDPOINT)
    );
  }
  async onApplicationBootstrap() {
    this.timer = setInterval(() => void this.flush(), 10000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.smtp?.close();
  }
  async send(
    to: string,
    subject: string,
    content: MailContent,
    key: string = randomUUID(),
  ) {
    if (!this.configured)
      throw new ServiceUnavailableException(
        "El envío de correos aún no está disponible. Intenta más tarde.",
      );
    const html = await emailMarkup(content);
    if (config.NODE_ENV === "test" && config.EMAIL_TEST_ENDPOINT) {
      const response = await fetch(config.EMAIL_TEST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw new ServiceUnavailableException("No se pudo enviar el correo.");
      return;
    }
    try {
      if (this.smtp) {
        await this.smtp.sendMail({ from: config.MAIL_FROM, to, subject, html });
        return;
      }
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          from: config.MAIL_FROM,
          to: [to],
          subject,
          html,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw Error("delivery failed");
    } catch {
      throw new ServiceUnavailableException(
        "No pudimos enviar el correo. Intenta nuevamente en unos minutos.",
      );
    }
  }
  async queue(
    to: string,
    subject: string,
    content: MailContent,
    key: string = randomUUID(),
  ) {
    await this.database.db
      .collection<Delivery>("mail_deliveries")
      .updateOne(
        { _id: key },
        {
          $setOnInsert: {
            to,
            subject,
            content,
            status: "pending",
            attempts: 0,
            nextAt: new Date(),
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );
    void this.flush();
  }
  async flush() {
    if (this.working || !this.configured) return;
    this.working = true;
    try {
      const collection =
        this.database.db.collection<Delivery>("mail_deliveries");
      for (let i = 0; i < 10; i++) {
        const now = new Date();
        const doc = await collection.findOneAndUpdate(
          {
            $or: [
              { status: "pending", nextAt: { $lte: now } },
              { status: "sending", lockUntil: { $lt: now } },
            ],
          },
          {
            $set: {
              status: "sending",
              lockUntil: new Date(Date.now() + 120000),
            },
            $inc: { attempts: 1 },
          },
          { sort: { createdAt: 1 }, returnDocument: "after" },
        );
        if (!doc) break;
        try {
          await this.send(doc.to, doc.subject, doc.content, doc._id);
          await collection.updateOne(
            { _id: doc._id },
            {
              $set: { status: "sent", sentAt: new Date() },
              $unset: { lockUntil: "", content: "" },
            },
          );
        } catch {
          await collection.updateOne(
            { _id: doc._id },
            {
              $set: {
                status: doc.attempts >= 6 ? "failed" : "pending",
                nextAt: new Date(
                  Date.now() + Math.min(3600000, 30000 * 2 ** doc.attempts),
                ),
              },
              $unset: { lockUntil: "" },
            },
          );
          break;
        }
      }
    } catch {
      /* Durable pending deliveries are retried on the next tick. */
    } finally {
      this.working = false;
    }
  }
}
@Global()
@Module({ providers: [MailService], exports: [MailService] })
export class MailModule {}
