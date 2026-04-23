import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";
import { EnvConfig } from "../config/env.interface";

interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService<EnvConfig, true>,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto, meta: SessionMeta) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    return this.createSession(user.id, user.email, meta);
  }

  async login(dto: LoginDto, meta: SessionMeta) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException("Invalid credentials");

    return this.createSession(user.id, user.email, meta);
  }

  async refresh(refreshToken: string, meta: SessionMeta) {
    if (!refreshToken) throw new UnauthorizedException("No refresh token");

    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
    if (!session) throw new UnauthorizedException("Invalid refresh token");

    await this.prisma.session.delete({ where: { id: session.id } });
    return this.createSession(session.user.id, session.user.email, meta);
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    await this.prisma.session
      .delete({ where: { refreshToken } })
      .catch(() => null);
  }

  async logoutAll(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.deleteMany({
      where: { id: sessionId, userId },
    });
  }

  private async createSession(
    userId: string,
    email: string,
    meta: SessionMeta,
  ) {
    const refreshToken = randomUUID() + randomUUID();
    const refreshExpiresDays = 30;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.config.get("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get("JWT_ACCESS_EXPIRES_IN"),
      },
    );

    return { accessToken, refreshToken };
  }
}
