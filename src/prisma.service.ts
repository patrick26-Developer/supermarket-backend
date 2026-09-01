import { Injectable } from "@nestjs/common";
import { db } from "./prisma/db";
import type { PermissionAction, PermissionResource, RoleCode } from "./auth/types/permission.types";

@Injectable()
export class PrismaService {
  readonly db = db;

  /**
   * RBAC : est-ce qu'au moins un des rôles fournis porte la permission
   * (resource, action) demandée ? Résolu en base à chaque appel (et non
   * embarqué dans le JWT) pour qu'une révocation de permission sur un rôle
   * prenne effet immédiatement, sans attendre l'expiration du token.
   */
  async hasPermission(
    roleCodes: RoleCode[],
    resource: PermissionResource,
    action: PermissionAction,
  ): Promise<boolean> {
    if (roleCodes.length === 0) return false;

    const permission = await db.orm.public.Permission
      .where((p) => p.resource.eq(resource))
      .where((p) => p.action.eq(action))
      .first();
    if (!permission) return false;

    const roles = await db.orm.public.Role
      .where((r) => r.code.in(roleCodes))
      .select("id")
      .all();
    if (roles.length === 0) return false;
    const roleIds = roles.map((r) => r.id);

    const grant = await db.orm.public.RolePermission
      .where((rp) => rp.permissionId.eq(permission.id))
      .where((rp) => rp.roleId.in(roleIds))
      .first();
    return grant !== null;
  }
}
