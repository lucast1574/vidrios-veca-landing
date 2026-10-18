import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.env.TEST_API_URL || "http://localhost:4400";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Account fixtures are local-only.");
const origin = "http://localhost:3300";
async function req(path, method = "GET", data, session = null) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(session
        ? { Cookie: session.cookie, "X-Veca-Csrf": session.csrf }
        : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await response.json();
  return {
    status: response.status,
    body,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
    csrf: body.csrf,
  };
}
function expect(r, status) {
  assert.equal(r.status, status, JSON.stringify(r.body));
  return r;
}
async function code(email) {
  const messages = await (await fetch("http://127.0.0.1:4510/messages")).json();
  const mail = messages
    .filter((m) => m.to === email && />\s*\d{6}\s*</.test(m.html))
    .at(-1);
  assert.ok(mail, "verification message must be delivered");
  assert.ok(mail.html.includes("Vidrios VECA"));
  assert.ok(mail.html.includes("logo-email.png"));
  const match = mail.html.match(/>\s*(\d{6})\s*</);
  assert.ok(match);
  return match[1];
}
const password = "Local-only-registered-user-2026!";
const admin = expect(
  await req("/auth/login", "POST", {
    username: "admin",
    password: "Local-only-visual-test-2026!",
  }),
  201,
);
const ownProfile = expect(await req("/auth/me", "GET", null, admin), 200).body
  .user;
assert.deepEqual(ownProfile.authMethods, ["password"]);
assert.equal(ownProfile.roleName, "Administrador");
assert.ok(!JSON.stringify(ownProfile).includes("passwordHash"));
expect(await req("/admin/users", "GET"), 401);
expect(
  await req("/auth/register", "POST", {
    name: "Injected admin",
    email: "inject@example.invalid",
    password,
    role: "admin",
  }),
  400,
);
const external = "qa-" + randomUUID().slice(0, 8) + "@example.invalid";
let registered = expect(
  await req("/auth/register", "POST", {
    name: "Miembro QA",
    email: external,
    password,
  }),
  201,
).body;
expect(
  await req("/auth/verify", "POST", {
    challenge: registered.challenge,
    code: "000000",
  }),
  400,
);
const externalCode = await code(external);
let member = expect(
  await req("/auth/verify", "POST", {
    challenge: registered.challenge,
    code: externalCode,
  }),
  201,
);
assert.equal(member.body.user.status, "pending");
assert.equal(member.body.user.role, null);
assert.deepEqual(member.body.user.authMethods, ["password"]);
assert.ok(!Number.isNaN(Date.parse(member.body.user.accountCreatedAt)));
assert.deepEqual(member.body.user.permissions, []);
expect(
  await req("/auth/verify", "POST", {
    challenge: registered.challenge,
    code: externalCode,
  }),
  400,
);
// A valid session alone must never expose unpublished editorial photos.
const { default: sharp } = await import("sharp");
const imageBytes = await sharp({
  create: { width: 16, height: 16, channels: 3, background: "#ef4723" },
})
  .png()
  .toBuffer();
