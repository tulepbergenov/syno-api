import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: "John",
    minLength: 2,
    description: "User first name.",
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({
    example: "Doe",
    description: "User last name.",
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: "johndoe",
    description: "Unique username.",
  })
  @IsOptional()
  @IsString()
  username?: string;
}
