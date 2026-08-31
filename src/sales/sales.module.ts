import { Module } from "@nestjs/common";

import { StockModule } from "../stock/stock.module";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";

@Module({
  imports: [StockModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
