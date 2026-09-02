import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { SUPPLIER_STATUS_VALUES, type SupplierStatusValue } from "../types/supplier-enums";

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxNumber?: string;

  @IsOptional()
  @IsIn(SUPPLIER_STATUS_VALUES)
  status?: SupplierStatusValue;
}
