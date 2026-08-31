import type { Numeric } from "@prisma/orm-postgres/target/codec-types";

/**
 * Convertit un `number` JS en valeur acceptée par une colonne `Numeric<P, S>`
 * du contrat (les champs Decimal/Numeric sont des chaînes brandées côté
 * mutation ORM — voir prisma-8 skill § queries-postgres, "Numeric... is a
 * BrandedString"). Les DTOs restent en `number` (plus simple pour un client
 * JSON) ; cette conversion se fait à la frontière service → ORM.
 */
export function numeric<P extends number, S extends number | undefined = undefined>(
  value: number,
): Numeric<P, S> {
  return value.toString() as Numeric<P, S>;
}
