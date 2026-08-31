export const STOCK_MOVEMENT_TYPE_VALUES = [
  "PURCHASE_RECEIPT",
  "SALE",
  "SALE_RETURN",
  "PURCHASE_RETURN",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "INVENTORY_CORRECTION",
  "DAMAGED",
  "EXPIRED",
  "LOST",
] as const;
export type StockMovementTypeValue = (typeof STOCK_MOVEMENT_TYPE_VALUES)[number];

/**
 * Sens du mouvement pour chaque type :
 * - 1  : entrée, la quantité fournie (magnitude positive) s'ajoute au stock
 * - -1 : sortie, la quantité fournie (magnitude positive) se retranche
 * - "signed" : seul INVENTORY_CORRECTION — la quantité fournie EST le delta,
 *   positif ou négatif (recalage d'inventaire dans les deux sens)
 */
export const STOCK_MOVEMENT_DIRECTION: Record<StockMovementTypeValue, 1 | -1 | "signed"> = {
  PURCHASE_RECEIPT: 1,
  SALE: -1,
  SALE_RETURN: 1,
  PURCHASE_RETURN: -1,
  ADJUSTMENT_IN: 1,
  ADJUSTMENT_OUT: -1,
  TRANSFER_IN: 1,
  TRANSFER_OUT: -1,
  INVENTORY_CORRECTION: "signed",
  DAMAGED: -1,
  EXPIRED: -1,
  LOST: -1,
};
