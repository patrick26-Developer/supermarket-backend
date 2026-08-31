/**
 * Seed idempotent : organisation/magasin par défaut, catalogue de
 * permissions, rôles système avec leurs habilitations de départ, et compte
 * administrateur initial.
 *
 * Exécution : `npm run seed` (nécessite DATABASE_URL et SEED_ADMIN_* dans .env).
 *
 * Le mapping rôle → permissions ci-dessous est un point de départ raisonnable,
 * pas une politique métier figée : à affiner plus tard via une interface
 * d'administration (voir docs/ROADMAP.md, phase 2).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";

import { hash } from "bcryptjs";

import type { PermissionAction, PermissionResource, RoleCode } from "../auth/types/permission.types";
import { db } from "./db";

const RESOURCE_ACTIONS: Record<PermissionResource, PermissionAction[]> = {
  USERS: ["CREATE", "READ", "UPDATE", "DELETE"],
  ROLES: ["CREATE", "READ", "UPDATE", "DELETE"],
  PERMISSIONS: ["READ"],
  ORGANIZATIONS: ["CREATE", "READ", "UPDATE", "DELETE"],
  STORES: ["CREATE", "READ", "UPDATE", "DELETE"],
  PRODUCTS: ["CREATE", "READ", "UPDATE", "DELETE"],
  CATEGORIES: ["CREATE", "READ", "UPDATE", "DELETE"],
  BRANDS: ["CREATE", "READ", "UPDATE", "DELETE"],
  PRICES: ["CREATE", "READ", "UPDATE", "DELETE"],
  SUPPLIERS: ["CREATE", "READ", "UPDATE", "DELETE"],
  PURCHASE_ORDERS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "CANCEL"],
  GOODS_RECEIPTS: ["CREATE", "READ", "UPDATE", "DELETE", "CANCEL"],
  STOCK: ["READ", "ADJUST", "TRANSFER"],
  INVENTORIES: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
  CUSTOMERS: ["CREATE", "READ", "UPDATE", "DELETE"],
  ORDERS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "CANCEL"],
  SALES: ["CREATE", "READ", "UPDATE", "CANCEL", "REFUND"],
  CASH_REGISTERS: ["CREATE", "READ", "UPDATE", "DELETE"],
  CASH_SESSIONS: ["CREATE", "READ", "UPDATE", "OPEN", "CLOSE"],
  CASH_MOVEMENTS: ["CREATE", "READ"],
  PAYMENTS: ["CREATE", "READ", "UPDATE", "CANCEL", "REFUND"],
  RECEIPTS: ["READ", "PRINT"],
  INVOICES: ["READ", "PRINT"],
  DELIVERIES: ["CREATE", "READ", "UPDATE", "CANCEL"],
  REPORTS: ["READ", "EXPORT", "PRINT"],
  AUDIT_LOGS: ["READ"],
};

const ROLE_NAMES: Record<RoleCode, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  STORE_MANAGER: "Gérant de magasin",
  CASHIER: "Caissier",
  STOCK_MANAGER: "Gestionnaire de stock",
  PURCHASING_MANAGER: "Responsable achats",
  SALES_MANAGER: "Responsable ventes",
  ACCOUNTANT: "Comptable",
  DELIVERY_AGENT: "Livreur",
  AUDITOR: "Auditeur",
  CUSTOMER: "Client",
};

/** 'ALL' = toutes les permissions du catalogue. Sinon, liste explicite (resource, actions). */
const ROLE_GRANTS: Record<RoleCode, "ALL" | "ALL_READ" | Array<{ resource: PermissionResource; actions: PermissionAction[] }>> = {
  SUPER_ADMIN: "ALL",
  ADMIN: "ALL",
  AUDITOR: "ALL_READ",
  CUSTOMER: [],
  STORE_MANAGER: [
    { resource: "STORES", actions: ["READ", "UPDATE"] },
    { resource: "USERS", actions: ["READ"] },
    { resource: "PRODUCTS", actions: RESOURCE_ACTIONS.PRODUCTS },
    { resource: "CATEGORIES", actions: RESOURCE_ACTIONS.CATEGORIES },
    { resource: "BRANDS", actions: RESOURCE_ACTIONS.BRANDS },
    { resource: "PRICES", actions: RESOURCE_ACTIONS.PRICES },
    { resource: "STOCK", actions: RESOURCE_ACTIONS.STOCK },
    { resource: "INVENTORIES", actions: RESOURCE_ACTIONS.INVENTORIES },
    { resource: "SUPPLIERS", actions: RESOURCE_ACTIONS.SUPPLIERS },
    { resource: "PURCHASE_ORDERS", actions: RESOURCE_ACTIONS.PURCHASE_ORDERS },
    { resource: "GOODS_RECEIPTS", actions: RESOURCE_ACTIONS.GOODS_RECEIPTS },
    { resource: "CUSTOMERS", actions: RESOURCE_ACTIONS.CUSTOMERS },
    { resource: "ORDERS", actions: RESOURCE_ACTIONS.ORDERS },
    { resource: "SALES", actions: RESOURCE_ACTIONS.SALES },
    { resource: "CASH_REGISTERS", actions: RESOURCE_ACTIONS.CASH_REGISTERS },
    { resource: "CASH_SESSIONS", actions: RESOURCE_ACTIONS.CASH_SESSIONS },
    { resource: "CASH_MOVEMENTS", actions: RESOURCE_ACTIONS.CASH_MOVEMENTS },
    { resource: "PAYMENTS", actions: RESOURCE_ACTIONS.PAYMENTS },
    { resource: "RECEIPTS", actions: RESOURCE_ACTIONS.RECEIPTS },
    { resource: "INVOICES", actions: RESOURCE_ACTIONS.INVOICES },
    { resource: "DELIVERIES", actions: RESOURCE_ACTIONS.DELIVERIES },
    { resource: "REPORTS", actions: RESOURCE_ACTIONS.REPORTS },
  ],
  CASHIER: [
    { resource: "PRODUCTS", actions: ["READ"] },
    { resource: "PRICES", actions: ["READ"] },
    { resource: "CUSTOMERS", actions: ["CREATE", "READ", "UPDATE"] },
    { resource: "ORDERS", actions: ["CREATE", "READ", "UPDATE"] },
    { resource: "SALES", actions: ["CREATE", "READ"] },
    { resource: "PAYMENTS", actions: ["CREATE", "READ"] },
    { resource: "RECEIPTS", actions: ["READ", "PRINT"] },
    { resource: "CASH_SESSIONS", actions: ["CREATE", "READ", "OPEN", "CLOSE"] },
    { resource: "CASH_MOVEMENTS", actions: ["CREATE", "READ"] },
  ],
  STOCK_MANAGER: [
    { resource: "PRODUCTS", actions: ["READ", "UPDATE"] },
    { resource: "CATEGORIES", actions: ["READ"] },
    { resource: "BRANDS", actions: ["READ"] },
    { resource: "STOCK", actions: RESOURCE_ACTIONS.STOCK },
    { resource: "INVENTORIES", actions: RESOURCE_ACTIONS.INVENTORIES },
    { resource: "GOODS_RECEIPTS", actions: ["CREATE", "READ", "UPDATE"] },
  ],
  PURCHASING_MANAGER: [
    { resource: "SUPPLIERS", actions: RESOURCE_ACTIONS.SUPPLIERS },
    { resource: "PURCHASE_ORDERS", actions: RESOURCE_ACTIONS.PURCHASE_ORDERS },
    { resource: "GOODS_RECEIPTS", actions: RESOURCE_ACTIONS.GOODS_RECEIPTS },
    { resource: "PRODUCTS", actions: ["READ"] },
    { resource: "PRICES", actions: ["READ"] },
  ],
  SALES_MANAGER: [
    { resource: "ORDERS", actions: RESOURCE_ACTIONS.ORDERS },
    { resource: "SALES", actions: RESOURCE_ACTIONS.SALES },
    { resource: "CUSTOMERS", actions: RESOURCE_ACTIONS.CUSTOMERS },
    { resource: "PRICES", actions: ["READ", "UPDATE"] },
    { resource: "PRODUCTS", actions: ["READ"] },
    { resource: "REPORTS", actions: RESOURCE_ACTIONS.REPORTS },
  ],
  ACCOUNTANT: [
    { resource: "PAYMENTS", actions: RESOURCE_ACTIONS.PAYMENTS },
    { resource: "INVOICES", actions: RESOURCE_ACTIONS.INVOICES },
    { resource: "RECEIPTS", actions: RESOURCE_ACTIONS.RECEIPTS },
    { resource: "CASH_MOVEMENTS", actions: RESOURCE_ACTIONS.CASH_MOVEMENTS },
    { resource: "CASH_SESSIONS", actions: ["READ"] },
    { resource: "REPORTS", actions: RESOURCE_ACTIONS.REPORTS },
  ],
  DELIVERY_AGENT: [
    { resource: "DELIVERIES", actions: RESOURCE_ACTIONS.DELIVERIES },
    { resource: "ORDERS", actions: ["READ"] },
    { resource: "CUSTOMERS", actions: ["READ"] },
  ],
};

