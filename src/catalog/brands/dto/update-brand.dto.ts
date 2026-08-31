import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
