import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "@core/prisma/prisma.module";
import { MinioModule } from "@core/minio/minio.module";
import { UsersModule } from "@modules/users/users.module";
import { AuthModule } from "@modules/auth/auth.module";
import { envSchema } from "@core/config/env.validation";
import { MeModule } from "./modules/me/me.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    PrismaModule,
    MinioModule,
    UsersModule,
    AuthModule,
    MeModule,
  ],
})
export class AppModule {}
