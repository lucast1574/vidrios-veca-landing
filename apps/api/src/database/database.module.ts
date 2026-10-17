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
