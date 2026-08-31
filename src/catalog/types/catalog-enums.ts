/**
 * Valeurs runtime + types dérivés pour les enums du catalogue
 * (contract.prisma). Un seul tableau source pour la validation
 * (`@IsIn(...)`) et pour le typage — évite la duplication silencieuse qui
 * dérive du contrat au fil du temps.
 */
export const PRODUCT_STATUS_VALUES = ["ACTIVE", "INACTIVE", "DISCONTINUED", "ARCHIVED"] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUS_VALUES)[number];

export const PRODUCT_TYPE_VALUES = ["STANDARD", "WEIGHTED", "SERVICE", "COMBO"] as const;
export type ProductTypeValue = (typeof PRODUCT_TYPE_VALUES)[number];

export const UNIT_TYPE_VALUES = [
  "PIECE",
  "KILOGRAM",
  "GRAM",
  "LITER",
  "MILLILITER",
  "METER",
  "PACK",
  "BOX",
  "BOTTLE",
  "CAN",
] as const;
export type UnitTypeValue = (typeof UNIT_TYPE_VALUES)[number];
