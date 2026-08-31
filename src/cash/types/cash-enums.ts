export const CASH_REGISTER_STATUS_VALUES = ["ACTIVE", "INACTIVE", "MAINTENANCE"] as const;
export type CashRegisterStatusValue = (typeof CASH_REGISTER_STATUS_VALUES)[number];

export const CASH_SESSION_STATUS_VALUES = ["OPEN", "CLOSED", "FORCE_CLOSED"] as const;
export type CashSessionStatusValue = (typeof CASH_SESSION_STATUS_VALUES)[number];

// CASH_SALE est posé automatiquement par SalesService — pas exposé en saisie manuelle.
export const MANUAL_CASH_MOVEMENT_TYPE_VALUES = [
  "CASH_IN",
  "CASH_OUT",
  "EXPENSE",
  "SAFE_DEPOSIT",
  "CASH_CORRECTION",
] as const;
export type ManualCashMovementTypeValue = (typeof MANUAL_CASH_MOVEMENT_TYPE_VALUES)[number];

/** Sens de chaque type de mouvement de caisse manuel (même principe que stock-enums.ts). */
export const CASH_MOVEMENT_DIRECTION: Record<ManualCashMovementTypeValue, 1 | -1 | "signed"> = {
  CASH_IN: 1,
  CASH_OUT: -1,
  EXPENSE: -1,
  SAFE_DEPOSIT: -1,
  CASH_CORRECTION: "signed",
};
