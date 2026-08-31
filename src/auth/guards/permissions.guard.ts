import { Inject, Injectable, ForbiddenException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { PrismaService } from "../../prisma.service";
import { PERMISSION_KEY, type RequiredPermission } from "../decorators/require-permission.decorator";
import type { JwtAccessPayload } from "../types/jwt-payload.type";

/**
 * Guard global (voir `AppModule`) : n'agit que sur les routes annotées
 * `@RequirePermission(resource, action)`. Suppose que `JwtAuthGuard` a déjà
 * peuplé `request.user` — doit donc être enregistré après lui.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  // esbuild/tsx n'émet pas `design:paramtypes` : @Inject() explicite requis.
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtAccessPayload }>();
    const user = request.user;
    if (!user) return false;

    const allowed = await this.prisma.hasPermission(user.roles, required.resource, required.action);
    if (!allowed) {
      throw new ForbiddenException(
        `Permission manquante : ${required.action} sur ${required.resource}`,
      );
    }
    return true;
  }
}
