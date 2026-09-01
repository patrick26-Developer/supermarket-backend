import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { USER_STATUS_VALUES, type UserStatusValue } from "../types/user-enums";

export class UpdateUserDto {
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
  @MaxLength(160)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsIn(USER_STATUS_VALUES)
  status?: UserStatusValue;
}
