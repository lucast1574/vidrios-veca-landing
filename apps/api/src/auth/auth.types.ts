import type { ObjectId } from "mongodb";
import type { Request } from "express";
import type { Role, AccountStatus, SessionUser } from "@veca/content";
export interface UserDocument {
  _id: ObjectId;
  username: string;
  role: Role | null;
  passwordHash: string | null;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  status?: AccountStatus;
  firebaseUid?: string;
  provider?: "google" | "password";
  revision?: number;
  setupHash?: string;
  setupExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  trustedInvitation?: boolean;
  accessEvents?: {
    actor: string;
    at: Date;
    from: { role: Role | null; status?: AccountStatus };
    to: { role: Role; status: AccountStatus };
  }[];
}
export interface SessionDocument {
  _id?: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  csrf: string;
  expiresAt: Date;
}
export type AuthenticatedSession = SessionDocument & { user: SessionUser };
export type AuthenticatedRequest = Request & { session: AuthenticatedSession };
