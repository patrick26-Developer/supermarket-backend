import { IsNumber, IsUUID, Min } from "class-validator";

export class OpenSessionDto {
  @IsUUID()
  cashRegisterId!: string;

  @IsNumber()
  @Min(0)
  openingAmount!: number;
}
