import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { CUSTOMER_STATUS_VALUES, type CustomerStatusValue } from "../types/customer-enums";

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(CUSTOMER_STATUS_VALUES)
  status?: CustomerStatusValue;
}
