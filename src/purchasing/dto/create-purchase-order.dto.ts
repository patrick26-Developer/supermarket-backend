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

export class PurchaseOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  supplierId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];

  /** Date attendue de livraison, en epoch ms (évite l'ambiguïté d'un ISO string sans offset). */
  @IsOptional()
  @IsNumber()
  expectedAtEpochMs?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
