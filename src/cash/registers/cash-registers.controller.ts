import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../../common/pipes/validate-body.pipe";
import { CashRegistersService } from "./cash-registers.service";
import { CreateCashRegisterDto } from "./dto/create-cash-register.dto";

@Controller("cash-registers")
export class CashRegistersController {
  constructor(@Inject(CashRegistersService) private readonly registers: CashRegistersService) {}

  @RequirePermission("CASH_REGISTERS", "READ")
  @Get()
  findAll(@Query("storeId") storeId?: string) {
    return this.registers.findAll(storeId);
  }

  @RequirePermission("CASH_REGISTERS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.registers.findOne(id);
  }

  @RequirePermission("CASH_REGISTERS", "CREATE")
  @Post()
  create(@Body(new ValidateBodyPipe(CreateCashRegisterDto)) dto: CreateCashRegisterDto) {
    return this.registers.create(dto);
  }
}
