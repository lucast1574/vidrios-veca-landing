import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import sharp from "sharp";
const base = process.env.TEST_API_URL || "http://localhost:4400";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Gallery fixtures are local-only");
let cookie = "",
  csrf = "";
async function req(path, method = "GET", body, credentials = true) {
  const headers = {
    Origin: "http://localhost:3300",
    ...(credentials ? { Cookie: cookie, "X-Veca-Csrf": csrf } : {}),
  };
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const res = await fetch(base + path, {
    method,
    headers,
    body: body instanceof FormData ? body : body && JSON.stringify(body),
  });
  const bytes = await res.arrayBuffer();
  let data;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    data = bytes;
  }
  return { status: res.status, body: data, headers: res.headers };
}
async function login(username = "admin") {
  const r = await req("/auth/login", "POST", {
    username,
    password: "Local-only-visual-test-2026!",
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  cookie = r.headers.get("set-cookie").split(";")[0];
  csrf = r.body.csrf;
}
await login();
const leadResult = await req("/admin/crm/leads", "POST", {
  name: "Cliente local de galería",
  email: "galeria@example.test",
  phone: "908917621",
  district: "San Luis",
  requestType: "premium",
  idea: "Una mampara con detalles para revisar de forma privada.",
  submissionId: randomUUID(),
});
assert.equal(leadResult.status, 201, JSON.stringify(leadResult.body));
const lead = { id: leadResult.body.reference };
async function upload({ pdf = false, tags, sharing } = {}) {
  const form = new FormData();
  const image = pdf
    ? Buffer.from("%PDF-1.4\n%%EOF")
    : await sharp("assets/mamparas.webp").resize(400).webp().toBuffer();
  form.append(
    "file",
    new Blob([image], { type: pdf ? "application/pdf" : "image/webp" }),
    pdf ? "contrato.pdf" : "mampara.webp",
  );
  form.append(
    "caption",
    pdf ? "Contrato privado de prueba" : "Detalle de mampara de prueba",
  );
  if (tags !== undefined) form.append("tags", JSON.stringify(tags));
  if (sharing !== undefined) form.append("sharing", sharing);
  return req(`/admin/crm/leads/${lead.id}/files`, "POST", form);
}
let r = await upload();
assert.equal(r.status, 201);
const internal = r.body;
assert.equal(internal.sharing, "internal");
assert.deepEqual(internal.tags, []);
r = await upload({ tags: ["Resultado", "Detalle"], sharing: "clients" });
assert.equal(r.status, 201);
const approved = r.body;
r = await upload({ pdf: true, tags: ["Resultado"], sharing: "clients" });
assert.equal(r.status, 201);
const pdf = r.body;
assert.equal(pdf.sharing, "internal");
assert.deepEqual(pdf.tags, []);
assert.equal((await upload({ tags: ["Etiqueta inventada"] })).status, 400);
assert.equal((await upload({ sharing: "public" })).status, 400);
const gallery = "/admin/gallery/photos";
assert.equal((await req(gallery, "GET", null, false)).status, 401);
r = await req(gallery);
assert.equal(r.status, 200);
assert.match(r.headers.get("cache-control"), /no-store/);
assert.equal(r.body.total, 2);
assert.ok(
  r.body.items.every(
    (p) =>
      p.type === "photo" && !p.key && !p.mime && !p.lead.phone && !p.lead.email,
  ),
);
assert.ok(
  r.body.items.every(
    (p) => p.lead.id === lead.id && p.lead.requestType === "premium",
  ),
);
assert.equal(
  (
    await req(
      gallery +
        "?sharing=clients&tag=Resultado&requestType=premium&segment=high&search=San%20Luis",
    )
  ).body.total,
  1,
);
assert.equal((await req(gallery + "?sharing=internal")).body.total, 1);
assert.equal((await req(gallery + "?search=.*")).body.total, 0);
assert.equal((await req(gallery + "?page=-1")).status, 400);
assert.equal((await req(gallery + "?tag=Inventada")).status, 400);
for (const photo of [internal, approved]) {
  assert.equal(
    (await req(`${gallery}/${photo.id}`, "GET", null, false)).status,
    401,
  );
  assert.equal((await req(photo.url, "GET", null, false)).status, 401);
  r = await req(`${gallery}/${photo.id}`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control"), /private, no-store/);
  assert.ok(r.body.byteLength > 100);
  assert.equal(
    (await req(`/media/${photo.id}`, "GET", null, false)).status,
    404,
  );
}
assert.equal((await req(`${gallery}/${pdf.id}`)).status, 404);
const originalCsrf = csrf;
csrf = "invalid";
assert.equal(
  (
    await req(`${gallery}/${internal.id}`, "PUT", {
      revision: internal.revision,
      caption: "Cambio",
      tags: [],
      sharing: "clients",
    })
  ).status,
  403,
);
csrf = originalCsrf;
const update = {
  revision: internal.revision,
  caption: "Resultado autorizado para mostrar",
  tags: ["Resultado"],
  sharing: "clients",
};
r = await req(`${gallery}/${internal.id}`, "PUT", update);
assert.equal(r.status, 200);
assert.equal(r.body.revision, internal.revision + 1);
assert.equal(
  (await req(`${gallery}/${internal.id}`, "PUT", update)).status,
  409,
);
assert.equal(
  (
    await req(`${gallery}/${internal.id}`, "PUT", {
      ...update,
      revision: r.body.revision,
      published: true,
    })
  ).status,
  400,
);
assert.equal(
  (await req(`${gallery}/${internal.id}`, "GET", null, false)).status,
  401,
);
const mongo = new MongoClient("mongodb://127.0.0.1:27099");
await mongo.connect();
try {
  const db = mongo.db("veca_qa");
  const files = db.collection("crm_files");
  await files.updateOne(
    { _id: new ObjectId(internal.id) },
    { $unset: { tags: "", sharing: "", revision: "" } },
  );
  r = await req(gallery + "?sharing=internal");
  assert.equal(r.body.total, 1);
  assert.deepEqual(r.body.items[0].tags, []);
  assert.equal(r.body.items[0].revision, 0);
  assert.equal(
    (
      await req(`${gallery}/${internal.id}`, "PUT", {
        revision: 0,
        caption: "Foto antigua conservada",
        tags: ["Antes"],
        sharing: "internal",
      })
    ).status,
    200,
  );
  await db
    .collection("crm_leads")
    .updateOne(
      { _id: new ObjectId(lead.id) },
      { $set: { stage: "completed" } },
    );
  assert.equal((await req(gallery + "?stage=completed")).body.total, 2);
  const source = await files.findOne({ _id: new ObjectId(approved.id) });
  const ids = Array.from({ length: 37 }, () => new ObjectId());
  await files.insertMany(
    ids.map((id, i) => ({
      ...source,
      _id: id,
      caption: "Paginación local " + i,
    })),
  );
  const first = (await req(gallery)).body,
    second = (await req(gallery + "?page=2")).body;
  assert.equal(first.total, 39);
  assert.equal(first.items.length, 36);
  assert.equal(second.items.length, 3);
  assert.equal(first.pages, 2);
  assert.ok(!second.items.some((p) => first.items.some((x) => x.id === p.id)));
  await files.deleteMany({ _id: { $in: ids } });
  await db.collection("roles").insertOne({
    id: "gallery-test-only",
    name: "Galería de prueba",
    permissions: ["gallery"],
    revision: 1,
  });
  const admin = await db.collection("users").findOne({ username: "admin" });
  await db.collection("users").insertOne({
    _id: new ObjectId(),
    username: "gallery-local-test",
    name: "Prueba galería",
    passwordHash: admin.passwordHash,
    emailVerified: true,
    role: "gallery-test-only",
    status: "active",
  });
  await login("gallery-local-test");
  assert.equal((await req(gallery)).status, 200);
  assert.equal((await req(`${gallery}/${approved.id}`)).status, 200);
  assert.equal((await req(approved.url)).status, 403);
  assert.equal((await req(pdf.url)).status, 403);
  assert.equal((await req("/admin/crm/leads")).status, 403);
  assert.equal((await req(`${gallery}/${pdf.id}`)).status, 404);
  await db
    .collection("roles")
    .updateOne(
      { id: "gallery-test-only" },
      { $set: { permissions: [] }, $inc: { revision: 1 } },
    );
  assert.equal((await req(gallery)).status, 403);
  assert.equal((await req(`${gallery}/${approved.id}`)).status, 403);
} finally {
  await mongo.close();
}
console.log(
  "PASS: private lead photo gallery, legacy defaults, tags/search/pagination, permission revocation, contract isolation, CSRF and concurrent edits.",
);
