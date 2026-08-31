import { IsString, IsUUID, MaxLength } from "class-validator";

export class CreateCashRegisterDto {
  @IsUUID()
  storeId!: string;

  @IsString()
  @MaxLength(32)
  code!: string;

  @IsString()
  @MaxLength(120)
  name!: string;
}
