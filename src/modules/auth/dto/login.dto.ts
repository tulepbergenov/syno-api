import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsString } from "class-validator";

const normalizeTrim = (value: unknown) =>
  typeof value === "string" ? value.trim() : value;

const normalizeTrimLower = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class LoginDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email used during registration.",
  })
  @Transform(({ value }: { value: unknown }) => normalizeTrimLower(value))
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "Password1",
    description: "User password.",
  })
  @Transform(({ value }: { value: unknown }) => normalizeTrim(value))
  @IsString()
  password: string;
}
