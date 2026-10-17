import type { ObjectId } from "mongodb";
import type { Request } from "express";
export interface UserDocument {
  _id: ObjectId;
  username: string;
  role: "admin";
  passwordHash: string | null;
  setupHash?: string;
  setupExpires?: Date;
  createdAt?: Date;
}
export interface SessionDocument {
  _id?: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  csrf: string;
  expiresAt: Date;
}
export type AuthenticatedSession = SessionDocument & {
  user: { username: string; role: "admin" };
};
export type AuthenticatedRequest = Request & { session: AuthenticatedSession };
