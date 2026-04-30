import { IsEmail, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email used during registration.",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "Password1",
    description: "User password.",
  })
  @IsString()
  password: string;
}
