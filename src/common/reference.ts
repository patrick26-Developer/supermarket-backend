import { randomBytes } from "node:crypto";

/**
 * Référence lisible et raisonnablement unique (ex. "SALE-20260831-A1B2C3").
 * Pas de garantie d'unicité stricte sous forte concurrence — la contrainte
 * `@unique` en base est le filet de sécurité pour le cas limite (collision
 * improbable sur 6 hex chars par jour).
 */
export function generateReference(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}
