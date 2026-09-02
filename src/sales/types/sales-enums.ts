export const PAYMENT_METHOD_VALUES = [
  "CASH",
  "MTN_MOMO",
  "AIRTEL_MONEY",
  "CARD",
  "BANK_TRANSFER",
  "OTHER",
] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHOD_VALUES)[number];

export const FULFILLMENT_TYPE_VALUES = ["IN_STORE", "PICKUP", "DELIVERY"] as const;
export type FulfillmentTypeValue = (typeof FULFILLMENT_TYPE_VALUES)[number];
