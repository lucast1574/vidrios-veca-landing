import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { AdminGuard } from "./admin.guard";
import { parse } from "../common/validation";
import { config } from "../common/config";
import type { AuthenticatedRequest } from "./auth.types";
const login = z
  .object({
    username: z.string().min(1).max(100),
    password: z.string().min(1).max(256),
  })
  .strict();
const activation = z
  .object({
    token: z.string().min(20).max(200),
    password: z.string().min(12, "Usa al menos 12 caracteres.").max(256),
  })
  .strict();
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  private origin(req: Request) {
    if (req.headers.origin !== config.PANEL_ORIGIN)
      throw new ForbiddenException();
  }
  private respond(res: Response, s: any) {
    res.cookie("veca_session", s.token, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      expires: s.expiresAt,
      path: "/",
    });
    return { user: s.user, csrf: s.csrf };
  }
  @Post("bootstrap")
  async bootstrap(@Body() input: unknown) {
    const value = parse(
      z.object({ key: z.string().min(32).max(200) }).strict(),
      input,
    );
    return this.auth.prepareAdmin(value.key);
  }
  @Post("login") async login(
    @Body() input: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    const d = parse(login, input);
    return this.respond(res, await this.auth.login(d.username, d.password));
  }
  @Post("activate") async activate(
    @Body() input: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    const d = parse(activation, input);
    return this.respond(res, await this.auth.setup(d.token, d.password));
  }
  @UseGuards(AdminGuard) @Get("me") me(@Req() req: AuthenticatedRequest) {
    return { user: req.session.user, csrf: req.session.csrf };
  }
  @UseGuards(AdminGuard) @Post("logout") async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.cookies.veca_session);
    res.clearCookie("veca_session", {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    return { ok: true };
  }
}
