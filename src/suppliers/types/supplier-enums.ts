// CustomerStatus du contrat, réutilisé tel quel pour Supplier.status.
export const SUPPLIER_STATUS_VALUES = ["ACTIVE", "INACTIVE", "BLOCKED", "ARCHIVED"] as const;
export type SupplierStatusValue = (typeof SUPPLIER_STATUS_VALUES)[number];
