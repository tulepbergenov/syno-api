import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class AccessTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token for authenticated API requests.",
  })
  accessToken: string;
}

export class TokenPairDto extends AccessTokenDto {
  @ApiProperty({
    example: "0f7a9a21-8e2b-4f83-9e87-9f2d4b0f2db3...",
    description: "Refresh token used to rotate the session.",
  })
  refreshToken: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: "0f7a9a21-8e2b-4f83-9e87-9f2d4b0f2db3...",
    description: "Refresh token issued during mobile sign-in or sign-up.",
  })
  @IsString()
  refreshToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class SessionDto {
  @ApiProperty({
    example: "0f7a9a21-8e2b-4f83-9e87-9f2d4b0f2db3",
    description: "Session id.",
  })
  id: string;

  @ApiProperty({
    example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    required: false,
    nullable: true,
    description: "User agent captured for the session.",
  })
  userAgent: string | null;

  @ApiProperty({
    example: "127.0.0.1",
    required: false,
    nullable: true,
    description: "Client IP address captured for the session.",
  })
  ipAddress: string | null;

  @ApiProperty({
    example: "2026-04-30T12:00:00.000Z",
    description: "Session creation date.",
  })
  createdAt: Date;

  @ApiProperty({
    example: "2026-05-30T12:00:00.000Z",
    description: "Refresh token expiration date.",
  })
  expiresAt: Date;

  @ApiProperty({
    example: true,
    description: "Whether this session is the current session.",
  })
  current: boolean;
}
