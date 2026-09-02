import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class StockAdjustmentItemDto {
  @IsUUID()
  productId!: string;

  /** Quantité voulue/comptée après ajustement — pas un delta. */
  @IsNumber()
  @Min(0)
  newQuantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class CreateStockAdjustmentDto {
  @IsUUID()
  storeId!: string;

  @IsString()
  @MaxLength(300)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockAdjustmentItemDto)
  items!: StockAdjustmentItemDto[];
}
