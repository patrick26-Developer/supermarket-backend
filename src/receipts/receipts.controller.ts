import { Controller, Get, Inject, Param } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { ReceiptsService } from "./receipts.service";

@Controller("receipts")
export class ReceiptsController {
  constructor(@Inject(ReceiptsService) private readonly receipts: ReceiptsService) {}

  // Route statique déclarée avant ":id" pour ne pas être capturée par elle.
  @RequirePermission("RECEIPTS", "READ")
  @Get("by-order/:orderId")
  findByOrder(@Param("orderId") orderId: string) {
    return this.receipts.findByOrder(orderId);
  }

  @RequirePermission("RECEIPTS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.receipts.findOne(id);
  }
}
