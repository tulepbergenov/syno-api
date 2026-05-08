import { UsersModule } from "@modules/users/users.module";
import { Module } from "@nestjs/common";
import { MeController } from "./me.controller";
import { MeService } from "./me.service";

@Module({
  imports: [UsersModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
