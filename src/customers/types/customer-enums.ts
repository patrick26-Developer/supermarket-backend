export const CUSTOMER_TYPE_VALUES = ["INDIVIDUAL", "BUSINESS"] as const;
export type CustomerTypeValue = (typeof CUSTOMER_TYPE_VALUES)[number];

export const CUSTOMER_STATUS_VALUES = ["ACTIVE", "INACTIVE", "BLOCKED", "ARCHIVED"] as const;
export type CustomerStatusValue = (typeof CUSTOMER_STATUS_VALUES)[number];
