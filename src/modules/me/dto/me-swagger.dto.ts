import { ApiProperty } from "@nestjs/swagger";

export class AvatarDto {
  @ApiProperty({
    example: "avatar.jpg",
    description: "Original avatar file name from upload.",
  })
  name: string;

  @ApiProperty({
    example: 245671,
    required: false,
    nullable: true,
    description: "Avatar file size in bytes reported by object storage.",
  })
  size: number | null;

  @ApiProperty({
    example: "https://storage.example.com/avatars/avatar.png",
    description: "Presigned avatar URL. Available for 24 hours.",
  })
  url: string;
}

export class UserProfileDto {
  @ApiProperty({
    example: "0f7a9a21-8e2b-4f83-9e87-9f2d4b0f2db3",
    description: "User id.",
  })
  id: string;

  @ApiProperty({
    example: "user@example.com",
    description: "Unique user email.",
  })
  email: string;

  @ApiProperty({
    example: "johndoe",
    description: "Unique username.",
  })
  username: string;

  @ApiProperty({
    example: "John",
    description: "User first name.",
  })
  firstName: string;

  @ApiProperty({
    example: "Doe",
    required: false,
    nullable: true,
    description: "User last name.",
  })
  lastName: string | null;

  @ApiProperty({
    type: AvatarDto,
    required: false,
    nullable: true,
    description: "Avatar metadata and presigned URL.",
  })
  avatar: AvatarDto | null;
}

export class AvatarResponseDto {
  @ApiProperty({
    type: AvatarDto,
    description: "Uploaded avatar metadata and presigned URL.",
  })
  avatar: AvatarDto;
}
