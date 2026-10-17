// Run once in the API's trusted runtime. Only a one-use activation link is printed.
import { MongoClient } from "mongodb";
import { randomBytes, createHash } from "node:crypto";
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
try {
  const users = client
    .db(process.env.MONGODB_DATABASE)
    .collection("users");
  const existing = await users.findOne({ username: "admin" });
  if (existing?.passwordHash)
    throw new Error(
      "El administrador ya está activo; no se cambia su contraseña.",
    );
  const token = randomBytes(32).toString("base64url");
  await users.updateOne(
    { username: "admin", passwordHash: { $in: [null] } },
    {
      $set: {
        role: "admin",
        passwordHash: null,
        setupHash: createHash("sha256").update(token).digest("hex"),
        setupExpires: new Date(Date.now() + 3600_000),
      },
      $setOnInsert: { username: "admin", createdAt: new Date() },
    },
    { upsert: true },
  );
  console.log(
    `${process.env.PANEL_ORIGIN || "http://localhost:5173"}/#activate=${token}`,
  );
} finally {
  await client.close();
}
