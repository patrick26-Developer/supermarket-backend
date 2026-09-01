import { IsIn } from "class-validator";

import { ROLE_CODE_VALUES, type RoleCodeValue } from "../types/user-enums";

export class AssignRoleDto {
  @IsIn(ROLE_CODE_VALUES)
  roleCode!: RoleCodeValue;
}
