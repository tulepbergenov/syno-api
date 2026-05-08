import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const USERNAME_REGEX = /^[a-z0-9._-]+$/;
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
  @MaxLength(30)
  @Matches(USERNAME_REGEX, {
    message:
      "Username can contain only lowercase letters, numbers, dot, underscore and hyphen",
  })
  username: string;

  @ApiProperty({
    example: "John",
    minLength: 2,
    description: "User first name.",
  })
  @Transform(({ value }: { value: unknown }) => normalizeTrim(value))
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: "Doe",
    required: false,
    description: "User last name.",
  })
  @Transform(({ value }: { value: unknown }) => normalizeTrim(value))
  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    example: "Password1",
    minLength: 6,
    description:
      "Password must contain at least one uppercase letter and one number.",
  })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Password must contain at least one uppercase letter and one number",
  })
  password: string;
}
