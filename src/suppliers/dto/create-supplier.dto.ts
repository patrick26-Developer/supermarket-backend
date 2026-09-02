import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSupplierDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(32)
  code!: string;

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
}
