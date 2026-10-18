import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Permission } from "@veca/content";
import { AuthService } from "./auth.service";
import { SessionGuard } from "./session.guard";
import type { AuthenticatedRequest } from "./auth.types";
@Injectable()
export class AdminGuard extends SessionGuard {
  constructor(auth: AuthService) {
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
    const path = req.path;
    let permission: Permission | undefined;
    if (path.startsWith("/admin/users")) permission = "users";
    else if (path.startsWith("/admin/dashboard")) permission = "dashboard";
    else if (path.startsWith("/admin/projects") || path.startsWith("/media"))
      permission = "projects";
    else if (
      path.startsWith("/admin/crm/materials") ||
      path.startsWith("/admin/crm/movements")
    )
      permission = "inventory";
    else if (
      path.startsWith("/admin/crm/leads") ||
      path.startsWith("/admin/crm/files")
    )
      permission = "leads";
    if (permission && !user.permissions.includes(permission))
      throw new ForbiddenException("Tu rol no permite acceder a esta sección.");
    return true;
  }
}
