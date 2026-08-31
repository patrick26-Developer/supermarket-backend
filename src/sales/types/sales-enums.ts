export const PAYMENT_METHOD_VALUES = [
  "CASH",
  "MTN_MOMO",
  "AIRTEL_MONEY",
  "CARD",
  "BANK_TRANSFER",
  "OTHER",
] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHOD_VALUES)[number];
