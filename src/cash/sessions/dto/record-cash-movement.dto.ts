import { IsIn, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

import { MANUAL_CASH_MOVEMENT_TYPE_VALUES, type ManualCashMovementTypeValue } from "../../types/cash-enums";

export class RecordCashMovementDto {
  @IsIn(MANUAL_CASH_MOVEMENT_TYPE_VALUES)
  type!: ManualCashMovementTypeValue;

  /** Magnitude positive, sauf CASH_CORRECTION où c'est un delta signé. */
  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
