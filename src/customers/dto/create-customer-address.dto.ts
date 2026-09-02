import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateCustomerAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsString()
  @MaxLength(160)
  recipient!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsString()
  @MaxLength(300)
  address!: string;

  @IsString()
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
