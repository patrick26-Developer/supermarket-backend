import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { SuppliersService } from "./suppliers.service";

@Controller("suppliers")
export class SuppliersController {
  constructor(@Inject(SuppliersService) private readonly suppliers: SuppliersService) {}

  @RequirePermission("SUPPLIERS", "READ")
  @Get()
  findAll() {
    return this.suppliers.findAll();
  }

  @RequirePermission("SUPPLIERS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.suppliers.findOne(id);
  }

  @RequirePermission("SUPPLIERS", "CREATE")
  @Post()
  create(@Body(new ValidateBodyPipe(CreateSupplierDto)) dto: CreateSupplierDto) {
    return this.suppliers.create(dto);
  }

  @RequirePermission("SUPPLIERS", "UPDATE")
  @Put(":id")
  update(@Param("id") id: string, @Body(new ValidateBodyPipe(UpdateSupplierDto)) dto: UpdateSupplierDto) {
    return this.suppliers.update(id, dto);
  }

  @RequirePermission("SUPPLIERS", "DELETE")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async remove(@Param("id") id: string): Promise<void> {
    await this.suppliers.remove(id);
  }
}
