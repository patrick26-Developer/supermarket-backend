import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { SalesService } from "./sales.service";

@Controller("sales")
export class SalesController {
  constructor(@Inject(SalesService) private readonly sales: SalesService) {}

  @RequirePermission("SALES", "READ")
  @Get()
  findAll(@Query("storeId") storeId?: string, @Query("sessionId") sessionId?: string) {
    return this.sales.findAll(storeId, sessionId);
  }

  @RequirePermission("SALES", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sales.findOne(id);
  }

  @RequirePermission("SALES", "CREATE")
  @Post()
  create(@Body(new ValidateBodyPipe(CreateSaleDto)) dto: CreateSaleDto, @CurrentUser() user: JwtAccessPayload) {
    return this.sales.create(dto, user.sub);
  }
}
