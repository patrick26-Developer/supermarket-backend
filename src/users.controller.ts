import { Controller, Get, Inject } from "@nestjs/common";

import { RequirePermission } from "./auth/decorators/require-permission.decorator";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @RequirePermission("USERS", "READ")
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
