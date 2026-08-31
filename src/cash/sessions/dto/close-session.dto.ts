import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CloseSessionDto {
  @IsNumber()
  actualAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
