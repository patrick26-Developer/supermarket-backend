import { Module } from "@nestjs/common";

import { StockModule } from "../stock/stock.module";
import { GoodsReceiptsController } from "./goods-receipts.controller";
import { GoodsReceiptsService } from "./goods-receipts.service";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Module({
  imports: [StockModule],
  controllers: [PurchaseOrdersController, GoodsReceiptsController],
  providers: [PurchaseOrdersService, GoodsReceiptsService],
})
export class PurchasingModule {}
