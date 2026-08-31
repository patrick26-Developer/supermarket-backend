import { Inject, Injectable, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Guard global (voir `AppModule`) : exige un JWT d'accès valide sur toute
 * route, sauf celles marquées `@Public()` (login, refresh, health-check).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt-access") {
  // esbuild/tsx n'émet pas `design:paramtypes` : @Inject() explicite requis.
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
