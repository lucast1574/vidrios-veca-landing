import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROUTE_ACCESS, type RouteAccess } from "./route-access";
import { AuthService } from "./auth.service";
import { SessionGuard } from "./session.guard";
import type { AuthenticatedRequest } from "./auth.types";
@Injectable()
export class AdminGuard extends SessionGuard {
  constructor(
    auth: AuthService,
    private readonly reflector: Reflector,
  ) {
    super(auth);
  }
  async canActivate(context: ExecutionContext) {
    await super.canActivate(context);
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.session.user;
    if (user.status !== "active" || !user.emailVerified)
      throw new ForbiddenException(
        "Tu cuenta está pendiente de aprobación o no tiene acceso activo.",
      );
    const access = this.reflector.getAllAndOverride<RouteAccess>(ROUTE_ACCESS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (
      access?.kind !== "permission" ||
      !user.permissions.includes(access.permission)
    )
      throw new ForbiddenException("Tu rol no permite acceder a esta sección.");
    return true;
  }
}
