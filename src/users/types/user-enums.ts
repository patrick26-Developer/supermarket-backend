export const USER_STATUS_VALUES = [
  "ACTIVE",
  "INVITED",
  "SUSPENDED",
  "BLOCKED",
  "INACTIVE",
  "ARCHIVED",
] as const;
export type UserStatusValue = (typeof USER_STATUS_VALUES)[number];

export const ROLE_CODE_VALUES = [
  "SUPER_ADMIN",
  "ADMIN",
  "STORE_MANAGER",
  "CASHIER",
  "STOCK_MANAGER",
  "PURCHASING_MANAGER",
  "SALES_MANAGER",
  "ACCOUNTANT",
  "DELIVERY_AGENT",
  "AUDITOR",
  "CUSTOMER",
] as const;
export type RoleCodeValue = (typeof ROLE_CODE_VALUES)[number];