async function seedPermissions(): Promise<Map<string, string>> {
  const existing = await db.orm.public.Permission.select("id", "resource", "action").all();
  const byKey = new Map(existing.map((p) => [`${p.resource}:${p.action}`, p.id]));

  for (const [resource, actions] of Object.entries(RESOURCE_ACTIONS) as Array<
    [PermissionResource, PermissionAction[]]
  >) {
    for (const action of actions) {
      const key = `${resource}:${action}`;
      if (byKey.has(key)) continue;
      const created = await db.orm.public.Permission.create({
        id: randomUUID(),
        resource,
        action,
        name: `${action} ${resource}`,
        description: null,
      });
      byKey.set(key, created.id);
    }
  }
  console.log(`Permissions : ${byKey.size} au total.`);
  return byKey;
}

async function seedRoles(): Promise<Map<RoleCode, string>> {
  const codes = Object.keys(ROLE_NAMES) as RoleCode[];
  const existing = await db.orm.public.Role.where((r) => r.code.in(codes)).select("id", "code").all();
  const byCode = new Map<RoleCode, string>(existing.map((r) => [r.code, r.id]));

  for (const code of codes) {
    if (byCode.has(code)) continue;
    const created = await db.orm.public.Role.create({
      id: randomUUID(),
      code,
      name: ROLE_NAMES[code],
      description: null,
      isSystem: true,
    });
    byCode.set(code, created.id);
  }
  console.log(`Rôles : ${byCode.size} au total.`);
  return byCode;
}

