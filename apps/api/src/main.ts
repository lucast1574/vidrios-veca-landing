import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { AppModule } from "./app.module";
import { config } from "./common/config";
async function main() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableShutdownHooks();
  app.use(express.json({ limit: "1mb" }));
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.enableCors({
    origin: [config.PANEL_ORIGIN, config.SITE_ORIGIN],
    credentials: true,
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Veca-Csrf"],
  });
  app.use(
    "/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 40,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Demasiados intentos. Espera unos minutos." },
    }),
  );
  app.use(
    "/admin",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 180,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  await app.listen(config.PORT, "0.0.0.0");
}
void main();
