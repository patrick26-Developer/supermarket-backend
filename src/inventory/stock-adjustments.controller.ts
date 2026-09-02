import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { CreateStockAdjustmentDto } from "./dto/create-stock-adjustment.dto";
import { StockAdjustmentsService } from "./stock-adjustments.service";

@Controller("stock-adjustments")
export class StockAdjustmentsController {
  constructor(@Inject(StockAdjustmentsService) private readonly adjustments: StockAdjustmentsService) {}

  @RequirePermission("STOCK", "READ")
  @Get()
  findAll(@Query("storeId") storeId?: string) {
    return this.adjustments.findAll(storeId);
  }

  @RequirePermission("STOCK", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.adjustments.findOne(id);
  }

  @RequirePermission("STOCK", "ADJUST")
  @Post()
  create(
    @Body(new ValidateBodyPipe(CreateStockAdjustmentDto)) dto: CreateStockAdjustmentDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.adjustments.create(dto, user.sub);
  }

  @RequirePermission("STOCK", "ADJUST")
  @Post(":id/apply")
  apply(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.adjustments.apply(id, user.sub);
  }

  @RequirePermission("STOCK", "ADJUST")
  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.adjustments.cancel(id);
  }
}
