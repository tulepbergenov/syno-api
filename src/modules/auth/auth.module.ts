import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "@modules/users/users.module";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { SessionsService } from "./sessions.service";

@Module({
  imports: [UsersModule, ConfigModule, JwtModule.register({})],
  providers: [AuthService, SessionsService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
