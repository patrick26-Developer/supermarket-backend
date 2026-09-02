import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Query } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { CreateCustomerAddressDto } from "./dto/create-customer-address.dto";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomersService } from "./customers.service";

@Controller("customers")
export class CustomersController {
  constructor(@Inject(CustomersService) private readonly customers: CustomersService) {}

  @RequirePermission("CUSTOMERS", "READ")
  @Get()
  findAll(@Query("storeId") storeId?: string) {
    return this.customers.findAll(storeId);
  }

  @RequirePermission("CUSTOMERS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.customers.findOne(id);
  }

  @RequirePermission("CUSTOMERS", "CREATE")
  @Post()
  create(@Body(new ValidateBodyPipe(CreateCustomerDto)) dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @RequirePermission("CUSTOMERS", "UPDATE")
  @Put(":id")
  update(@Param("id") id: string, @Body(new ValidateBodyPipe(UpdateCustomerDto)) dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }

  @RequirePermission("CUSTOMERS", "UPDATE")
  @Post(":id/addresses")
  addAddress(
    @Param("id") id: string,
    @Body(new ValidateBodyPipe(CreateCustomerAddressDto)) dto: CreateCustomerAddressDto,
  ) {
    return this.customers.addAddress(id, dto);
  }

  @RequirePermission("CUSTOMERS", "UPDATE")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id/addresses/:addressId")
  async removeAddress(@Param("id") id: string, @Param("addressId") addressId: string): Promise<void> {
    await this.customers.removeAddress(id, addressId);
  }
}
