import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAccessStrategy } from "./strategies/jwt-access.strategy";

@Module({
  imports: [
    PassportModule,
    // Secret et expiresIn sont fournis par appel (access vs refresh) dans
    // AuthService — pas de config statique ici. Voir prisma-8 skill hors
    // sujet ici ; c'est du pur NestJS/@nestjs/jwt.
    JwtModule.register({}),
    // UsersService réutilisé par AuthController pour PUT/POST /auth/me*.
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy],
  exports: [AuthService],
})
export class AuthModule {}
