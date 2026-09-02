import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { DeliveriesService } from "./deliveries.service";
import { AssignDeliveryDto } from "./dto/assign-delivery.dto";
import { UpdateDeliveryStatusDto } from "./dto/update-delivery-status.dto";
import type { DeliveryStatusValue } from "./types/delivery-enums";

@Controller("deliveries")
export class DeliveriesController {
  constructor(@Inject(DeliveriesService) private readonly deliveries: DeliveriesService) {}

  @RequirePermission("DELIVERIES", "READ")
  @Get()
  findAll(
    @Query("storeId") storeId?: string,
    @Query("status") status?: DeliveryStatusValue,
    @Query("agentId") agentId?: string,
  ) {
    return this.deliveries.findAll(storeId, status, agentId);
  }

  @RequirePermission("DELIVERIES", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.deliveries.findOne(id);
  }

  @RequirePermission("DELIVERIES", "UPDATE")
  @Post(":id/assign")
  assign(@Param("id") id: string, @Body(new ValidateBodyPipe(AssignDeliveryDto)) dto: AssignDeliveryDto) {
    return this.deliveries.assign(id, dto);
  }

  @RequirePermission("DELIVERIES", "UPDATE")
  @Post(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body(new ValidateBodyPipe(UpdateDeliveryStatusDto)) dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveries.updateStatus(id, dto);
  }
}
