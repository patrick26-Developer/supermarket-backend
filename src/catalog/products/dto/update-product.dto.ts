import { IsIn, IsNumber, IsOptional, IsString, IsUrl, IsUUID, Min, MaxLength } from "class-validator";

import {
  PRODUCT_STATUS_VALUES,
  PRODUCT_TYPE_VALUES,
  UNIT_TYPE_VALUES,
  type ProductStatusValue,
  type ProductTypeValue,
  type UnitTypeValue,
} from "../../types/catalog-enums";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsIn(PRODUCT_TYPE_VALUES)
  productType?: ProductTypeValue;

  @IsOptional()
  @IsIn(UNIT_TYPE_VALUES)
  unitType?: UnitTypeValue;

  @IsOptional()
  @IsIn(PRODUCT_STATUS_VALUES)
  status?: ProductStatusValue;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumStock?: number;

  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;
}
