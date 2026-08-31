import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";

import { numeric } from "../common/numeric";
import { generateReference } from "../common/reference";
import { PrismaService } from "../prisma.service";
import { StockService } from "../stock/stock.service";
import type { CreateSaleDto, SaleItemDto } from "./dto/create-sale.dto";

interface SaleLine {
  product: { id: string; name: string; sku: string; taxRate: string };
  item: SaleItemDto;
  lineSubtotal: number;
  lineDiscount: number;
  lineTax: number;
  lineTotal: number;
}

@Injectable()
export class SalesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StockService) private readonly stock: StockService,
  ) {}

  findAll(storeId?: string, sessionId?: string) {
    let query = this.prisma.db.orm.public.Sale.orderBy((s) => s.soldAt.desc());
    if (storeId) query = query.where({ storeId });
    if (sessionId) query = query.where({ sessionId });
    return query.all();
  }

  async findOne(id: string) {
    const sale = await this.prisma.db.orm.public.Sale.where({ id })
      .include("items", (i) => i)
      .include("payments", (p) => p)
      .first();
    if (!sale) throw new NotFoundException("Vente introuvable");
    return sale;
  }

  async create(dto: CreateSaleDto, cashierId: string) {
    const session = await this.prisma.db.orm.public.CashierSession.where({
      id: dto.sessionId,
    }).first();
    if (!session) throw new NotFoundException("Session de caisse introuvable");
    if (session.status !== "OPEN") {
      throw new BadRequestException("La session de caisse n'est pas ouverte");
    }

    const store = await this.prisma.db.orm.public.Store.where({ id: dto.storeId }).first();
    if (!store) throw new NotFoundException("Magasin introuvable");

    if (dto.customerId) {
      const customer = await this.prisma.db.orm.public.Customer.where({ id: dto.customerId }).first();
      if (!customer) throw new NotFoundException("Client introuvable");
    }

    const { lines, subtotal, discountTotal, taxTotal, totalAmount } = await this.buildLines(dto.items);

    const paymentsSum = dto.payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentsSum - totalAmount) > 0.01) {
      throw new BadRequestException(
        `Le total des paiements (${paymentsSum.toFixed(2)}) ne correspond pas au montant de la vente (${totalAmount.toFixed(2)})`,
      );
    }

    return this.prisma.db.transaction(async (tx) => {
      const orderId = randomUUID();
      const now = Temporal.Now.instant();

      await tx.orm.public.Order.create({
        id: orderId,
        storeId: dto.storeId,
        customerId: dto.customerId ?? null,
        createdById: cashierId,
        reference: generateReference("ORD"),
        channel: "POS",
        fulfillment: "IN_STORE",
        status: "COMPLETED",
        subtotal: numeric<14, 2>(subtotal),
        discountAmount: numeric<14, 2>(discountTotal),
        taxAmount: numeric<14, 2>(taxTotal),
        deliveryFee: numeric<14, 2>(0),
        totalAmount: numeric<14, 2>(totalAmount),
        notes: dto.notes ?? null,
        confirmedAt: now,
        completedAt: now,
        cancelledAt: null,
      });

      for (const line of lines) {
        await tx.orm.public.OrderItem.create({
          id: randomUUID(),
          orderId,
          productId: line.product.id,
          productName: line.product.name,
          sku: line.product.sku,
          quantity: numeric<14, 3>(line.item.quantity),
          unitPrice: numeric<14, 2>(line.item.unitPrice),
          discountAmount: numeric<14, 2>(line.lineDiscount),
          taxRate: numeric<5, 2>(Number(line.product.taxRate)),
          subtotal: numeric<14, 2>(line.lineSubtotal - line.lineDiscount),
          totalAmount: numeric<14, 2>(line.lineTotal),
          status: "FULFILLED",
        });
      }

      const saleId = randomUUID();
      const sale = await tx.orm.public.Sale.create({
        id: saleId,
        orderId,
        storeId: dto.storeId,
        sessionId: dto.sessionId,
        reference: generateReference("SALE"),
        subtotal: numeric<14, 2>(subtotal),
        discountAmount: numeric<14, 2>(discountTotal),
        taxAmount: numeric<14, 2>(taxTotal),
        totalAmount: numeric<14, 2>(totalAmount),
      });

      for (const line of lines) {
        await tx.orm.public.SaleItem.create({
          id: randomUUID(),
          saleId,
          productId: line.product.id,
          productName: line.product.name,
          sku: line.product.sku,
          quantity: numeric<14, 3>(line.item.quantity),
          unitPrice: numeric<14, 2>(line.item.unitPrice),
          discountAmount: numeric<14, 2>(line.lineDiscount),
          taxAmount: numeric<14, 2>(line.lineTax),
          totalAmount: numeric<14, 2>(line.lineTotal),
        });

        // Décrément de stock DANS la même transaction que la vente (via le
        // `tx` de StockService — voir common/db-like.ts). Si quoi que ce
        // soit échoue plus loin, tout est annulé, y compris ce mouvement.
        await this.stock.recordMovement(
          {
            storeId: dto.storeId,
            productId: line.product.id,
            type: "SALE",
            quantity: line.item.quantity,
            referenceType: "sale",
            referenceId: saleId,
          },
          tx,
        );
      }

      for (const payment of dto.payments) {
        await tx.orm.public.Payment.create({
          id: randomUUID(),
          orderId,
          saleId,
          sessionId: dto.sessionId,
          reference: generateReference("PAY"),
          method: payment.method,
          direction: "IN",
          status: "CONFIRMED",
          amount: numeric<14, 2>(payment.amount),
          currency: "XAF",
          transactionRef: payment.transactionRef ?? null,
          providerRef: null,
          paidAt: now,
          failureReason: null,
          metadata: null,
        });

        if (payment.method === "CASH") {
          await tx.orm.public.CashMovement.create({
            id: randomUUID(),
            sessionId: dto.sessionId,
            type: "CASH_SALE",
            amount: numeric<14, 2>(payment.amount),
            reason: null,
            referenceType: "sale",
            referenceId: saleId,
          });
        }
      }

      return sale;
    });
  }

  private async buildLines(items: SaleItemDto[]) {
    const lines: SaleLine[] = [];
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    for (const item of items) {
      const product = await this.prisma.db.orm.public.Product.where({ id: item.productId }).first();
      if (!product) throw new NotFoundException(`Produit introuvable : ${item.productId}`);

      const lineSubtotal = item.unitPrice * item.quantity;
      const lineDiscount = item.discountAmount ?? 0;
      if (lineDiscount > lineSubtotal) {
        throw new BadRequestException("La remise ne peut pas dépasser le sous-total de la ligne");
      }
      const taxableBase = lineSubtotal - lineDiscount;
      const taxRate = Number(product.taxRate);
      const lineTax = taxableBase * (taxRate / 100);
      const lineTotal = taxableBase + lineTax;

      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      taxTotal += lineTax;

      lines.push({ product, item, lineSubtotal, lineDiscount, lineTax, lineTotal });
    }

    return { lines, subtotal, discountTotal, taxTotal, totalAmount: subtotal - discountTotal + taxTotal };
  }
}
