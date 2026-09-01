import { IsArray, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import { ROLE_CODE_VALUES, type RoleCodeValue } from "../types/user-enums";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MaxLength(120)
  firstName!: string;

  @IsString()
  @MaxLength(120)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  displayName?: string;

  /** Rôles assignés à la création (optionnel — un admin peut assigner plus tard). */
  @IsOptional()
  @IsArray()
  @IsIn(ROLE_CODE_VALUES, { each: true })
  roles?: RoleCodeValue[];
}
