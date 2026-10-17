import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AdminGuard } from "./admin.guard";
import { AuthController } from "./auth.controller";
@Module({
  controllers: [AuthController],
  providers: [AuthService, AdminGuard],
  exports: [AuthService, AdminGuard],
})
export class AuthModule {}
