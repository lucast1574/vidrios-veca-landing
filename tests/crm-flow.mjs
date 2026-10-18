import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import {
  crmLeadDefaults,
  movementSchema,
} from "../packages/content/dist/index.js";
const base = process.env.TEST_API_URL || "http://localhost:4400";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("CRM fixtures are local-only.");
let cookie = "",
  csrf = "";
async function req(path, method = "GET", data, auth = true, token = csrf) {
  const form = data instanceof FormData;
  const r = await fetch(base + path, {
    method,
    headers: {
      Origin: "http://localhost:3300",
      ...(auth ? { Cookie: cookie, "X-Veca-Csrf": token } : {}),
      ...(!form && data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? (form ? data : JSON.stringify(data)) : undefined,
  });
  const text = await r.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: r.status, body, headers: r.headers };
}
const expect = (r, status) => {
  assert.equal(r.status, status, JSON.stringify(r.body));
  return r.body;
};
for (const path of [
  "/admin/crm/leads",
  "/admin/crm/materials",
  "/admin/crm/events",
])
  expect(await req(path, "GET", null, false), 401);
const login = await req("/auth/login", "POST", {
  username: "admin",
  password: "Local-only-visual-test-2026!",
});
expect(login, 201);
cookie = login.headers.get("set-cookie").split(";")[0];
csrf = login.body.csrf;
expect(await req("/admin/crm/leads?page=no"), 400);
const input = {
  name: "Cliente de prueba local",
  email: "cliente@example.invalid",
  phone: "+51 900 000 000",
  district: "San Luis",
  requestType: "premium",
  idea: "Instalación de ventanas para remodelación integral.",
  submissionId: randomUUID(),
  website: "",
};
expect(
  await req(
    "/public/consultations",
    "POST",
    { ...input, segment: "low" },
    false,
  ),
  400,
);
expect(
  await req(
    "/public/consultations",
    "POST",
    { ...input, email: "invalid" },
    false,
  ),
  400,
);
const ref = expect(
  await req("/public/consultations", "POST", input, false),
  201,
);
assert.deepEqual(Object.keys(ref), ["reference"]);
assert.deepEqual(
  expect(await req("/public/consultations", "POST", input, false), 201),
  ref,
);
const path = "/admin/crm/leads/" + ref.reference;
let lead = expect(await req(path), 200).lead;
assert.equal(lead.segment, "high");
assert.equal(lead.stage, "prelead");
assert.equal(lead.source, "web");
assert.equal(
  expect(
    await req("/admin/crm/leads?search=" + encodeURIComponent(input.email)),
    200,
  ).total,
  1,
);
assert.equal(
  expect(
    await req(
      "/admin/crm/leads?segment=low&search=" + encodeURIComponent(input.email),
    ),
    200,
  ).total,
  0,
);
expect(
  await req("/public/consultations/" + ref.reference, "GET", null, false),
  404,
);
const edit = (overrides = {}) => ({
  ...input,
  ...crmLeadDefaults,
  version: lead.version,
  segment: "high",
  stage: lead.stage,
  ...overrides,
});
function payload(overrides = {}) {
  const { submissionId, website, ...data } = edit(overrides);
  return data;
}
expect(await req(path, "PUT", payload(), true, "invalid"), 403);
expect(
  await req(
    path,
    "PUT",
    payload({ stage: "execution", address: "San Luis", workPlan: "Ventanas" }),
  ),
  400,
);
expect(await req(path, "PUT", payload({ stage: "contacted" })), 400);
lead = expect(
  await req(
    path,
    "PUT",
    payload({
      stage: "contacted",
      contactResult: "Contacto exitoso por teléfono.",
    }),
  ),
  200,
);
const {
  id,
  source,
  createdAt,
  updatedAt,
  contactedAt,
  completedAt,
  events,
  ...stored
} = lead;
expect(await req(path, "PUT", { ...stored, version: 1 }), 409);
expect(await req(path, "PUT", { ...stored, contactResult: "" }), 400);
expect(await req(path, "PUT", { ...stored, stage: "coordination" }), 400);
lead = expect(
  await req(path, "PUT", {
    ...stored,
    stage: "coordination",
    appointment: "2026-10-20T10:00",
  }),
  200,
);
assert.equal(lead.appointment, "2026-10-20T10:00:00-05:00");
function update(overrides) {
  const {
    id,
    source,
    createdAt,
    updatedAt,
    contactedAt,
    completedAt,
    events,
    ...fields
  } = lead;
  return { ...fields, ...overrides };
}
expect(await req(path, "PUT", update({ stage: "execution" })), 400);
lead = expect(
  await req(
    path,
    "PUT",
    update({
      stage: "execution",
      address: "Dirección local de QA",
      workPlan: "Instalación de dos ventanas.",
    }),
  ),
  200,
);
const material = expect(
  await req("/admin/crm/materials", "POST", {
    sku: "qa-" + randomUUID().slice(0, 8),
    name: "Vidrio de prueba local",
    unit: "m2",
    category: "Vidrio",
    location: "Almacén QA",
    description: "Solo prueba",
    minimum: 2,
  }),
  201,
);
assert.equal(material.balance, 0);
const movementPath = "/admin/crm/materials/" + material.id + "/movements";
const receipt = {
  operationId: randomUUID(),
  kind: "receipt",
  quantity: 10,
  leadId: null,
  reason: "Ingreso inicial de prueba",
};
expect(await req(movementPath, "POST", receipt), 201);
expect(await req(movementPath, "POST", receipt), 201);
expect(await req(movementPath, "POST", { ...receipt, quantity: 11 }), 409);
const consume = {
  operationId: randomUUID(),
  kind: "consumption",
  quantity: 3.125,
  leadId: lead.id,
  reason: "Instalación de ventana",
};
expect(await req(movementPath, "POST", { ...consume, quantity: 11 }), 409);
expect(await req(movementPath, "POST", { ...consume, quantity: 0.0001 }), 400);
expect(await req(movementPath, "POST", consume), 201);
expect(await req(movementPath, "POST", consume), 201);
const balance = async () =>
  expect(await req("/admin/crm/materials"), 200).find(
    (m) => m.id === material.id,
  ).balance;
assert.equal(await balance(), 6.875);
const parallel = await Promise.all(
  [1, 2].map(() =>
    req(movementPath, "POST", {
      ...consume,
      operationId: randomUUID(),
      quantity: 5,
    }),
  ),
);
assert.deepEqual(parallel.map((r) => r.status).sort(), [201, 409]);
assert.equal(await balance(), 1.875);
expect(
  await req(movementPath, "POST", {
    ...consume,
    operationId: randomUUID(),
    kind: "return",
    quantity: 0.125,
    reason: "Sobrante devuelto al almacén",
  }),
  201,
);
assert.equal(await balance(), 2);
expect(await req(path, "PUT", update({ stage: "completed" })), 400);
lead = expect(
  await req(
    path,
    "PUT",
    update({
      stage: "completed",
      completionNote: "Instalación terminada y revisada con el cliente.",
    }),
  ),
  200,
);
assert.equal(await balance(), 2); // completing a work must never charge material again
expect(await req(path, "PUT", update({ address: "" })), 400);
expect(await req(path, "PUT", update({ stage: "discarded" })), 400);
const invalid = new FormData();
invalid.append(
  "file",
  new Blob(["not-a-pdf"], { type: "application/pdf" }),
  "contrato.pdf",
);
expect(await req(path + "/files", "POST", invalid), 400);
const file = new FormData();
file.append(
  "file",
  new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }),
  "contrato.pdf",
);
file.append("caption", "Contrato local QA");
const attachment = expect(await req(path + "/files", "POST", file), 201);
expect(await req(attachment.url, "GET", null, false), 401);
assert.ok(
  expect(await req(path), 200).attachments.some((a) => a.id === attachment.id),
);
assert.equal(
  (await req(attachment.url)).headers.get("content-disposition"),
  'attachment; filename="contrato.pdf"',
);
// Simulate a process stopping after the atomic stock+audit-outbox write, before ledger delivery.
const mongo = new MongoClient("mongodb://127.0.0.1:27099");
await mongo.connect();
try {
  const db = mongo.db("veca_qa"),
    operation = {
      ...consume,
      operationId: randomUUID(),
      quantity: 0.5,
      reason: "Recuperación de evento pendiente",
    };
  const key = material.id + ":" + operation.operationId;
  const event = {
    _id: key,
    id: key,
    fingerprint: JSON.stringify(movementSchema.parse(operation)),
    materialId: material.id,
    materialName: material.name,
    unit: "m2",
    leadId: lead.id,
    kind: "consumption",
    quantity: 0.5,
    reason: operation.reason,
    actor: "QA",
    at: new Date().toISOString(),
    balanceAfter: 1.5,
  };
  await db
    .collection("inventory_materials")
    .updateOne(
      { _id: new ObjectId(material.id) },
      { $inc: { balanceMilli: -500, version: 1 }, $push: { pending: event } },
    );
  const history = expect(
    await req("/admin/crm/movements?materialId=" + material.id),
    200,
  );
  assert.equal(history.filter((m) => m.id === key).length, 1);
  expect(await req(movementPath, "POST", operation), 201);
  assert.equal(await balance(), 1.5);
  assert.equal(
    (
      await db
        .collection("inventory_materials")
        .findOne({ _id: new ObjectId(material.id) })
    ).pending.length,
    0,
  );
} finally {
  await mongo.close();
}
console.log(
  "CRM integration passed: capture, tags, CSRF/privacy, staged requirements, conflicts, private files, fixed-precision stock, concurrent/idempotent movements and durable recovery.",
);
