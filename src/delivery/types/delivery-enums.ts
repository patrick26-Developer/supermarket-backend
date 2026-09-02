export const DELIVERY_STATUS_VALUES = [
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
] as const;
export type DeliveryStatusValue = (typeof DELIVERY_STATUS_VALUES)[number];

export const DELIVERY_FAILURE_REASON_VALUES = [
  "CUSTOMER_UNAVAILABLE",
  "WRONG_ADDRESS",
  "CUSTOMER_REFUSED",
  "VEHICLE_PROBLEM",
  "WEATHER",
  "OTHER",
] as const;
export type DeliveryFailureReasonValue = (typeof DELIVERY_FAILURE_REASON_VALUES)[number];
