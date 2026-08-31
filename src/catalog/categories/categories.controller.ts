import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put } from "@nestjs/common";

import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { ValidateBodyPipe } from "../../common/pipes/validate-body.pipe";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("categories")
export class CategoriesController {
  constructor(@Inject(CategoriesService) private readonly categories: CategoriesService) {}

  @RequirePermission("CATEGORIES", "READ")
  @Get()
  findAll() {
    return this.categories.findAll();
  }

  @RequirePermission("CATEGORIES", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.categories.findOne(id);
  }

  @RequirePermission("CATEGORIES", "CREATE")
  @Post()
  create(@Body(new ValidateBodyPipe(CreateCategoryDto)) dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @RequirePermission("CATEGORIES", "UPDATE")
  @Put(":id")
  update(@Param("id") id: string, @Body(new ValidateBodyPipe(UpdateCategoryDto)) dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @RequirePermission("CATEGORIES", "DELETE")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async remove(@Param("id") id: string): Promise<void> {
    await this.categories.remove(id);
  }
}
