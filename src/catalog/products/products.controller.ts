import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";

import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../../common/pipes/validate-body.pipe";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly products: ProductsService) {}

  @RequirePermission("PRODUCTS", "READ")
  @Get()
  findAll(@Query("search") search?: string) {
    return this.products.findAll(search);
  }

  // Route statique déclarée avant ":id" pour ne pas être capturée par elle.
  @RequirePermission("PRODUCTS", "READ")
  @Get("code/:code")
  findByCode(@Param("code") code: string) {
    return this.products.findByCode(code);
  }

  @RequirePermission("PRODUCTS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.products.findOne(id);
  }

  @RequirePermission("PRODUCTS", "CREATE")
  @Post()
  create(@Body(new ValidateBodyPipe(CreateProductDto)) dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @RequirePermission("PRODUCTS", "UPDATE")
  @Put(":id")
  update(@Param("id") id: string, @Body(new ValidateBodyPipe(UpdateProductDto)) dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @RequirePermission("PRODUCTS", "DELETE")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async remove(@Param("id") id: string): Promise<void> {
    await this.products.remove(id);
  }
}
