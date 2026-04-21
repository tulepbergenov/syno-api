import { Controller, Get, Request } from "@nestjs/common";
import { UsersService } from "./users.service";
import { type AuthenticatedRequest } from "../common/interfaces/authenticated-request.interface";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  getMe(@Request() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.id);
  }
}
