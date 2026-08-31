import type { FieldOutputTypes } from "../../prisma/contract.d.ts";

/**
 * Dérivés directement du contrat (`contract.prisma` → `contract.d.ts`) plutôt
 * que redéclarés à la main : ils restent synchronisés automatiquement si les
 * enums `PermissionResource` / `PermissionAction` / `RoleCode` évoluent.
 */
export type PermissionResource = FieldOutputTypes["public"]["Permission"]["resource"];
export type PermissionAction = FieldOutputTypes["public"]["Permission"]["action"];
export type RoleCode = FieldOutputTypes["public"]["Role"]["code"];
