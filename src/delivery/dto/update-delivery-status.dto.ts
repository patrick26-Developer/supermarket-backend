import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { DELIVERY_FAILURE_REASON_VALUES, DELIVERY_STATUS_VALUES, type DeliveryFailureReasonValue, type DeliveryStatusValue } from "../types/delivery-enums";

export class UpdateDeliveryStatusDto {
  @IsIn(DELIVERY_STATUS_VALUES)
  status!: DeliveryStatusValue;

  /** Requis quand status = FAILED. */
  @IsOptional()
  @IsIn(DELIVERY_FAILURE_REASON_VALUES)
  failureReason?: DeliveryFailureReasonValue;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
