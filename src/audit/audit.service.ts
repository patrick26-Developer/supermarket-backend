import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { PrismaService } from "../prisma.service";
import type { AuditActionValue } from "./types/audit-enums";

export interface AuditLogEntry {
  userId?: string | null;
  storeId?: string | null;
  action: AuditActionValue;
  resource: string;
  resourceId?: string | null;
  description?: string | null;
  metadata?: string | null;
}

export interface AuditLogFilters {
  userId?: string;
  storeId?: string;
  action?: AuditActionValue;
  resource?: string;
  limit?: number;
}

/**
 * Instrumentation ciblée, pas un intercepteur générique sur toutes les
 * routes : appelée explicitement aux points sensibles (login, approbation
 * d'achat, ajustement de stock appliqué, ouverture/fermeture de caisse...).
 * Un intercepteur capturant automatiquement chaque requête viendra plus
 * tard si le besoin se confirme (voir docs/ROADMAP.md).
 *
 * `log()` est appelé APRÈS qu'une transaction ait réussi (jamais depuis
 * l'intérieur), pour que le journal reflète ce qui s'est réellement passé —
 * pas ce qu'une transaction a tenté puis annulé.
 */
@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.db.orm.public.AuditLog.create({
        id: randomUUID(),
        userId: entry.userId ?? null,
        storeId: entry.storeId ?? null,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        description: entry.description ?? null,
        ipAddress: null,
        userAgent: null,
        metadata: entry.metadata ?? null,
      });
    } catch (error) {
      // Un problème de journalisation ne doit jamais faire échouer l'opération métier.
      console.error("AuditService.log a échoué :", error);
    }
  }

  findAll(filters: AuditLogFilters) {
    let query = this.prisma.db.orm.public.AuditLog.orderBy((a) => a.createdAt.desc()).limit(
      Math.min(filters.limit ?? 100, 500),
    );
    if (filters.userId) query = query.where({ userId: filters.userId });
    if (filters.storeId) query = query.where({ storeId: filters.storeId });
    if (filters.action) query = query.where({ action: filters.action });
    if (filters.resource) query = query.where({ resource: filters.resource });
    return query.all();
  }
}
