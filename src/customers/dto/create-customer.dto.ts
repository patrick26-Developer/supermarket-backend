import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { CUSTOMER_TYPE_VALUES, type CustomerTypeValue } from "../types/customer-enums";

export class CreateCustomerDto {
  @IsUUID()
  storeId!: string;

  @IsOptional()
  @IsIn(CUSTOMER_TYPE_VALUES)
  type?: CustomerTypeValue;

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
}
