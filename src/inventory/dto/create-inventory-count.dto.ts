import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, ValidateNested } from "class-validator";

export class InventoryCountItemDto {
  @IsUUID()
  productId!: string;

  /** Quantité physiquement comptée. `expectedQty` est snapshotée depuis le stock courant côté serveur. */
  @IsNumber()
  @Min(0)
  countedQty!: number;
}

export class CreateInventoryCountDto {
  @IsUUID()
  storeId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InventoryCountItemDto)
  items!: InventoryCountItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
