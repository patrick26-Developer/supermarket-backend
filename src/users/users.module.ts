import { Module } from "@nestjs/common";

import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController, RolesController],
  providers: [UsersService, RolesService],
  // AuthController réutilise UsersService pour PUT/POST /auth/me* (profil,
  // changement de mot de passe en libre-service) — voir AuthModule.
  exports: [UsersService],
})
export class UsersModule {}
