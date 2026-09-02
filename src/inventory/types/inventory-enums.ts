export const STOCK_ADJUSTMENT_STATUS_VALUES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "APPLIED",
  "CANCELLED",
] as const;
export type StockAdjustmentStatusValue = (typeof STOCK_ADJUSTMENT_STATUS_VALUES)[number];

export const INVENTORY_COUNT_STATUS_VALUES = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "APPROVED",
  "CANCELLED",
] as const;
export type InventoryCountStatusValue = (typeof INVENTORY_COUNT_STATUS_VALUES)[number];
