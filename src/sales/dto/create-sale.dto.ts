import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
  ValidateNested,
} from "class-validator";

import { PAYMENT_METHOD_VALUES, type PaymentMethodValue } from "../types/sales-enums";

export class SaleItemDto {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}

export class SalePaymentDto {
  @IsIn(PAYMENT_METHOD_VALUES)
  method!: PaymentMethodValue;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  transactionRef?: string;

  /**
   * Test uniquement : force un échec simulé pour ce paiement (providers
   * mobile money non-CASH — voir src/payments/). Sans effet sur CASH.
   */
  @IsOptional()
  @IsBoolean()
  forceFailure?: boolean;
}

export class CreateSaleDto {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments!: SalePaymentDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
