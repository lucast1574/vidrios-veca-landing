import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminGuard } from "./admin.guard";
import { SessionGuard } from "./session.guard";
import { ROUTE_ACCESS, type RouteAccess } from "./route-access";

@Injectable()
export class ApiAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly session: SessionGuard,
    private readonly permissions: AdminGuard,
  ) {}
  async canActivate(context: ExecutionContext) {
    const access = this.reflector.getAllAndOverride<RouteAccess>(ROUTE_ACCESS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (access?.kind === "public") return true;
    if (access?.kind === "session") return this.session.canActivate(context);
    // Missing metadata never makes an endpoint public or grants an implicit permission.
    return this.permissions.canActivate(context);
  }
}
