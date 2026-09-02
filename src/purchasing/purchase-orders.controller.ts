import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { PurchaseOrdersService } from "./purchase-orders.service";
import type { PurchaseOrderStatusValue } from "./types/purchasing-enums";

@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(@Inject(PurchaseOrdersService) private readonly orders: PurchaseOrdersService) {}

  @RequirePermission("PURCHASE_ORDERS", "READ")
  @Get()
  findAll(@Query("storeId") storeId?: string, @Query("status") status?: PurchaseOrderStatusValue) {
    return this.orders.findAll(storeId, status);
  }

  @RequirePermission("PURCHASE_ORDERS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orders.findOne(id);
  }

  @RequirePermission("PURCHASE_ORDERS", "CREATE")
  @Post()
  create(
    @Body(new ValidateBodyPipe(CreatePurchaseOrderDto)) dto: CreatePurchaseOrderDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.orders.create(dto, user.sub);
  }

  @RequirePermission("PURCHASE_ORDERS", "UPDATE")
  @Post(":id/submit")
  submit(@Param("id") id: string) {
    return this.orders.submit(id);
  }

  @RequirePermission("PURCHASE_ORDERS", "APPROVE")
  @Post(":id/approve")
  approve(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.orders.approve(id, user.sub);
  }

  @RequirePermission("PURCHASE_ORDERS", "CANCEL")
  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.orders.cancel(id);
  }
}
