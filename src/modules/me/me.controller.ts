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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { type AuthenticatedRequest } from "@core/common/interfaces/authenticated-request.interface";
import {
  ApiErrorResponse,
  ApiWrappedResponse,
} from "@core/common/swagger/api-response.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AvatarResponseDto, UserProfileDto } from "./dto/me-swagger.dto";

@ApiTags("Me")
@ApiBearerAuth()
@Controller("me")
export class MeController {
  constructor(
    private meService: MeService,
    private usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Get current user profile",
    description:
      "Returns the authenticated user's profile. If an avatar exists, avatarUrl is returned as a presigned URL valid for 24 hours.",
  })
  @ApiWrappedResponse({
    status: 200,
    description: "Current user profile returned.",
    type: UserProfileDto,
  })
  @ApiErrorResponse(401, "Unauthorized")
  @ApiErrorResponse(404, "User not found")
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.meService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({
    summary: "Update current user profile",
    description:
      "Updates editable fields of the authenticated user's profile: firstName, lastName and username.",
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiWrappedResponse({
    status: 200,
    description: "Current user profile updated.",
    type: UserProfileDto,
  })
  @ApiErrorResponse(400, "Validation failed")
  @ApiErrorResponse(401, "Unauthorized")
  @ApiErrorResponse(404, "User not found")
  @ApiErrorResponse(409, "Username already exists")
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateProfileDto,
  ) {
    return this.usersService.update(req.user.id, data);
  }

  @Post("avatar")
  @UseInterceptors(FileInterceptor("avatar"))
  @ApiOperation({
    summary: "Upload current user avatar",
    description:
      "Uploads an avatar image to object storage, removes the previous avatar if it exists and returns a presigned URL.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["avatar"],
      properties: {
        avatar: {
          type: "string",
          format: "binary",
          description: "Avatar image file.",
        },
      },
    },
  })
  @ApiWrappedResponse({
    status: 201,
    description: "Avatar uploaded.",
    type: AvatarResponseDto,
  })
  @ApiErrorResponse(400, "Avatar file is required")
  @ApiErrorResponse(401, "Unauthorized")
  uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.meService.uploadAvatar(req.user.id, file);
  }

  @Delete("avatar")
  @ApiOperation({
    summary: "Delete current user avatar",
    description:
      "Removes the authenticated user's avatar from object storage when present and clears avatarUrl on the profile.",
  })
  @ApiWrappedResponse({
    status: 200,
    description: "Avatar deleted and profile returned.",
    type: UserProfileDto,
  })
  @ApiErrorResponse(401, "Unauthorized")
  @ApiErrorResponse(404, "User not found")
  deleteAvatar(@Req() req: AuthenticatedRequest) {
    return this.meService.deleteAvatar(req.user.id);
  }
}
