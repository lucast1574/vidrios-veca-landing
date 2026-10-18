import { VerificationService } from "./verification.service";
import { SessionGuard } from "./session.guard";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ApiAccessGuard } from "./api-access.guard";
import { AuthService } from "./auth.service";
import { AdminGuard } from "./admin.guard";
import { AuthController } from "./auth.controller";
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AdminGuard,
    SessionGuard,
    VerificationService,
    { provide: APP_GUARD, useClass: ApiAccessGuard },
  ],
  exports: [AuthService, AdminGuard, SessionGuard, VerificationService],
})
export class AuthModule {}
