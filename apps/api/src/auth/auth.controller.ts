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
import { SessionGuard } from "./session.guard";
import { MailService } from "../mail/mail.service";
import { parse } from "../common/validation";
import { config } from "../common/config";
import type { AuthenticatedRequest } from "./auth.types";
const login = z
  .object({
    username: z.string().min(1).max(180),
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
  constructor(
    private readonly auth: AuthService,
    private readonly mail: MailService,
  ) {}
  private origin(req: Request) {
    if (req.headers.origin !== config.PANEL_ORIGIN)
      throw new ForbiddenException();
  }
  private respond(res: Response, s: any) {
    if (s.verificationRequired) return s;
    res.cookie("veca_session", s.token, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      expires: s.expiresAt,
      path: "/",
    });
    return { user: s.user, csrf: s.csrf };
  }
  @Get("config") settings() {
    return {
      emailRegistrationAvailable: this.mail.configured,
      google:
        config.FIREBASE_PROJECT_ID && config.FIREBASE_API_KEY
          ? {
              projectId: config.FIREBASE_PROJECT_ID,
              apiKey: config.FIREBASE_API_KEY,
              authDomain: config.FIREBASE_AUTH_DOMAIN,
              appId: config.FIREBASE_APP_ID,
            }
          : null,
    };
  }
  @Post("register") async register(@Body() body: unknown, @Req() req: Request) {
    this.origin(req);
    const d = parse(
      z
        .object({
          name: z.string().trim().min(2).max(100),
          email: z.string().trim().email().max(180),
          password: z.string().min(12, "Usa al menos 12 caracteres.").max(256),
        })
        .strict(),
      body,
    );
    return this.auth.register(d.name, d.email, d.password);
  }
  @Post("verify") async verify(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    const d = parse(
      z
        .object({
          challenge: z.string().min(30).max(100),
          code: z.string().regex(/^\d{6}$/),
        })
        .strict(),
      body,
    );
    return this.respond(res, await this.auth.confirm(d.challenge, d.code));
  }
  @Post("google") async google(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    const d = parse(
      z.object({ idToken: z.string().min(20).max(10000) }).strict(),
      body,
    );
    return this.respond(res, await this.auth.google(d.idToken));
  }
  @Post("forgot") async forgot(@Body() body: unknown, @Req() req: Request) {
    this.origin(req);
    const d = parse(
      z.object({ email: z.string().trim().email().max(180) }).strict(),
      body,
    );
    return this.auth.forgot(d.email);
  }
  @Post("reset") async reset(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    const d = parse(
      z
        .object({
          challenge: z.string().min(30).max(100),
          code: z.string().regex(/^\d{6}$/),
          password: z.string().min(12).max(256),
        })
        .strict(),
      body,
    );
    return this.respond(
      res,
      await this.auth.reset(d.challenge, d.code, d.password),
    );
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
  @UseGuards(SessionGuard) @Get("me") me(@Req() req: AuthenticatedRequest) {
    return { user: req.session.user, csrf: req.session.csrf };
  }
  @UseGuards(SessionGuard) @Post("logout") async logout(
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
