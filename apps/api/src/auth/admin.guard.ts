import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { AuthService, equal } from "./auth.service";
import type { AuthenticatedRequest } from "./auth.types";
import { config } from "../common/config";
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await this.auth.authenticate(
      req.cookies?.veca_session || "",
    );
    req.session = session;
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (
        req.headers.origin !== config.PANEL_ORIGIN ||
        !equal(String(req.headers["x-veca-csrf"] || ""), session.csrf)
      )
        throw new ForbiddenException("La sesión cambió. Recarga el panel.");
    }
    return true;
  }
}
