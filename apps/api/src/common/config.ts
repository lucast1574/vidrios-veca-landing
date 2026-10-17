import { z } from "zod";
const schema = z.object({
  ADMIN_BOOTSTRAP_KEY: z.string().default(""),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().default(4000),
  MONGODB_URI: z.string().min(1),
  MONGODB_DATABASE: z.string().optional(),
  PANEL_ORIGIN: z.url().default("http://localhost:5173"),
  SITE_ORIGIN: z.url().default("http://localhost:3080"),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  PUBLIC_API_URL: z.url().default("http://localhost:4000"),
});
export const config = schema.parse(process.env);
