import { Module } from "@nestjs/common";

import { PaymentsModule } from "../payments/payments.module";
import { StockModule } from "../stock/stock.module";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";

@Module({
  imports: [StockModule, PaymentsModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
