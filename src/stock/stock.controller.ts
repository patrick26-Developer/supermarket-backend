import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { RecordMovementDto } from "./dto/record-movement.dto";
import { StockService } from "./stock.service";

@Controller("stock")
export class StockController {
  constructor(@Inject(StockService) private readonly stock: StockService) {}

  @RequirePermission("STOCK", "READ")
  @Get()
  findAll(@Query("storeId") storeId?: string, @Query("productId") productId?: string) {
    return this.stock.findAll(storeId, productId);
  }

  @RequirePermission("STOCK", "READ")
  @Get("movements")
  listMovements(
    @Query("storeId") storeId?: string,
    @Query("productId") productId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.stock.listMovements(storeId, productId, limit ? Number(limit) : undefined);
  }

  @RequirePermission("STOCK", "ADJUST")
  @Post("movements")
  recordMovement(@Body(new ValidateBodyPipe(RecordMovementDto)) dto: RecordMovementDto) {
    return this.stock.recordMovement(dto);
  }

  @RequirePermission("STOCK", "READ")
  @Get(":storeId/:productId")
  findOne(@Param("storeId") storeId: string, @Param("productId") productId: string) {
    return this.stock.findOne(storeId, productId);
  }
}
