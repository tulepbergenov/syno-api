import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Unique email used for authentication.",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "johndoe",
    description: "Unique public username.",
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: "John",
    minLength: 2,
    description: "User first name.",
  })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    example: "Doe",
    required: false,
    description: "User last name.",
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: "Password1",
    minLength: 6,
    description:
      "Password must contain at least one uppercase letter and one number.",
  })
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Password must contain at least one uppercase letter and one number",
  })
  password: string;
}
