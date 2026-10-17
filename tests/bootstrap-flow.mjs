import assert from "node:assert/strict";
import { MongoClient } from "mongodb";
const api = "http://localhost:4400",
  origin = "http://localhost:3300";
const dbClient = new MongoClient("mongodb://127.0.0.1:27099");
await dbClient.connect();
const db = dbClient.db("veca_qa");
try {
  const ready = await fetch(api + "/health/ready");
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).storage, "connected");
  await db.collection("users").deleteMany({});
  await db.collection("sessions").deleteMany({});
  const call = (route, data) =>
    fetch(api + route, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(data),
    });
  let r = await call("/auth/bootstrap", {
    key: "not-authorized-even-if-it-is-long-enough",
  });
  assert.equal(r.status, 403);
  assert.equal(
    (
      await call("/auth/bootstrap", {
        key: "ñ".repeat("local-qa-bootstrap-key-only-at-least-32".length),
      })
    ).status,
    403,
  );
  r = await call("/auth/bootstrap", {
    key: "local-qa-bootstrap-key-only-at-least-32",
  });
  assert.equal(r.status, 201);
  const account = await r.json();
  assert.equal(account.username, "admin");
  const token = new URLSearchParams(
    new URL(account.activationUrl).hash.slice(1),
  ).get("activate");
  assert.ok(token);
  assert.equal(
    (
      await call("/auth/login", {
        username: "admin",
        password: "Local-only-visual-test-2026!",
      })
    ).status,
    401,
  );
  assert.equal(
    (await call("/auth/activate", { token, password: "short" })).status,
    400,
  );
  r = await call("/auth/activate", {
    token,
    password: "Local-only-visual-test-2026!",
  });
  assert.equal(r.status, 201);
  assert.ok(r.headers.get("set-cookie").includes("HttpOnly"));
  assert.equal(
    (
      await call("/auth/activate", {
        token,
        password: "another-local-test-password",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/auth/bootstrap", {
        key: "local-qa-bootstrap-key-only-at-least-32",
      })
    ).status,
    409,
  );
  const stored = await db.collection("users").findOne({ username: "admin" });
  assert.equal(stored.setupHash, undefined);
  assert.match(stored.passwordHash, /^\$argon2/);
  assert.equal(
    (
      await call("/auth/login", {
        username: "admin",
        password: "Local-only-visual-test-2026!",
      })
    ).status,
    201,
  );
  console.log(
    "PASS: private admin provisioning, inactive account, password minimum, one-use activation, no replacement of administrator and Argon2 storage.",
  );
} finally {
  await dbClient.close();
}