const form = new FormData();
form.append(
  "file",
  new Blob([imageBytes], { type: "image/png" }),
  "private.png",
);
const upload = await fetch(base + "/media", {
  method: "POST",
  headers: { Origin: origin, Cookie: admin.cookie, "X-Veca-Csrf": admin.csrf },
  body: form,
});
assert.equal(upload.status, 201);
const privateImage = await upload.json();
assert.equal(
  (
    await fetch(base + "/media/" + privateImage.id, {
      headers: { Cookie: member.cookie },
    })
  ).status,
  403,
);
expect(await req("/admin/crm/leads", "GET", null, member), 403);
expect(await req("/admin/users", "GET", null, member), 403);
const userId = member.body.user.id;
expect(
  await req(
    "/admin/users/" + userId,
    "PUT",
    { revision: 2, role: "admin", status: "active" },
    member,
  ),
  403,
);
expect(
  await req(
    "/admin/users/" + userId,
    "PUT",
    { revision: 2, role: "management", status: "active" },
    { ...admin, csrf: "invalid" },
  ),
  403,
);
let list = expect(
  await req(
    "/admin/users?search=" + encodeURIComponent(external),
    "GET",
    null,
    admin,
  ),
  200,
).body;
assert.equal(list.total, 1);
assert.equal(list.items[0].emailVerified, true);
assert.ok(!JSON.stringify(list).includes("passwordHash"));
let updated = expect(
  await req(
    "/admin/users/" + userId,
    "PUT",
    { revision: list.items[0].revision, role: "commercial", status: "active" },
    admin,
  ),
  200,
).body;
expect(await req("/admin/crm/leads", "GET", null, member), 200);
expect(await req("/admin/crm/materials", "GET", null, member), 403);
expect(await req("/admin/users", "GET", null, member), 403);
expect(
  await req(
    "/admin/users/" + userId,
    "PUT",
    { revision: list.items[0].revision, role: "admin", status: "active" },
    admin,
  ),
  409,
);
updated = expect(
  await req(
    "/admin/users/" + userId,
    "PUT",
    { revision: updated.revision, role: "warehouse", status: "active" },
    admin,
  ),
  200,
).body;
expect(await req("/admin/crm/leads", "GET", null, member), 403);
expect(await req("/admin/crm/materials", "GET", null, member), 200);
const dashboard = expect(
  await req("/admin/dashboard", "GET", null, member),
  200,
).body;
assert.deepEqual(dashboard.recent, []);
assert.deepEqual(dashboard.stages, {});
assert.equal(dashboard.publishedProjects, null);
assert.equal(dashboard.pendingUsers, null);
assert.ok(!dashboard.mail);
expect(
  await req(
    "/admin/users/" + admin.body.user.id,
    "PUT",
    { revision: 1, role: "warehouse", status: "active" },
    admin,
  ),
  403,
);
const corporate = "qa-" + randomUUID().slice(0, 8) + "@veca.com.pe";
registered = expect(
  await req("/auth/register", "POST", {
    name: "Gerencia QA",
    email: corporate,
    password,
  }),
  201,
).body;
const manager = expect(
  await req("/auth/verify", "POST", {
    challenge: registered.challenge,
    code: await code(corporate),
  }),
  201,
);
assert.equal(manager.body.user.status, "active");
assert.equal(manager.body.user.role, "management");
assert.ok(!manager.body.user.permissions.includes("users"));
expect(await req("/admin/users", "GET", null, manager), 403);
expect(await req("/admin/crm/leads", "GET", null, manager), 200);
const suffix = "qa-" + randomUUID().slice(0, 8) + "@veca.com.pe.evil.invalid";
registered = expect(
  await req("/auth/register", "POST", {
    name: "Dominio no corporativo",
    email: suffix,
    password,
  }),
  201,
).body;
const other = expect(
  await req("/auth/verify", "POST", {
    challenge: registered.challenge,
    code: await code(suffix),
  }),
  201,
);
assert.equal(other.body.user.status, "pending");
assert.equal(other.body.user.role, null);
expect(
  await req("/auth/google", "POST", {
    idToken: "a-fabricated-token-that-must-not-authenticate",
  }),
  401,
);
const reset = expect(
  await req("/auth/forgot", "POST", { email: external }),
  201,
).body;
const resetCode = await code(external),
  nextPassword = "Local-only-new-password-2026!";
const renewed = expect(
  await req("/auth/reset", "POST", {
    challenge: reset.challenge,
    code: resetCode,
    password: nextPassword,
  }),
  201,
);
assert.equal(renewed.body.user.role, "warehouse");
expect(await req("/auth/me", "GET", null, member), 401);
expect(await req("/auth/login", "POST", { username: external, password }), 401);
member = expect(
  await req("/auth/login", "POST", {
    username: external,
    password: nextPassword,
  }),
  201,
);
updated = expect(
  await req(
    "/admin/users/" + userId,
    "PUT",
    { revision: updated.revision + 1, role: "warehouse", status: "suspended" },
    admin,
  ),
  200,
).body;
expect(await req("/admin/crm/materials", "GET", null, member), 403);
console.log(
  "Access integration passed: OTP mail, single-use verification, external approval, exact corporate domain, roles enforced on existing sessions, PII boundaries, self-demotion protection, forged Google token rejection, reset and suspension.",
);

