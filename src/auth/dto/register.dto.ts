import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "johndoe" })
  @IsString()
  username: string;

  @ApiProperty({ example: "John" })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: "Doe", required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: "Password1", minLength: 6 })
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Password must contain at least one uppercase letter and one number",
  })
  password: string;
}
