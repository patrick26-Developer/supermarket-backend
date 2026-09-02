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

export class GoodsReceiptItemDto {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;
}

export class CreateGoodsReceiptDto {
  @IsUUID()
  storeId!: string;

  /** Facultatif : réception directe si absent, sinon rattachée à un achat approuvé. */
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items!: GoodsReceiptItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
