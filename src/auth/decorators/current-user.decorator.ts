import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { JwtAccessPayload } from "../types/jwt-payload.type";

/** Injecte le payload JWT de l'utilisateur authentifié (`request.user`, posé par `JwtAccessStrategy`). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAccessPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtAccessPayload }>();
    return request.user;
  },
);
