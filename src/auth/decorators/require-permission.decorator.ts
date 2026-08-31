import { SetMetadata } from "@nestjs/common";

import type { PermissionAction, PermissionResource } from "../types/permission.types";

export const PERMISSION_KEY = "requiredPermission";

export interface RequiredPermission {
  resource: PermissionResource;
  action: PermissionAction;
}

/**
 * Exige que l'utilisateur authentifié porte la permission (resource, action)
 * via au moins un de ses rôles (`Role` → `RolePermission` → `Permission`).
 * Évalué par `PermissionsGuard`. Sans ce décorateur, une route protégée par
 * `JwtAuthGuard` reste accessible à tout utilisateur authentifié.
 */
export const RequirePermission = (resource: PermissionResource, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { resource, action } satisfies RequiredPermission);
