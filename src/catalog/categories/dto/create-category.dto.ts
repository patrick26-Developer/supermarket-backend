import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { PRODUCT_STATUS_VALUES, type ProductStatusValue } from "../../types/catalog-enums";

export class CreateCategoryDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @MaxLength(160)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsIn(PRODUCT_STATUS_VALUES)
  status?: ProductStatusValue;
}
