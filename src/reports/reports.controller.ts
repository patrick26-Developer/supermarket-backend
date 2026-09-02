import { Controller, Get, Inject, Query } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @RequirePermission("REPORTS", "READ")
  @Get("sales-summary")
  salesSummary(
    @Query("storeId") storeId?: string,
    @Query("fromEpochMs") fromEpochMs?: string,
    @Query("toEpochMs") toEpochMs?: string,
  ) {
    return this.reports.salesSummary({
      storeId,
      fromEpochMs: fromEpochMs ? Number(fromEpochMs) : undefined,
      toEpochMs: toEpochMs ? Number(toEpochMs) : undefined,
    });
  }

  @RequirePermission("REPORTS", "READ")
  @Get("stock-value")
  stockValue(@Query("storeId") storeId?: string) {
    return this.reports.stockValue(storeId);
  }

  @RequirePermission("REPORTS", "READ")
  @Get("top-products")
  topProducts(
    @Query("storeId") storeId?: string,
    @Query("fromEpochMs") fromEpochMs?: string,
    @Query("toEpochMs") toEpochMs?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reports.topProducts({
      storeId,
      fromEpochMs: fromEpochMs ? Number(fromEpochMs) : undefined,
      toEpochMs: toEpochMs ? Number(toEpochMs) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
