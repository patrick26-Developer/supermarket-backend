import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { CreateGoodsReceiptDto } from "./dto/create-goods-receipt.dto";
import { GoodsReceiptsService } from "./goods-receipts.service";

@Controller("goods-receipts")
export class GoodsReceiptsController {
  constructor(@Inject(GoodsReceiptsService) private readonly receipts: GoodsReceiptsService) {}

  @RequirePermission("GOODS_RECEIPTS", "READ")
  @Get()
  findAll(@Query("storeId") storeId?: string, @Query("purchaseOrderId") purchaseOrderId?: string) {
    return this.receipts.findAll(storeId, purchaseOrderId);
  }

  @RequirePermission("GOODS_RECEIPTS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.receipts.findOne(id);
  }

  @RequirePermission("GOODS_RECEIPTS", "CREATE")
  @Post()
  create(@Body(new ValidateBodyPipe(CreateGoodsReceiptDto)) dto: CreateGoodsReceiptDto) {
    return this.receipts.create(dto);
  }
}
