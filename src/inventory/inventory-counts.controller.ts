import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { CreateInventoryCountDto } from "./dto/create-inventory-count.dto";
import { InventoryCountsService } from "./inventory-counts.service";

@Controller("inventory-counts")
export class InventoryCountsController {
  constructor(@Inject(InventoryCountsService) private readonly counts: InventoryCountsService) {}

  @RequirePermission("INVENTORIES", "READ")
  @Get()
  findAll(@Query("storeId") storeId?: string) {
    return this.counts.findAll(storeId);
  }

  @RequirePermission("INVENTORIES", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.counts.findOne(id);
  }

  @RequirePermission("INVENTORIES", "CREATE")
  @Post()
  create(
    @Body(new ValidateBodyPipe(CreateInventoryCountDto)) dto: CreateInventoryCountDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.counts.create(dto, user.sub);
  }

  @RequirePermission("INVENTORIES", "APPROVE")
  @Post(":id/approve")
  approve(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.counts.approve(id, user.sub);
  }

  @RequirePermission("INVENTORIES", "UPDATE")
  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.counts.cancel(id);
  }
}
