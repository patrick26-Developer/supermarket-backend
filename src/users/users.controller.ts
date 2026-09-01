import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { AssignRoleDto } from "./dto/assign-role.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import type { RoleCodeValue, UserStatusValue } from "./types/user-enums";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @RequirePermission("USERS", "READ")
  @Get()
  findAll(@Query("status") status?: UserStatusValue) {
    return this.users.findAll(status);
  }

  @RequirePermission("USERS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }

  @RequirePermission("USERS", "CREATE")
  @Post()
  create(@Body(new ValidateBodyPipe(CreateUserDto)) dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @RequirePermission("USERS", "UPDATE")
  @Put(":id")
  update(@Param("id") id: string, @Body(new ValidateBodyPipe(UpdateUserDto)) dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @RequirePermission("USERS", "UPDATE")
  @Post(":id/roles")
  assignRole(@Param("id") id: string, @Body(new ValidateBodyPipe(AssignRoleDto)) dto: AssignRoleDto) {
    return this.users.assignRole(id, dto.roleCode);
  }

  @RequirePermission("USERS", "UPDATE")
  @Delete(":id/roles/:roleCode")
  revokeRole(@Param("id") id: string, @Param("roleCode") roleCode: RoleCodeValue) {
    return this.users.revokeRole(id, roleCode);
  }

  @RequirePermission("USERS", "UPDATE")
  @Post(":id/reset-password")
  resetPassword(
    @Param("id") id: string,
    @Body(new ValidateBodyPipe(ResetPasswordDto)) dto: ResetPasswordDto,
  ) {
    return this.users.resetPassword(id, dto);
  }
}
