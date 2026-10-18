import { SetMetadata } from "@nestjs/common";
import type { Permission } from "@veca/content";

export const ROUTE_ACCESS = Symbol("veca.route-access");
export type RouteAccess =
  | { kind: "public" }
  | { kind: "session" }
  | { kind: "permission"; permission: Permission };

export const PublicEndpoint = () =>
  SetMetadata(ROUTE_ACCESS, { kind: "public" } satisfies RouteAccess);
export const SessionEndpoint = () =>
  SetMetadata(ROUTE_ACCESS, { kind: "session" } satisfies RouteAccess);
export const RequirePermission = (permission: Permission) =>
  SetMetadata(ROUTE_ACCESS, {
    kind: "permission",
    permission,
  } satisfies RouteAccess);
