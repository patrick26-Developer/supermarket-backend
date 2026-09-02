import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";

import { numeric } from "../common/numeric";
import { generateReference } from "../common/reference";
import { PrismaService } from "../prisma.service";
import { StockService } from "../stock/stock.service";
import type { CreateGoodsReceiptDto, GoodsReceiptItemDto } from "./dto/create-goods-receipt.dto";

@Injectable()
export class GoodsReceiptsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StockService) private readonly stock: StockService,
  ) {}

  findAll(storeId?: string, purchaseOrderId?: string) {
    let query = this.prisma.db.orm.public.GoodsReceipt.orderBy((r) => r.createdAt.desc());
    if (storeId) query = query.where({ storeId });
    if (purchaseOrderId) query = query.where({ purchaseOrderId });
    return query.all();
  }

  async findOne(id: string) {
    const receipt = await this.prisma.db.orm.public.GoodsReceipt.where({ id })
      .include("items", (i) => i)
      .first();
    if (!receipt) throw new NotFoundException("Réception introuvable");
    return receipt;
  }

  async create(dto: CreateGoodsReceiptDto) {
    const store = await this.prisma.db.orm.public.Store.where({ id: dto.storeId }).first();
    if (!store) throw new NotFoundException("Magasin introuvable");

    if (dto.purchaseOrderId) {
      const order = await this.prisma.db.orm.public.PurchaseOrder.where({
        id: dto.purchaseOrderId,
      }).first();
      if (!order) throw new NotFoundException("Bon de commande introuvable");
      if (order.status !== "APPROVED") {
        throw new BadRequestException(
          `Le bon de commande doit être approuvé avant réception (statut actuel : ${order.status})`,
        );
      }
    }

    const lines: Array<{ product: { id: string }; item: GoodsReceiptItemDto; lineSubtotal: number }> = [];
    for (const item of dto.items) {
      const product = await this.prisma.db.orm.public.Product.where({ id: item.productId }).first();
      if (!product) throw new NotFoundException(`Produit introuvable : ${item.productId}`);
      lines.push({ product, item, lineSubtotal: item.unitCost * item.quantity });
    }

    const receiptId = randomUUID();
    const receipt = await this.prisma.db.transaction(async (tx) => {
      const created = await tx.orm.public.GoodsReceipt.create({
        id: receiptId,
        storeId: dto.storeId,
        purchaseOrderId: dto.purchaseOrderId ?? null,
        reference: generateReference("GR"),
        status: "RECEIVED",
        receivedAt: Temporal.Now.instant(),
        notes: dto.notes ?? null,
      });

      for (const line of lines) {
        await tx.orm.public.GoodsReceiptItem.create({
          id: randomUUID(),
          goodsReceiptId: receiptId,
          productId: line.product.id,
          quantity: numeric<14, 3>(line.item.quantity),
          unitCost: numeric<14, 2>(line.item.unitCost),
          subtotal: numeric<14, 2>(line.lineSubtotal),
        });

        // Entrée en stock DANS la même transaction (voir StockService.recordMovement / DbLike).
        await this.stock.recordMovement(
          {
            storeId: dto.storeId,
            productId: line.product.id,
            type: "PURCHASE_RECEIPT",
            quantity: line.item.quantity,
            unitCost: line.item.unitCost,
            referenceType: "goods_receipt",
            referenceId: receiptId,
          },
          tx,
        );
      }

      // Simplification V1 : une réception (même partielle) marque le bon de
      // commande RECEIVED — pas de suivi fin PARTIALLY_RECEIVED pour l'instant.
      if (dto.purchaseOrderId) {
        await tx.orm.public.PurchaseOrder.where({ id: dto.purchaseOrderId }).update({
          status: "RECEIVED",
        });
      }

      return created;
    });

    return receipt;
  }
}
