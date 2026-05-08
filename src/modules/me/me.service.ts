import { MINIO_CLIENT } from "@core/minio/minio.constants";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Client } from "minio";
import { UsersService } from "../users/users.service";
import { AVATAR_MAX_BYTES, AVATAR_MIME_TO_EXT } from "./avatar.constants";

@Injectable()
export class MeService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(MINIO_CLIENT) private readonly minio: Client,
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return user;
    }
    const { avatarUrl } = user;
    const profile = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    if (!avatarUrl) {
      return { ...profile, avatarUrl: null };
    }

    const url = await this.minio.presignedGetObject(
      "avatars",
      avatarUrl,
      24 * 3600,
    );
    return {
      ...profile,
      avatarUrl: url,
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Avatar file is required");
    }

    const ext = AVATAR_MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException("Unsupported avatar file type");
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
      throw new BadRequestException("Invalid avatar file");
    }
    if (file.size > AVATAR_MAX_BYTES) {
      throw new BadRequestException("Avatar file is too large");
    }
    if (!file.buffer?.length) {
      throw new BadRequestException("Invalid avatar file");
    }

    const bucket = "avatars";
    await this.ensureBucket(bucket);

    const user = await this.usersService.findById(userId);
    if (user?.avatarUrl) {
      await this.minio.removeObject(bucket, user.avatarUrl).catch(() => null);
    }

    const fileName = `${userId}/avatar/${Date.now()}-${randomUUID()}.${ext}`;

    await this.minio.putObject(bucket, fileName, file.buffer, file.size, {
      "Content-Type": file.mimetype,
    });

    await this.usersService.updateAvatar(userId, fileName, file.originalname);

    const url = await this.minio.presignedGetObject(
      bucket,
      fileName,
      24 * 3600,
    );

    return { avatarUrl: url };
  }

  async deleteAvatar(userId: string) {
    const user = await this.usersService.findById(userId);

    if (user?.avatarUrl) {
      await this.minio
        .removeObject("avatars", user.avatarUrl)
        .catch(() => null);
    }

    await this.usersService.updateAvatar(userId, null, null);
    return null;
  }

  private async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.minio.bucketExists(bucket);

    if (!exists) {
      await this.minio.makeBucket(bucket, "us-east-1");
    }
  }
}
