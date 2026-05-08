import { PrismaService } from "@core/prisma/prisma.service";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomUUID } from "crypto";

export type SessionMeta = {
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async createSession(userId: string, meta: SessionMeta) {
    const refreshToken = this.createRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = this.buildRefreshExpiryDate();

    await this.prisma.session.deleteMany({
      where: {
        userId,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    return { refreshToken };
  }

  async rotateSession(refreshToken: string, meta: SessionMeta) {
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token");
    }

    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (session.expiresAt <= new Date()) {
      await this.prisma.session
        .delete({ where: { id: session.id } })
        .catch(() => null);
      throw new UnauthorizedException("Refresh token expired");
    }

    const nextRefreshToken = this.createRefreshToken();
    const nextRefreshTokenHash = this.hashRefreshToken(nextRefreshToken);
    const expiresAt = this.buildRefreshExpiryDate();

    const rotated = await this.prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash },
      data: {
        refreshTokenHash: nextRefreshTokenHash,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    if (rotated.count === 0) {
      throw new UnauthorizedException("Refresh token already rotated");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return {
      userId: session.userId,
      email: user.email,
      refreshToken: nextRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    await this.prisma.session
      .delete({ where: { refreshTokenHash } })
      .catch(() => null);
  }

  async logoutAllExceptCurrent(userId: string, currentRefreshToken: string) {
    if (!currentRefreshToken) {
      throw new UnauthorizedException("No refresh token");
    }

    const currentRefreshTokenHash = this.hashRefreshToken(currentRefreshToken);
    const currentSession = await this.prisma.session.findFirst({
      where: { userId, refreshTokenHash: currentRefreshTokenHash },
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

  async getSessions(userId: string, currentRefreshToken: string) {
    const currentRefreshTokenHash = currentRefreshToken
      ? this.hashRefreshToken(currentRefreshToken)
      : "";

    const sessions = await this.prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        refreshTokenHash: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      current:
        Boolean(currentRefreshTokenHash) &&
        session.refreshTokenHash === currentRefreshTokenHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.deleteMany({
      where: { id: sessionId, userId },
    });
  }

  private createRefreshToken() {
    return randomUUID() + randomUUID();
  }

  private hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private buildRefreshExpiryDate() {
    const refreshExpiresDays = 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);
    return expiresAt;
  }
}
