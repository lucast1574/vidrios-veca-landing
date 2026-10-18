import assert from "node:assert/strict";
import { MongoClient, ObjectId } from "mongodb";
import { hash } from "argon2";
import sharp from "sharp";
const base = process.env.TEST_API_URL || "http://localhost:4400";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Profile fixtures are local-only.");
process.env.MONGODB_URI = "mongodb://127.0.0.1:27099";
process.env.MONGODB_DATABASE = "veca_qa";
process.env.PUBLIC_API_URL = base;
process.env.FIREBASE_PROJECT_ID = "veca-local-qa";
process.env.FIREBASE_API_KEY = "local-public-config-only";
const { AuthService } = await import("../apps/api/dist/auth/auth.service.js");
const { RolesService } = await import("../apps/api/dist/auth/roles.service.js");
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("veca_qa");
async function request(path, method = "GET", body, session) {
  const r = await fetch(base + path, {
    method,
    headers: {
      Origin: "http://localhost:3300",
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(session
        ? { Cookie: session.cookie, "X-Veca-Csrf": session.csrf }
        : {}),
    },
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  return {
    r,
    status: r.status,
    body: r.headers.get("content-type")?.includes("json")
      ? await r.json()
      : await r.arrayBuffer(),
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
function expect(result, status) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result;
}
const id = new ObjectId(),
  email = "profile-qa@example.invalid",
  password = "Local-only-profile-test-2026!";
try {
  await db
    .collection("users")
    .insertOne({
      _id: id,
      username: email,
      email,
      name: "Miembro de pruebas",
      passwordHash: await hash(password),
      role: "viewer",
      status: "active",
      emailVerified: true,
      provider: "google",
      firebaseUid: "local-google-profile-uid",
      createdAt: new Date(),
    });
  const login = expect(
    await request("/auth/login", "POST", { username: email, password }),
    201,
  );
  const own = { cookie: login.cookie, csrf: login.body.csrf };
  const adminLogin = expect(
    await request("/auth/login", "POST", {
      username: "admin",
      password: "Local-only-visual-test-2026!",
    }),
    201,
  );
  const admin = { cookie: adminLogin.cookie, csrf: adminLogin.body.csrf };
  for (const [method, path] of [
    ["POST", "/account/avatar"],
    ["POST", "/account/avatar/preference"],
    ["POST", "/account/avatar/google"],
    ["GET", `/account/avatar/${id}`],
  ])
    expect(
      await request(path, method, method === "POST" ? {} : undefined),
      401,
    );
  const database = { db },
    roles = new RolesService(database);
  const auth = new AuthService(database, roles, {}, { queue: async () => {} });
  const identity = {
    uid: "local-google-profile-uid",
    email,
    email_verified: true,
    picture: "https://lh3.googleusercontent.com/a/local-profile-fixture",
    firebase: { sign_in_provider: "google.com" },
  };
  // The external signature boundary is separately covered by forged-token HTTP tests.
  // Here a verified identity fixture exercises the real persistence and account selection logic.
  auth.googleIdentity = async () => identity;
  let google = await auth.google("verified-identity-fixture");
  assert.equal(google.user.avatarUrl, identity.picture);
  assert.equal(google.user.avatarSource, "google");
  expect(
    await request(
      "/account/avatar/google",
      "POST",
      { idToken: "fabricated-token-not-accepted" },
      own,
    ),
    401,
  );
  auth.googleIdentity = async () => ({ ...identity, uid: "different-account" });
  await assert.rejects(
    () => auth.synchronizeGooglePhoto(String(id), "fixture"),
    (error) => error.getStatus() === 403,
  );
  auth.googleIdentity = async () => identity;
  expect(
    await request(
      "/account/avatar/preference",
      "POST",
      { source: "google", userId: adminLogin.body.user.id },
      own,
    ),
    400,
  );
  const image = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#e74927" },
  })
    .jpeg()
    .toBuffer();
  const form = () => {
    const f = new FormData();
    f.append("file", new Blob([image], { type: "image/jpeg" }), "portrait.jpg");
    return f;
  };
  expect(
    await request("/account/avatar", "POST", form(), {
      ...own,
      csrf: "invalid",
    }),
    403,
  );
  const malicious = new FormData();
  malicious.append(
    "file",
    new Blob(["<svg><script>alert(1)</script></svg>"], {
      type: "image/svg+xml",
    }),
    "not-a-photo.svg",
  );
  expect(await request("/account/avatar", "POST", malicious, own), 400);
  const upload = expect(
    await request("/account/avatar", "POST", form(), own),
    201,
  );
  assert.equal(upload.body.user.avatarSource, "upload");
  assert.ok(upload.body.user.avatarUrl.includes(`/account/avatar/${id}?v=`));
  const photo = expect(
    await request(`/account/avatar/${id}`, "GET", null, own),
    200,
  );
  const meta = await sharp(Buffer.from(photo.body)).metadata();
  assert.equal(meta.width, 512);
  assert.equal(meta.height, 512);
  assert.equal(meta.format, "webp");
  assert.equal(meta.exif, undefined);
  assert.equal(photo.r.headers.get("cache-control"), "private, no-store");
  expect(await request(`/account/avatar/${id}`, "GET", null, admin), 200);
  expect(
    await request(
      `/account/avatar/${adminLogin.body.user.id}`,
      "GET",
      null,
      own,
    ),
    403,
  );
  const nextGoogle = await auth.google("verified-identity-fixture");
  assert.equal(nextGoogle.user.avatarSource, "upload");
  assert.equal(nextGoogle.user.avatarUrl, upload.body.user.avatarUrl);
  const reset = expect(
    await request(
      "/account/avatar/preference",
      "POST",
      { source: "google" },
      own,
    ),
    201,
  );
  assert.equal(reset.body.user.avatarUrl, identity.picture);
  expect(await request(`/account/avatar/${id}`, "GET", null, own), 404);
  const cleared = expect(
    await request(
      "/account/avatar/preference",
      "POST",
      { source: "none" },
      own,
    ),
    201,
  );
  assert.equal(cleared.body.user.avatarUrl, null);
  assert.equal(
    (await auth.google("verified-identity-fixture")).user.avatarUrl,
    null,
  );
  console.log(
    "Profile integration passed: Google photo sync, mismatched-identity rejection, custom upload priority, private S3 round-trip, square WebP/EXIF removal, CSRF, ownership/admin checks, invalid images, removal and source changes.",
  );
} finally {
  await client.close();
}