async function seedRolePermissions(
  permissionIds: Map<string, string>,
  roleIds: Map<RoleCode, string>,
): Promise<void> {
  const allPermissionIds = [...permissionIds.values()];
  const readOnlyPermissionIds = [...permissionIds.entries()]
    .filter(([key]) => key.endsWith(":READ"))
    .map(([, id]) => id);

  const roleIdList = [...roleIds.values()];
  const existingGrants = await db.orm.public.RolePermission
    .where((rp) => rp.roleId.in(roleIdList))
    .select("roleId", "permissionId")
    .all();
  const grantedKeys = new Set(existingGrants.map((g) => `${g.roleId}:${g.permissionId}`));

  let created = 0;
  for (const [code, grant] of Object.entries(ROLE_GRANTS) as Array<
    [RoleCode, (typeof ROLE_GRANTS)[RoleCode]]
  >) {
    const roleId = roleIds.get(code);
    if (!roleId) continue;

    const targetPermissionIds =
      grant === "ALL"
        ? allPermissionIds
        : grant === "ALL_READ"
          ? readOnlyPermissionIds
          : grant.flatMap(({ resource, actions }) =>
              actions
                .map((action) => permissionIds.get(`${resource}:${action}`))
                .filter((id): id is string => id !== undefined),
            );

    for (const permissionId of targetPermissionIds) {
      const key = `${roleId}:${permissionId}`;
      if (grantedKeys.has(key)) continue;
      await db.orm.public.RolePermission.create({ roleId, permissionId });
      grantedKeys.add(key);
      created += 1;
    }
  }
  console.log(`Habilitations rôle→permission créées : ${created} (total : ${grantedKeys.size}).`);
}

async function seedOrganizationAndStore(): Promise<{ organizationId: string; storeId: string }> {
  let organization = await db.orm.public.Organization.where({ slug: "default" }).first();
  organization ??= await db.orm.public.Organization.create({
    id: randomUUID(),
    name: "Superette",
    legalName: null,
    slug: "default",
    phone: null,
    email: null,
    address: null,
    city: null,
    country: "CG",
    currency: "XAF",
    status: "ACTIVE",
  });

  let store = await db.orm.public.Store
    .where({ organizationId: organization.id })
    .where({ code: "MAIN" })
    .first();
  store ??= await db.orm.public.Store.create({
    id: randomUUID(),
    organizationId: organization.id,
    code: "MAIN",
    name: "Magasin principal",
    phone: null,
    email: null,
    address: null,
    city: null,
    status: "ACTIVE",
  });

  console.log(`Organisation "${organization.name}" / magasin "${store.name}" prêts.`);
  return { organizationId: organization.id, storeId: store.id };
}

async function seedAdminUser(roleIds: Map<RoleCode, string>): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const phone = process.env.SEED_ADMIN_PHONE;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD absents de .env — création du compte admin ignorée.",
    );
    return;
  }

  let admin = await db.orm.public.User.where({ email }).first();
  if (!admin) {
    const passwordHash = await hash(password, 12);
    admin = await db.orm.public.User.create({
      id: randomUUID(),
      email,
      phone: phone ?? null,
      passwordHash,
      firstName: "Admin",
      lastName: "Système",
      displayName: "Administrateur",
      status: "ACTIVE",
      lastLoginAt: null,
      passwordChangedAt: null,
    });
    console.log(`Utilisateur admin créé : ${email}`);
  } else {
    console.log(`Utilisateur admin déjà existant : ${email}`);
  }

  const superAdminRoleId = roleIds.get("SUPER_ADMIN");
  if (!superAdminRoleId) return;

  const existingAssignment = await db.orm.public.UserRole
    .where({ userId: admin.id })
    .where({ roleId: superAdminRoleId })
    .first();
  if (!existingAssignment) {
    await db.orm.public.UserRole.create({ userId: admin.id, roleId: superAdminRoleId });
    console.log("Rôle SUPER_ADMIN assigné à l'admin.");
  }
}

async function main() {
  await seedOrganizationAndStore();
  const permissionIds = await seedPermissions();
  const roleIds = await seedRoles();
  await seedRolePermissions(permissionIds, roleIds);
  await seedAdminUser(roleIds);
  console.log("Seed terminé.");
}

main()
  .catch((error: unknown) => {
    console.error("Échec du seed :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
