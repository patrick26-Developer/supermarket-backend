export const AUDIT_ACTION_VALUES = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "CANCEL",
  "REFUND",
  "OPEN_SESSION",
  "CLOSE_SESSION",
  "STOCK_ADJUSTMENT",
  "PAYMENT",
  "OTHER",
] as const;
export type AuditActionValue = (typeof AUDIT_ACTION_VALUES)[number];
