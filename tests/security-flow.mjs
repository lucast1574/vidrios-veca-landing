import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import { Reflector } from "@nestjs/core";
import { UnauthorizedException } from "@nestjs/common";
process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27099";
const { AdminGuard } = await import("../apps/api/dist/auth/admin.guard.js");
const { ApiAccessGuard } =
  await import("../apps/api/dist/auth/api-access.guard.js");
const { SessionGuard } = await import("../apps/api/dist/auth/session.guard.js");
const { ROUTE_ACCESS } = await import("../apps/api/dist/auth/route-access.js");
const base = process.env.TEST_API_URL || "http://localhost:4400";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Security fixtures are local-only.");
const id = "000000000000000000000001";
const routes = [
  ["GET", "/account/avatar/" + id],
  ["POST", "/account/avatar"],
  ["POST", "/account/avatar/preference"],
  ["POST", "/account/avatar/google"],
  ["GET", "/admin/system"],
  ["GET", "/admin/dashboard"],
  ["GET", "/admin/users"],
  ["PUT", "/admin/users/" + id],
  ["GET", "/admin/projects"],
  ["GET", "/admin/projects/" + id],
  ["POST", "/admin/projects"],
  ["PUT", "/admin/projects/" + id],
  ["POST", `/admin/projects/${id}/publish`],
  ["POST", `/admin/projects/${id}/unpublish`],
  ["POST", "/media"],
  ["GET", "/admin/crm/leads"],
  ["POST", "/admin/crm/leads"],
  ["GET", "/admin/crm/leads/" + id],
  ["PUT", "/admin/crm/leads/" + id],
  ["POST", `/admin/crm/leads/${id}/notes`],
  ["POST", `/admin/crm/leads/${id}/files`],
  ["GET", "/admin/crm/files/" + id],
  ["GET", "/admin/crm/materials"],
  ["POST", "/admin/crm/materials"],
  ["GET", "/admin/crm/movements"],
  ["POST", `/admin/crm/materials/${id}/movements`],
  ["GET", "/admin/crm/events"],
  ["GET", "/auth/me"],
  ["POST", "/auth/logout"],
];
for (const [method, path] of routes) {
  const r = await fetch(base + path, {
    method,
    headers: {
      Origin: "http://localhost:3300",
      "Content-Type": "application/json",
    },
    body: method === "GET" ? undefined : "{}",
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(r.status, 401, `${method} ${path} must reject anonymous access`);
}
// The global boundary must also deny future handlers with no access declaration, even for an admin.
const auth = {
  async authenticate(token) {
    if (!token) throw new UnauthorizedException();
    return {
      csrf: "csrf",
      user: {
        status: token === "pending" ? "pending" : "active",
        emailVerified: true,
        permissions: token === "admin" ? ["users", "dashboard"] : ["dashboard"],
      },
    };
  },
};
const reflector = new Reflector();
const guard = new ApiAccessGuard(
  reflector,
  new SessionGuard(auth),
  new AdminGuard(auth, reflector),
);
function context(access, token = "admin", method = "GET") {
  const handler = () => {},
    controller = class {},
    req = { method, cookies: { veca_session: token }, headers: {} };
  if (access) Reflect.defineMetadata(ROUTE_ACCESS, access, handler);
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => req }),
  };
}
await assert.rejects(
  () => guard.canActivate(context(null)),
  (e) => e.getStatus() === 403,
);
assert.equal(await guard.canActivate(context({ kind: "public" }, "")), true);
await assert.rejects(
  () => guard.canActivate(context({ kind: "session" }, "")),
  (e) => e.getStatus() === 401,
);
assert.equal(
  await guard.canActivate(context({ kind: "session" }, "pending")),
  true,
);
await assert.rejects(
  () =>
    guard.canActivate(
      context({ kind: "permission", permission: "users" }, "pending"),
    ),
  (e) => e.getStatus() === 403,
);
await assert.rejects(
  () =>
    guard.canActivate(
      context({ kind: "permission", permission: "users" }, "warehouse"),
    ),
  (e) => e.getStatus() === 403,
);
assert.equal(
  await guard.canActivate(context({ kind: "permission", permission: "users" })),
  true,
);
await assert.rejects(
  () =>
    guard.canActivate(
      context({ kind: "permission", permission: "users" }, "admin", "POST"),
    ),
  (e) => e.getStatus() === 403,
);
// An explicitly invited external administrator activates only after proving ownership.
const email = `invitation-${randomUUID().slice(0, 8)}@example.invalid`,
  password = "Local-only-invitation-password-2026!";
async function post(path, body) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: {
      Origin: "http://localhost:3300",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  assert.equal(r.status, 201);
  return r.json();
}
const challenge = await post("/auth/register", {
  name: "Administrador externo QA",
  email,
  password,
});
const dbClient = new MongoClient("mongodb://127.0.0.1:27099");
await dbClient.connect();
try {
  await dbClient
    .db("veca_qa")
    .collection("users")
    .updateOne(
      { username: email },
      { $set: { role: "admin", trustedInvitation: true } },
    );
} finally {
  await dbClient.close();
}
const messages = await (await fetch("http://localhost:4510/messages")).json();
const code = messages
  .filter((m) => m.to === email)
  .at(-1)
  .html.match(/>\s*(\d{6})\s*</)[1];
const verified = await post("/auth/verify", {
  challenge: challenge.challenge,
  code,
});
assert.equal(verified.user.role, "admin");
assert.equal(verified.user.status, "active");
assert.equal(verified.user.emailVerified, true);
// Production never exposes initial administrator provisioning, even with a valid old setup key.
const server = spawn(process.execPath, ["apps/api/dist/main.js"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: "4403",
    MONGODB_URI: "mongodb://127.0.0.1:27099",
    MONGODB_DATABASE: "veca_qa",
    ADMIN_BOOTSTRAP_KEY: "local-qa-bootstrap-key-only-at-least-32",
  },
  stdio: ["ignore", "ignore", "inherit"],
});
try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      if ((await fetch("http://localhost:4403/health")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(ready);
  const r = await fetch("http://localhost:4403/auth/bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "local-qa-bootstrap-key-only-at-least-32" }),
  });
  assert.equal(r.status, 404);
} finally {
  server.kill("SIGTERM");
}
console.log(
  `Security boundary passed: ${routes.length} private route/method combinations reject anonymous access, undeclared routes deny by default, CSRF/roles apply, external invitations require email proof, and production bootstrap is disabled.`,
);
