import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { PRODUCT_STATUS_VALUES, type ProductStatusValue } from "../../types/catalog-enums";

// Champs dupliqués depuis CreateCategoryDto plutôt que PartialType() :
// PartialType (@nestjs/mapped-types) clone les validateurs via réflexion de
// type, indisponible avec esbuild (voir docs/ROADMAP.md § Gotcha toolchain).
export class UpdateCategoryDto {
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

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsIn(PRODUCT_STATUS_VALUES)
  status?: ProductStatusValue;
}
