import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { STOCK_MOVEMENT_TYPE_VALUES, type StockMovementTypeValue } from "../types/stock-enums";

export class RecordMovementDto {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  productId!: string;

  @IsIn(STOCK_MOVEMENT_TYPE_VALUES)
  type!: StockMovementTypeValue;

  /**
   * Magnitude positive pour tous les types sauf INVENTORY_CORRECTION, où
   * cette valeur EST le delta signé (positif ou négatif). Validé plus
   * précisément dans StockService (dépend du type).
   */
  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  referenceType?: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsNotEmpty()
  notes?: string;
}
