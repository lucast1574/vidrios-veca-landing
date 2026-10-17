import assert from "node:assert/strict";
import { spawn } from "node:child_process";
const env = {
  ...process.env,
  NODE_ENV: "test",
  PORT: "4402",
  MONGODB_URI: "mongodb://127.0.0.1:27099",
  MONGODB_DATABASE: "veca_qa",
};
for (const key of [
  "S3_ENDPOINT",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
])
  delete env[key];
const server = spawn(process.execPath, ["apps/api/dist/main.js"], {
  env,
  stdio: ["ignore", "ignore", "inherit"],
});
try {
  let response;
  for (let i = 0; i < 30; i++) {
    try {
      response = await fetch("http://localhost:4402/health");
      if (response.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.equal(response?.status, 200);
  response = await fetch("http://localhost:4402/health/ready");
  assert.equal(response.status, 503);
  const value = await response.json();
  assert.match(value.message, /almacenamiento de fotografías/);
  assert.equal(
    (await fetch("http://localhost:4402/admin/projects")).status,
    401,
  );
  console.log(
    "PASS: a paused S3 provider does not disable the API or expose admin data; readiness reports unavailable storage honestly.",
  );
} finally {
  server.kill("SIGTERM");
}
