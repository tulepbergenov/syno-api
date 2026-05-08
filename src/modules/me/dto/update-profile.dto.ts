import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
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

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: "John",
    minLength: 2,
    description: "User first name.",
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeTrim(value))
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    example: "Doe",
    description: "User last name.",
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeTrim(value))
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    example: "johndoe",
    description: "Unique username.",
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeTrimLower(value))
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX, {
    message:
      "Username can contain only lowercase letters, numbers, dot, underscore and hyphen",
  })
  username?: string;
}
