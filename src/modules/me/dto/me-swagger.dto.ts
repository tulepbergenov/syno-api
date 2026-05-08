import { ApiProperty } from "@nestjs/swagger";

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
    example: "https://storage.example.com/avatars/avatar.png",
    required: false,
    nullable: true,
    description: "Presigned avatar URL. Available for 24 hours.",
  })
  avatarUrl: string | null;
}

export class AvatarResponseDto {
  @ApiProperty({
    example: "https://storage.example.com/avatars/avatar.png",
    description: "Presigned avatar URL. Available for 24 hours.",
  })
  avatarUrl: string;
}
