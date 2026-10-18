import { z } from "zod";
const schema = z.object({
  FIREBASE_PROJECT_ID: z.string().default(""),
  FIREBASE_API_KEY: z.string().default(""),
  FIREBASE_AUTH_DOMAIN: z.string().default(""),
  FIREBASE_APP_ID: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  MAIL_FROM: z.string().default("Vidrios VECA <notificaciones@veca.com.pe>"),
  MAIL_NOTIFY_TO: z.string().email().default("vsantillan@veca.com.pe"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  EMAIL_TEST_ENDPOINT: z.string().default(""),
  ADMIN_BOOTSTRAP_KEY: z.string().default(""),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().default(4000),
  MONGODB_URI: z.string().min(1),
  MONGODB_DATABASE: z.string().optional(),
  PANEL_ORIGIN: z.url().default("http://localhost:5173"),
  SITE_ORIGIN: z.url().default("http://localhost:3080"),
  S3_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  PUBLIC_API_URL: z.url().default("http://localhost:4000"),
});
export const config = schema.parse(process.env);