// Simultaneous reissues cannot create multiple valid codes or skip the cooldown.
const cooldownEmail = "qa-" + randomUUID().slice(0, 8) + "@example.invalid";
const challenge = expect(
  await req("/auth/register", "POST", {
    name: "Intentos QA",
    email: cooldownEmail,
    password,
  }),
  201,
).body;
const concurrent = await Promise.all(
  [1, 2].map(() =>
    req("/auth/login", "POST", { username: cooldownEmail, password }),
  ),
);
assert.deepEqual(
  concurrent.map((r) => r.status),
  [429, 429],
);
for (let attempt = 0; attempt < 5; attempt++)
  expect(
    await req("/auth/verify", "POST", {
      challenge: challenge.challenge,
      code: "000000",
    }),
    400,
  );
expect(
  await req("/auth/verify", "POST", {
    challenge: challenge.challenge,
    code: await code(cooldownEmail),
  }),
  400,
);
console.log(
  "OTP protection passed: atomic resend cooldown and five-attempt lockout; pending sessions cannot read private photos.",
);

// Catalog, labels and permissions come from MongoDB, including brand-new role IDs.
const { MongoClient } = await import("mongodb");
const rolesClient = new MongoClient("mongodb://127.0.0.1:27099");
await rolesClient.connect();
try {
  const db = rolesClient.db("veca_qa");
  const roleId = "custom-" + randomUUID().slice(0, 8);
  await db.collection("roles").insertOne({
    id: roleId,
    name: "Coordinación técnica QA",
    description: "Rol definido en datos",
    permissions: ["dashboard", "leads"],
    revision: 1,
  });
  let catalog = expect(await req("/admin/users", "GET", null, admin), 200).body;
  assert.ok(catalog.roles.some((r) => r.id === roleId));
  assert.ok(!JSON.stringify(catalog).includes("passwordHash"));
  updated = expect(
    await req(
      "/admin/users/" + userId,
      "PUT",
      { revision: updated.revision, role: roleId, status: "active" },
      admin,
    ),
    200,
  ).body;
  assert.equal(updated.roleName, "Coordinación técnica QA");
  expect(await req("/admin/crm/leads", "GET", null, member), 200);
  expect(await req("/admin/users", "GET", null, member), 403);
  expect(
    await req(
      "/admin/users/" + userId,
      "PUT",
      { revision: updated.revision, role: "missing-role", status: "active" },
      admin,
    ),
    404,
  );
  await db
    .collection("roles")
    .updateOne(
      { id: roleId },
      { $set: { name: "Solo almacén QA", permissions: ["inventory"] } },
    );
  const me = expect(await req("/auth/me", "GET", null, member), 200).body;
  assert.equal(me.user.roleName, "Solo almacén QA");
  assert.deepEqual(me.user.permissions, ["inventory"]);
  expect(await req("/admin/crm/leads", "GET", null, member), 403);
  expect(await req("/admin/crm/materials", "GET", null, member), 200);
  await db
    .collection("access_settings")
    .updateOne({ name: "defaults" }, { $set: { corporateRole: roleId } });
  try {
    const email = `default-${randomUUID().slice(0, 8)}@veca.com.pe`;
    const entry = expect(
      await req("/auth/register", "POST", {
        name: "Default QA",
        email,
        password,
      }),
      201,
    ).body;
    const account = expect(
      await req("/auth/verify", "POST", {
        challenge: entry.challenge,
        code: await code(email),
      }),
      201,
    ).body;
    assert.equal(account.user.role, roleId);
    assert.deepEqual(account.user.permissions, ["inventory"]);
  } finally {
    await db
      .collection("access_settings")
      .updateOne(
        { name: "defaults" },
        { $set: { corporateRole: "management" } },
      );
  }
  await db.collection("roles").deleteOne({ id: roleId });
  expect(await req("/admin/crm/materials", "GET", null, member), 403);
  assert.deepEqual(
    expect(await req("/auth/me", "GET", null, member), 200).body.user
      .permissions,
    [],
  );
  expect(await req("/auth/logout", "POST", {}, member), 201);
  expect(await req("/auth/me", "GET", null, member), 401);
  console.log(
    "Database roles passed: arbitrary new ID, dynamic catalog and name, live permission changes, missing-role denial and database-selected corporate default.",
  );
} finally {
  await rolesClient.close();
}
