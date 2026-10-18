import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { config } from "../common/config";
import { equal } from "./auth.crypto";
import type { AuthenticatedRequest } from "./auth.types";
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(protected readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.session = await this.auth.authenticate(req.cookies?.veca_session || "");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.headers.origin !== config.PANEL_ORIGIN ||
        !equal(String(req.headers["x-veca-csrf"] || ""), req.session.csrf))
    )
      throw new ForbiddenException("La sesión cambió. Recarga el panel.");
    return true;
  }
}
