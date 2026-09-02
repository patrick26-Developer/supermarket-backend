export const PURCHASE_ORDER_STATUS_VALUES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
  "CLOSED",
] as const;
export type PurchaseOrderStatusValue = (typeof PURCHASE_ORDER_STATUS_VALUES)[number];

export const GOODS_RECEIPT_STATUS_VALUES = ["DRAFT", "RECEIVED", "CANCELLED"] as const;
export type GoodsReceiptStatusValue = (typeof GOODS_RECEIPT_STATUS_VALUES)[number];
