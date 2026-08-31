import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { JwtAccessPayload } from "../types/jwt-payload.type";

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, "jwt-access") {
  // esbuild/tsx n'émet pas `design:paramtypes` : @Inject() explicite requis
  // pour toute injection par type (convention du projet, voir users.service.ts).
  constructor(@Inject(ConfigService) config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  // La valeur retournée est posée sur `request.user` par Passport.
  validate(payload: JwtAccessPayload): JwtAccessPayload {
    return payload;
  }
}
