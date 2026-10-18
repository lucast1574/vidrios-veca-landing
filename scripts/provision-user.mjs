// Run only in a trusted API environment. Prints a password once; never writes it to disk.
import { MongoClient, ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";
import { hash } from "argon2";
const email = (process.env.PROVISION_EMAIL || "").trim().toLowerCase();
const name = (process.env.PROVISION_NAME || "").trim();
const role = process.env.PROVISION_ROLE || "admin";
if (
  !/^[^@\s]+@veca\.com\.pe$/.test(email) ||
  !name ||
  !["admin", "management"].includes(role)
)
  throw new Error("Set a corporate email, name and supported role explicitly.");
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
try {
  const users = client.db(process.env.MONGODB_DATABASE).collection("users");
  if (await users.findOne({ username: email }))
    throw new Error(
      "Account already exists. Its password and permissions were not modified.",
    );
  const password = randomBytes(18).toString("base64url") + "!";
  await users.insertOne({
    _id: new ObjectId(),
    username: email,
    email,
    name,
    role,
    status: "pending",
    emailVerified: false,
    trustedInvitation: true,
    provider: "password",
    passwordHash: await hash(password),
    revision: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(
    JSON.stringify({ email, password, role, verificationRequired: true }),
  );
} finally {
  await client.close();
}
