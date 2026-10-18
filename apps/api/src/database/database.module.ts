import {
  Global,
  Injectable,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Db, MongoClient } from "mongodb";
import { config } from "../common/config";
@Injectable()
export class Database implements OnModuleInit, OnModuleDestroy {
  readonly client = new MongoClient(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 6000,
  });
  db!: Db;
  async onModuleInit() {
    await this.client.connect();
    this.db = this.client.db(config.MONGODB_DATABASE);
    await Promise.all([
      this.db
        .collection("verification_challenges")
        .createIndex({ tokenHash: 1 }, { unique: true, sparse: true }),
      this.db
        .collection("verification_challenges")
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.db
        .collection("verification_challenges")
        .createIndex({ userId: 1, purpose: 1 }),
      this.db
        .collection("users")
        .createIndex({ firebaseUid: 1 }, { unique: true, sparse: true }),
      this.db
        .collection("mail_deliveries")
        .createIndex({ status: 1, nextAt: 1 }),
      this.db
        .collection("crm_leads")
        .createIndex({ submissionId: 1 }, { unique: true }),
      this.db.collection("crm_leads").createIndex({ stage: 1, createdAt: -1 }),
      this.db
        .collection("inventory_materials")
        .createIndex({ sku: 1 }, { unique: true }),
      this.db
        .collection("inventory_movements")
        .createIndex({ leadId: 1, at: -1 }),
      this.db
        .collection("inventory_movements")
        .createIndex({ materialId: 1, at: -1 }),
      this.db.collection("crm_files").createIndex({ leadId: 1, createdAt: -1 }),
      this.db.collection("projects").createIndex({ slug: 1 }, { unique: true }),
      this.db
        .collection("projects")
        .createIndex({ "published.category": 1, "published.publishedAt": -1 }),
      this.db
        .collection("users")
        .createIndex({ username: 1 }, { unique: true }),
      this.db
        .collection("sessions")
        .createIndex({ tokenHash: 1 }, { unique: true }),
      this.db
        .collection("sessions")
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.db.collection("media").createIndex({ key: 1 }, { unique: true }),
    ]);
  }
  async onModuleDestroy() {
    await this.client.close();
  }
}
@Global()
@Module({ providers: [Database], exports: [Database] })
export class DatabaseModule {}
