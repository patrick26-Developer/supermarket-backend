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

  /**
   * Ensemble complet des permissions (resource, action) accordées à au
   * moins un des rôles fournis — utilisé côté client pour n'afficher que
   * les onglets/actions auxquels l'utilisateur a réellement droit, plutôt
   * que de tout montrer et laisser le backend renvoyer des 403.
   */
  async getEffectivePermissions(
    roleCodes: RoleCode[],
  ): Promise<{ resource: PermissionResource; action: PermissionAction }[]> {
    if (roleCodes.length === 0) return [];

    const roles = await db.orm.public.Role
      .where((r) => r.code.in(roleCodes))
      .select("id")
      .all();
    if (roles.length === 0) return [];
    const roleIds = roles.map((r) => r.id);

    const grants = await db.orm.public.RolePermission
      .where((rp) => rp.roleId.in(roleIds))
      .include("permission", (p) => p.select("resource", "action"))
      .all();

    const seen = new Set<string>();
    const result: { resource: PermissionResource; action: PermissionAction }[] = [];
    for (const grant of grants) {
      const key = `${grant.permission.resource}:${grant.permission.action}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ resource: grant.permission.resource, action: grant.permission.action });
    }
    return result;
  }
}
