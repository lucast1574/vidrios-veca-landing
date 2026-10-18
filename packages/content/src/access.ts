import { z } from "zod";
export const PERMISSIONS = [
  "dashboard",
  "projects",
  "leads",
  "inventory",
  "users",
] as const;
export type Permission = (typeof PERMISSIONS)[number];
export const roleSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9_-]*$/);
export type Role = string;
export type RoleDefinition = {
  id: Role;
  name: string;
  description: string;
  permissions: Permission[];
  revision: number;
};
export const accountStatusSchema = z.enum([
  "pending",
  "active",
  "rejected",
  "suspended",
]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type SessionUser = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: Role | null;
  roleName: string | null;
  status: AccountStatus;
  emailVerified: boolean;
  authMethods: ("google" | "password")[];
  accountCreatedAt: string | null;
  permissions: Permission[];
};
export type UserSummary = SessionUser & {
  createdAt: string;
  revision: number;
  provider: "google" | "password";
};
export type AuthSession = { user: SessionUser; csrf: string };
