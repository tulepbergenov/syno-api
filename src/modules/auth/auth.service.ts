import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "@modules/users/users.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { ConfigService } from "@nestjs/config";
import { EnvConfig } from "@core/config/env.interface";
import { SessionMeta, SessionsService } from "./sessions.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService<EnvConfig, true>,
    private sessionsService: SessionsService,
  ) {}

  async register(dto: RegisterDto, meta: SessionMeta) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    const session = await this.sessionsService.createSession(user.id, meta);
    const accessToken = this.createAccessToken(user.id, user.email);
    return { accessToken, refreshToken: session.refreshToken };
  }

  async login(dto: LoginDto, meta: SessionMeta) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException("Invalid credentials");

    const session = await this.sessionsService.createSession(user.id, meta);
    const accessToken = this.createAccessToken(user.id, user.email);
    return { accessToken, refreshToken: session.refreshToken };
  }

  async refresh(refreshToken: string, meta: SessionMeta) {
    const rotated = await this.sessionsService.rotateSession(
      refreshToken,
      meta,
    );
    const accessToken = this.createAccessToken(rotated.userId, rotated.email);
    return { accessToken, refreshToken: rotated.refreshToken };
  }

  private createAccessToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.config.get("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get("JWT_ACCESS_EXPIRES_IN"),
      },
    );
  }
}
