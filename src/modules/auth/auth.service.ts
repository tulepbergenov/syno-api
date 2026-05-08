import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "@modules/users/users.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@core/prisma/prisma.service";
import { randomUUID } from "crypto";
import { EnvConfig } from "@core/config/env.interface";

type SessionMeta = {
  userAgent?: string;
  ipAddress?: string;
};

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

    if (session.expiresAt <= new Date()) {
      await this.prisma.session
        .delete({ where: { id: session.id } })
        .catch(() => null);
      throw new UnauthorizedException("Refresh token expired");
    }

    const nextRefreshToken = this.createRefreshToken();
    const expiresAt = this.buildRefreshExpiryDate();

    const rotated = await this.prisma.session.updateMany({
      where: { id: session.id, refreshToken },
      data: {
        refreshToken: nextRefreshToken,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    if (rotated.count === 0)
      throw new UnauthorizedException("Refresh token already rotated");

    const accessToken = this.createAccessToken(
      session.user.id,
      session.user.email,
    );

    return { accessToken, refreshToken: nextRefreshToken };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    await this.prisma.session
      .delete({ where: { refreshToken } })
      .catch(() => null);
  }

  async logoutAll(userId: string, currentRefreshToken: string) {
    if (!currentRefreshToken) {
      throw new UnauthorizedException("No refresh token");
    }

    const currentSession = await this.prisma.session.findFirst({
      where: { userId, refreshToken: currentRefreshToken },
      select: { id: true },
    });

    if (!currentSession) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSession.id },
      },
    });
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
    const refreshToken = this.createRefreshToken();
    const expiresAt = this.buildRefreshExpiryDate();

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    const accessToken = this.createAccessToken(userId, email);

    return { accessToken, refreshToken };
  }

  private createRefreshToken() {
    return randomUUID() + randomUUID();
  }

  private buildRefreshExpiryDate() {
    const refreshExpiresDays = 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);
    return expiresAt;
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
