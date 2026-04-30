import { Injectable } from "@nestjs/common";
import { Client } from "minio";

import { createMinioClient } from "@core/config/minio.config";
import { UsersService } from "../users/users.service";

@Injectable()
export class MeService {
  private readonly minio: Client;

  constructor(private readonly usersService: UsersService) {
    this.minio = createMinioClient();
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (user?.avatarUrl) {
      const url = await this.minio.presignedGetObject(
        "avatars",
        user.avatarUrl,
        24 * 3600,
      );
      return { ...user, avatarUrl: url };
    }
    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const bucket = "avatars";
    await this.ensureBucket(bucket);

    const user = await this.usersService.findById(userId);
    if (user?.avatarUrl) {
      await this.minio.removeObject(bucket, user.avatarUrl).catch(() => null);
    }

    const fileName = `${userId}/avatar/${Date.now()}-${file.originalname}`;

    await this.minio.putObject(bucket, fileName, file.buffer, file.size);

    await this.usersService.updateAvatar(userId, fileName);

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
      const fileName = user.avatarUrl.split("/").at(-1);

      if (fileName) {
        await this.minio
          .removeObject("avatars", user.avatarUrl)
          .catch(() => null);
      }
    }

    return this.usersService.updateAvatar(userId, null);
  }

  private async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.minio.bucketExists(bucket);

    if (!exists) {
      await this.minio.makeBucket(bucket, "us-east-1");
    }
  }
}
