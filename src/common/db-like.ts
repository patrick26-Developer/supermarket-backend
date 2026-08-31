import { db } from "../prisma/db";

/**
 * Sous-ensemble structurel de `db` (ou du `tx` fourni par
 * `db.transaction(async (tx) => ...)`) — les deux exposent la même surface
 * `.orm`. Permet à un service (ex. StockService) d'accepter soit `db`
 * directement (transaction autonome), soit le `tx` d'un appelant (pour
 * participer à SA transaction — ex. SalesService qui doit décrémenter le
 * stock et créer la vente de façon atomique).
 */
export type DbLike = Pick<typeof db, "orm">;
