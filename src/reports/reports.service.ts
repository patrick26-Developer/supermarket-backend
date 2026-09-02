import { Inject, Injectable } from "@nestjs/common";
import { Temporal } from "temporal-polyfill";

import { PrismaService } from "../prisma.service";

export interface DateRangeFilter {
  storeId?: string;
  fromEpochMs?: number;
  toEpochMs?: number;
}

@Injectable()
export class ReportsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async salesSummary(filter: DateRangeFilter) {
    let query = this.prisma.db.orm.public.Sale.orderBy((s) => s.soldAt.desc());
    if (filter.storeId) query = query.where({ storeId: filter.storeId });
    if (filter.fromEpochMs !== undefined) {
      const from = Temporal.Instant.fromEpochMilliseconds(filter.fromEpochMs);
      query = query.where((s) => s.soldAt.gte(from));
    }
    if (filter.toEpochMs !== undefined) {
      const to = Temporal.Instant.fromEpochMilliseconds(filter.toEpochMs);
      query = query.where((s) => s.soldAt.lte(to));
    }
    const sales = await query.all();

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalTax = sales.reduce((sum, s) => sum + Number(s.taxAmount), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discountAmount), 0);
    const salesCount = sales.length;

    return {
      salesCount,
      totalRevenue,
      totalTax,
      totalDiscount,
      averageBasket: salesCount > 0 ? totalRevenue / salesCount : 0,
    };
  }

  /** Valorisation du stock au coût d'achat (Stock.quantity × Product.costPrice), agrégée en JS — adéquat à l'échelle d'une superette. */
  async stockValue(storeId?: string) {
    let query = this.prisma.db.orm.public.Stock.orderBy((s) => s.updatedAt.desc());
    if (storeId) query = query.where({ storeId });
    const stocks = await query.all();

    if (stocks.length === 0) return { totalValue: 0, items: [] };

    const productIds = [...new Set(stocks.map((s) => s.productId))];
    const products = await this.prisma.db.orm.public.Product.where((p) => p.id.in(productIds))
      .select("id", "sku", "name", "costPrice")
      .all();
    const productById = new Map(products.map((p) => [p.id, p]));

    let totalValue = 0;
    const items = stocks.map((stock) => {
      const product = productById.get(stock.productId);
      const quantity = Number(stock.quantity);
      const costPrice = product ? Number(product.costPrice) : 0;
      const value = quantity * costPrice;
      totalValue += value;
      return {
        productId: stock.productId,
        sku: product?.sku ?? null,
        name: product?.name ?? null,
        quantity,
        costPrice,
        value,
      };
    });

    return { totalValue, items };
  }

  async topProducts(filter: DateRangeFilter & { limit?: number }) {
    let saleQuery = this.prisma.db.orm.public.Sale.select("id");
    if (filter.storeId) saleQuery = saleQuery.where({ storeId: filter.storeId });
    if (filter.fromEpochMs !== undefined) {
      const from = Temporal.Instant.fromEpochMilliseconds(filter.fromEpochMs);
      saleQuery = saleQuery.where((s) => s.soldAt.gte(from));
    }
    if (filter.toEpochMs !== undefined) {
      const to = Temporal.Instant.fromEpochMilliseconds(filter.toEpochMs);
      saleQuery = saleQuery.where((s) => s.soldAt.lte(to));
    }
    const sales = await saleQuery.all();
    if (sales.length === 0) return [];

    const saleIds = sales.map((s) => s.id);
    const items = await this.prisma.db.orm.public.SaleItem.where((i) => i.saleId.in(saleIds)).all();

    const byProduct = new Map<
      string,
      { productId: string; name: string; sku: string; quantity: number; revenue: number }
    >();
    for (const item of items) {
      const existing = byProduct.get(item.productId) ?? {
        productId: item.productId,
        name: item.productName,
        sku: item.sku,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += Number(item.quantity);
      existing.revenue += Number(item.totalAmount);
      byProduct.set(item.productId, existing);
    }

    return [...byProduct.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, filter.limit ?? 10);
  }
}
