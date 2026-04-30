import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MeService } from "./me.service";
import { UsersService } from "../users/users.service";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { type AuthenticatedRequest } from "@core/common/interfaces/authenticated-request.interface";

@ApiTags("Me")
@ApiBearerAuth()
@Controller("me")
export class MeController {
  constructor(
    private meService: MeService,
    private usersService: UsersService,
  ) {}

  @Get()
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.meService.getProfile(req.user.id);
  }

  @Patch()
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() data: { firstName?: string; lastName?: string; username?: string },
  ) {
    return this.usersService.update(req.user.id, data);
  }

  @Post("avatar")
  @UseInterceptors(FileInterceptor("avatar"))
  uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.meService.uploadAvatar(req.user.id, file);
  }

  @Delete("avatar")
  deleteAvatar(@Req() req: AuthenticatedRequest) {
    return this.meService.deleteAvatar(req.user.id);
  }
}
