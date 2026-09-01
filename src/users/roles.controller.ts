import { Controller, Get, Inject } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { RolesService } from "./roles.service";

@Controller("roles")
export class RolesController {
  constructor(@Inject(RolesService) private readonly roles: RolesService) {}

  @RequirePermission("ROLES", "READ")
  @Get()
  findAll() {
    return this.roles.findAll();
  }
}
