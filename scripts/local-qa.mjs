import { createServer } from "node:http";
import { spawn, execFileSync } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { MongoClient } from "mongodb";
import { hash } from "argon2";
const require = createRequire(import.meta.url);
const S3rver = require("s3rver");
const directory = await mkdtemp(path.join(tmpdir(), "veca-s3-qa-"));
execFileSync(
  "docker",
  [
    "run",
    "--rm",
    "-d",
    "--name",
    "veca-qa-mongo",
    "-p",
    "127.0.0.1:27099:27017",
    "mongo:8.0",
  ],
  { stdio: "ignore" },
);
const s3 = new S3rver({
  address: "127.0.0.1",
  port: 4500,
  silent: true,
  directory,
  configureBuckets: [{ name: "veca-test" }],
});
await s3.run();
const client = new MongoClient("mongodb://127.0.0.1:27099", {
  serverSelectionTimeoutMS: 15000,
});
await client.connect();
const db = client.db("veca_qa");
await db.dropDatabase();
await db.collection("users").insertOne({
  username: "admin",
  role: "admin",
  passwordHash: await hash("Local-only-visual-test-2026!"),
});
const messages = [];
const mailServer = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/messages") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(messages));
    return;
  }
  if (req.method !== "POST" || req.url !== "/send") {
    res.writeHead(404).end();
    return;
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  messages.push(JSON.parse(body));
  if (messages.length > 200) messages.shift();
  res.writeHead(200).end("ok");
});
await new Promise((resolve) => mailServer.listen(4510, "127.0.0.1", resolve));
const env = {
  ...process.env,
  NODE_ENV: "test",
  EMAIL_TEST_ENDPOINT: "http://127.0.0.1:4510/send",
  FIREBASE_PROJECT_ID: "veca-local-qa",
  FIREBASE_API_KEY: "local-public-config-only",
  FIREBASE_AUTH_DOMAIN: "veca-local-qa.firebaseapp.com",
  ADMIN_BOOTSTRAP_KEY: "local-qa-bootstrap-key-only-at-least-32",
  PORT: "4400",
  MONGODB_URI: "mongodb://127.0.0.1:27099",
  MONGODB_DATABASE: "veca_qa",
  PANEL_ORIGIN: "http://localhost:3300",
  SITE_ORIGIN: "http://localhost:3380",
  S3_ENDPOINT: "http://127.0.0.1:4500",
  S3_REGION: "us-east-1",
  S3_BUCKET: "veca-test",
  S3_ACCESS_KEY_ID: "S3RVER",
  S3_SECRET_ACCESS_KEY: "S3RVER",
  PUBLIC_API_URL: "http://localhost:4400",
};
const api = spawn(process.execPath, ["apps/api/dist/main.js"], {
  env,
  stdio: ["ignore", "ignore", "inherit"],
});
const panel = spawn(process.execPath, ["scripts/serve-panel.mjs"], {
  env: { ...env, PORT: "3300" },
  stdio: ["ignore", "ignore", "inherit"],
});
const site = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "apps/site",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3380",
  ],
  {
    env: { ...env, API_INTERNAL_URL: "http://127.0.0.1:4400" },
    stdio: ["ignore", "ignore", "inherit"],
  },
);
async function stop() {
  api.kill("SIGTERM");
  panel.kill("SIGTERM");
  site.kill("SIGTERM");
  mailServer.close();
  await s3.close();
  await client.close();
  try {
    execFileSync("docker", ["stop", "-t", "1", "veca-qa-mongo"], {
      stdio: "ignore",
    });
  } catch {}
  process.exit();
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
console.log(
  "Local QA: API :4400 / panel :3300 / site :3380. Test database and object storage are isolated.",
);
