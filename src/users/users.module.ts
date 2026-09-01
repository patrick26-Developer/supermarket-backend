import { Module } from "@nestjs/common";

import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController, RolesController],
  providers: [UsersService, RolesService],
})
export class UsersModule {}
