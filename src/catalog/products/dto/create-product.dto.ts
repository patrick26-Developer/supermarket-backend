import { IsIn, IsNumber, IsOptional, IsString, IsUrl, IsUUID, Min, MaxLength } from "class-validator";

import {
  PRODUCT_STATUS_VALUES,
  PRODUCT_TYPE_VALUES,
  UNIT_TYPE_VALUES,
  type ProductStatusValue,
  type ProductTypeValue,
  type UnitTypeValue,
} from "../../types/catalog-enums";

export class CreateProductDto {
  @IsString()
  @MaxLength(64)
  sku!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(200)
  slug!: string;

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

  // Numeric/Decimal du contrat : le codec accepte number | string en entrée.
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @IsNumber()
  @Min(0)
  taxRate!: number;

  @IsNumber()
  @Min(0)
  reorderLevel!: number;

  @IsNumber()
  @Min(0)
  minimumStock!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumStock?: number;

  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;
}
