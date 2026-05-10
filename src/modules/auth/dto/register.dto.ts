import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const USERNAME_REGEX = /^[a-z0-9_]+$/;
const normalizeTrim = (value: unknown) =>
  typeof value === "string" ? value.trim() : value;
const normalizeTrimLower = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Unique email used for authentication.",
  })
  @Transform(({ value }: { value: unknown }) => normalizeTrimLower(value))
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    example: "johndoe",
    description: "Unique public username.",
  })
  @Transform(({ value }: { value: unknown }) => normalizeTrimLower(value))
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(USERNAME_REGEX, {
    message:
      "Username can contain only lowercase letters, numbers and underscore",
  })
  username: string;

  @ApiProperty({
    example: "John",
    minLength: 1,
    description: "User first name.",
  })
  @Transform(({ value }: { value: unknown }) => normalizeTrim(value))
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  firstName: string;

  @ApiProperty({
    example: "Doe",
    description: "User last name.",
  })
  @Transform(({ value }: { value: unknown }) => normalizeTrim(value))
  @IsString()
  @MaxLength(64)
  lastName: string;

  @ApiProperty({
    example: "Password1",
    minLength: 8,
    description: "User password.",
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
