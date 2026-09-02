import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";

import { AuditService } from "../audit/audit.service";
import { numeric } from "../common/numeric";
import { generateReference } from "../common/reference";
import { PrismaService } from "../prisma.service";
import { StockService } from "../stock/stock.service";
import type { CreateStockAdjustmentDto, StockAdjustmentItemDto } from "./dto/create-stock-adjustment.dto";

@Injectable()
export class StockAdjustmentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StockService) private readonly stock: StockService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  findAll(storeId?: string) {
    let query = this.prisma.db.orm.public.StockAdjustment.orderBy((a) => a.createdAt.desc());
    if (storeId) query = query.where({ storeId });
    return query.all();
  }

  async findOne(id: string) {
    const adjustment = await this.prisma.db.orm.public.StockAdjustment.where({ id })
      .include("items", (i) =>
        i.select("id", "productId", "previousQuantity", "newQuantity", "difference", "reason"),
      )
      .first();
    if (!adjustment) throw new NotFoundException("Ajustement de stock introuvable");
    return adjustment;
  }

  async create(dto: CreateStockAdjustmentDto, createdById: string) {
    const store = await this.prisma.db.orm.public.Store.where({ id: dto.storeId }).first();
    if (!store) throw new NotFoundException("Magasin introuvable");

    const lines: Array<{
      item: StockAdjustmentItemDto;
      previousQuantity: number;
      difference: number;
    }> = [];
    for (const item of dto.items) {
      const product = await this.prisma.db.orm.public.Product.where({ id: item.productId }).first();
      if (!product) throw new NotFoundException(`Produit introuvable : ${item.productId}`);

      const currentStock = await this.prisma.db.orm.public.Stock.where({ storeId: dto.storeId })
        .where({ productId: item.productId })
        .first();
      const previousQuantity = currentStock ? Number(currentStock.quantity) : 0;
      lines.push({ item, previousQuantity, difference: item.newQuantity - previousQuantity });
    }

    const adjustmentId = randomUUID();
    return this.prisma.db.transaction(async (tx) => {
      const adjustment = await tx.orm.public.StockAdjustment.create({
        id: adjustmentId,
        storeId: dto.storeId,
        createdById,
        approvedById: null,
        reference: generateReference("ADJ"),
        status: "DRAFT",
        reason: dto.reason,
        notes: dto.notes ?? null,
        approvedAt: null,
        appliedAt: null,
      });

      for (const line of lines) {
        await tx.orm.public.StockAdjustmentItem.create({
          id: randomUUID(),
          stockAdjustmentId: adjustmentId,
          productId: line.item.productId,
          previousQuantity: numeric<14, 3>(line.previousQuantity),
          newQuantity: numeric<14, 3>(line.item.newQuantity),
          difference: numeric<14, 3>(line.difference),
          reason: line.item.reason ?? null,
        });
      }

      return adjustment;
    });
  }

  /**
   * DRAFT → APPLIED en une étape (simplification V1 — pas de palier SUBMITTED/
   * APPROVED séparé). Applique réellement la correction de stock, ligne par
   * ligne, dans la même transaction.
   */
  async apply(id: string, userId: string) {
    const adjustment = await this.findOne(id);
    if (adjustment.status !== "DRAFT") {
      throw new BadRequestException(
        `Cet ajustement a déjà été traité (statut actuel : ${adjustment.status})`,
      );
    }

    await this.prisma.db.transaction(async (tx) => {
      for (const item of adjustment.items) {
        const difference = Number(item.difference);
        if (difference === 0) continue;

        await this.stock.recordMovement(
          {
            storeId: adjustment.storeId,
            productId: item.productId,
            type: difference > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
            quantity: Math.abs(difference),
            referenceType: "stock_adjustment",
            referenceId: id,
            notes: item.reason ?? adjustment.reason,
          },
          tx,
        );
      }

      await tx.orm.public.StockAdjustment.where({ id }).update({
        status: "APPLIED",
        approvedById: userId,
        approvedAt: Temporal.Now.instant(),
        appliedAt: Temporal.Now.instant(),
      });
    });

    await this.audit.log({
      userId,
      storeId: adjustment.storeId,
      action: "STOCK_ADJUSTMENT",
      resource: "STOCK",
      resourceId: id,
      description: `Ajustement ${adjustment.reference} appliqué (${adjustment.reason})`,
    });

    return this.findOne(id);
  }

  async cancel(id: string) {
    const adjustment = await this.findOne(id);
    if (adjustment.status !== "DRAFT") {
      throw new BadRequestException(
        `Seul un ajustement en brouillon peut être annulé (statut actuel : ${adjustment.status})`,
      );
    }
    await this.prisma.db.orm.public.StockAdjustment.where({ id }).update({ status: "CANCELLED" });
    return this.findOne(id);
  }
}
