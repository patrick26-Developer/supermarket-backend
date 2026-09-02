import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";

import { AuditService } from "../audit/audit.service";
import { numeric } from "../common/numeric";
import { generateReference } from "../common/reference";
import { PrismaService } from "../prisma.service";
import type { CreatePurchaseOrderDto, PurchaseOrderItemDto } from "./dto/create-purchase-order.dto";
import type { PurchaseOrderStatusValue } from "./types/purchasing-enums";

interface PoLine {
  product: { id: string };
  item: PurchaseOrderItemDto;
  lineSubtotal: number;
  taxRate: number;
  lineTax: number;
}

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  findAll(storeId?: string, status?: PurchaseOrderStatusValue) {
    let query = this.prisma.db.orm.public.PurchaseOrder.orderBy((po) => po.createdAt.desc());
    if (storeId) query = query.where({ storeId });
    if (status) query = query.where({ status });
    return query.all();
  }

  async findOne(id: string) {
    const order = await this.prisma.db.orm.public.PurchaseOrder.where({ id })
      .include("items", (i) => i)
      .first();
    if (!order) throw new NotFoundException("Bon de commande introuvable");
    return order;
  }

  async create(dto: CreatePurchaseOrderDto, createdById: string) {
    const store = await this.prisma.db.orm.public.Store.where({ id: dto.storeId }).first();
    if (!store) throw new NotFoundException("Magasin introuvable");
    const supplier = await this.prisma.db.orm.public.Supplier.where({ id: dto.supplierId }).first();
    if (!supplier) throw new NotFoundException("Fournisseur introuvable");

    const { lines, subtotal, taxTotal, totalAmount } = await this.buildLines(dto.items);

    const orderId = randomUUID();
    return this.prisma.db.transaction(async (tx) => {
      const order = await tx.orm.public.PurchaseOrder.create({
        id: orderId,
        storeId: dto.storeId,
        supplierId: dto.supplierId,
        createdById,
        approvedById: null,
        reference: generateReference("PO"),
        status: "DRAFT",
        orderedAt: null,
        approvedAt: null,
        expectedAt:
          dto.expectedAtEpochMs !== undefined
            ? Temporal.Instant.fromEpochMilliseconds(dto.expectedAtEpochMs)
            : null,
        notes: dto.notes ?? null,
        subtotal: numeric<14, 2>(subtotal),
        taxAmount: numeric<14, 2>(taxTotal),
        totalAmount: numeric<14, 2>(totalAmount),
      });

      for (const line of lines) {
        await tx.orm.public.PurchaseOrderItem.create({
          id: randomUUID(),
          purchaseOrderId: orderId,
          productId: line.product.id,
          quantity: numeric<14, 3>(line.item.quantity),
          unitCost: numeric<14, 2>(line.item.unitCost),
          taxRate: numeric<5, 2>(line.taxRate),
          subtotal: numeric<14, 2>(line.lineSubtotal),
        });
      }

      return order;
    });
  }

  /** DRAFT → SUBMITTED : la commande est envoyée au fournisseur. */
  async submit(id: string) {
    const order = await this.assertStatus(id, ["DRAFT"], "être en brouillon");
    await this.prisma.db.orm.public.PurchaseOrder.where({ id }).update({
      status: "SUBMITTED",
      orderedAt: Temporal.Now.instant(),
    });
    return this.findOne(order.id);
  }

  /** SUBMITTED → APPROVED : seule une commande approuvée peut être réceptionnée. */
  async approve(id: string, approvedById: string) {
    const order = await this.assertStatus(id, ["SUBMITTED"], "être soumise");
    await this.prisma.db.orm.public.PurchaseOrder.where({ id }).update({
      status: "APPROVED",
      approvedById,
      approvedAt: Temporal.Now.instant(),
    });

    await this.audit.log({
      userId: approvedById,
      storeId: order.storeId,
      action: "APPROVE",
      resource: "PURCHASE_ORDERS",
      resourceId: id,
      description: `Bon de commande ${order.reference} approuvé`,
    });

    return this.findOne(id);
  }

  async cancel(id: string) {
    const order = await this.assertStatus(
      id,
      ["DRAFT", "SUBMITTED", "APPROVED"],
      "ne pas déjà être annulée/reçue/clôturée",
    );
    await this.prisma.db.orm.public.PurchaseOrder.where({ id }).update({ status: "CANCELLED" });
    return this.findOne(order.id);
  }

  private async assertStatus(
    id: string,
    allowed: PurchaseOrderStatusValue[],
    expectation: string,
  ) {
    const order = await this.prisma.db.orm.public.PurchaseOrder.where({ id }).first();
    if (!order) throw new NotFoundException("Bon de commande introuvable");
    if (!allowed.includes(order.status)) {
      throw new BadRequestException(
        `Le bon de commande doit ${expectation} (statut actuel : ${order.status})`,
      );
    }
    return order;
  }

  private async buildLines(items: PurchaseOrderItemDto[]) {
    const lines: PoLine[] = [];
    let subtotal = 0;
    let taxTotal = 0;

    for (const item of items) {
      const product = await this.prisma.db.orm.public.Product.where({ id: item.productId }).first();
      if (!product) throw new NotFoundException(`Produit introuvable : ${item.productId}`);

      const lineSubtotal = item.unitCost * item.quantity;
      const taxRate = item.taxRate ?? 0;
      const lineTax = lineSubtotal * (taxRate / 100);

      subtotal += lineSubtotal;
      taxTotal += lineTax;

      lines.push({ product, item, lineSubtotal, taxRate, lineTax });
    }

    return { lines, subtotal, taxTotal, totalAmount: subtotal + taxTotal };
  }
}
