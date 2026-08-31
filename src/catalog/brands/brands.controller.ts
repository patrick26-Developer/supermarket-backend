import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put } from "@nestjs/common";

import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../../common/pipes/validate-body.pipe";
import { BrandsService } from "./brands.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Controller("brands")
export class BrandsController {
  constructor(@Inject(BrandsService) private readonly brands: BrandsService) {}

  @RequirePermission("BRANDS", "READ")
  @Get()
  findAll() {
    return this.brands.findAll();
  }

  @RequirePermission("BRANDS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.brands.findOne(id);
  }

  @RequirePermission("BRANDS", "CREATE")
  @Post()
  create(@Body(new ValidateBodyPipe(CreateBrandDto)) dto: CreateBrandDto) {
    return this.brands.create(dto);
  }

  @RequirePermission("BRANDS", "UPDATE")
  @Put(":id")
  update(@Param("id") id: string, @Body(new ValidateBodyPipe(UpdateBrandDto)) dto: UpdateBrandDto) {
    return this.brands.update(id, dto);
  }

  @RequirePermission("BRANDS", "DELETE")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async remove(@Param("id") id: string): Promise<void> {
    await this.brands.remove(id);
  }
}
