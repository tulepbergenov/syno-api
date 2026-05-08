import { Global, Module } from "@nestjs/common";
import { createMinioClient } from "./minio.config";
import { MINIO_CLIENT } from "./minio.constants";

@Global()
@Module({
  providers: [
    {
      provide: MINIO_CLIENT,
      useFactory: createMinioClient,
    },
  ],
  exports: [MINIO_CLIENT],
})
export class MinioModule {}
