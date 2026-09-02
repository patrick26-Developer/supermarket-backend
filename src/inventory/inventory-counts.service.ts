import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";

import { AuditService } from "../audit/audit.service";
import { numeric } from "../common/numeric";
import { generateReference } from "../common/reference";
import { PrismaService } from "../prisma.service";
import { StockService } from "../stock/stock.service";
import type { CreateInventoryCountDto, InventoryCountItemDto } from "./dto/create-inventory-count.dto";

@Injectable()
export class InventoryCountsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StockService) private readonly stock: StockService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  findAll(storeId?: string) {
    let query = this.prisma.db.orm.public.InventoryCount.orderBy((c) => c.createdAt.desc());
    if (storeId) query = query.where({ storeId });
    return query.all();
  }

  async findOne(id: string) {
    const count = await this.prisma.db.orm.public.InventoryCount.where({ id })
      .include("items", (i) => i.select("id", "productId", "expectedQty", "countedQty", "difference"))
      .first();
    if (!count) throw new NotFoundException("Inventaire introuvable");
    return count;
  }

  async create(dto: CreateInventoryCountDto, createdById: string) {
    const store = await this.prisma.db.orm.public.Store.where({ id: dto.storeId }).first();
    if (!store) throw new NotFoundException("Magasin introuvable");

    const lines: Array<{ item: InventoryCountItemDto; expectedQty: number; difference: number }> = [];
    for (const item of dto.items) {
      const product = await this.prisma.db.orm.public.Product.where({ id: item.productId }).first();
      if (!product) throw new NotFoundException(`Produit introuvable : ${item.productId}`);

      const currentStock = await this.prisma.db.orm.public.Stock.where({ storeId: dto.storeId })
        .where({ productId: item.productId })
        .first();
      const expectedQty = currentStock ? Number(currentStock.quantity) : 0;
      lines.push({ item, expectedQty, difference: item.countedQty - expectedQty });
    }

    const countId = randomUUID();
    return this.prisma.db.transaction(async (tx) => {
      const count = await tx.orm.public.InventoryCount.create({
        id: countId,
        storeId: dto.storeId,
        createdById,
        approvedById: null,
        reference: generateReference("INV"),
        status: "COMPLETED",
        startedAt: Temporal.Now.instant(),
        completedAt: Temporal.Now.instant(),
        approvedAt: null,
        notes: dto.notes ?? null,
      });

      for (const line of lines) {
        await tx.orm.public.InventoryCountItem.create({
          id: randomUUID(),
          inventoryCountId: countId,
          productId: line.item.productId,
          expectedQty: numeric<14, 3>(line.expectedQty),
          countedQty: numeric<14, 3>(line.item.countedQty),
          difference: numeric<14, 3>(line.difference),
        });
      }

      return count;
    });
  }

  /**
   * COMPLETED → APPROVED : applique les écarts au stock réel (une
   * `StockMovement` de type `INVENTORY_CORRECTION` par ligne non nulle),
   * dans une seule transaction.
   */
  async approve(id: string, userId: string) {
    const count = await this.findOne(id);
    if (count.status !== "COMPLETED") {
      throw new BadRequestException(
        `Cet inventaire doit être complété avant approbation (statut actuel : ${count.status})`,
      );
    }

    await this.prisma.db.transaction(async (tx) => {
      for (const item of count.items) {
        const difference = Number(item.difference);
        if (difference === 0) continue;

        await this.stock.recordMovement(
          {
            storeId: count.storeId,
            productId: item.productId,
            type: "INVENTORY_CORRECTION",
            quantity: difference,
            referenceType: "inventory_count",
            referenceId: id,
          },
          tx,
        );
      }

      await tx.orm.public.InventoryCount.where({ id }).update({
        status: "APPROVED",
        approvedById: userId,
        approvedAt: Temporal.Now.instant(),
      });
    });

    await this.audit.log({
      userId,
      storeId: count.storeId,
      action: "APPROVE",
      resource: "INVENTORIES",
      resourceId: id,
      description: `Inventaire ${count.reference} approuvé`,
    });

    return this.findOne(id);
  }

  async cancel(id: string) {
    const count = await this.findOne(id);
    if (count.status === "APPROVED") {
      throw new BadRequestException("Un inventaire déjà approuvé ne peut plus être annulé");
    }
    await this.prisma.db.orm.public.InventoryCount.where({ id }).update({ status: "CANCELLED" });
    return this.findOne(id);
  }
}
