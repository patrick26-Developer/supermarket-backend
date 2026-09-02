import { Module } from "@nestjs/common";

import { StockModule } from "../stock/stock.module";
import { InventoryCountsController } from "./inventory-counts.controller";
import { InventoryCountsService } from "./inventory-counts.service";
import { StockAdjustmentsController } from "./stock-adjustments.controller";
import { StockAdjustmentsService } from "./stock-adjustments.service";

@Module({
  imports: [StockModule],
  controllers: [StockAdjustmentsController, InventoryCountsController],
  providers: [StockAdjustmentsService, InventoryCountsService],
})
export class InventoryModule {}
