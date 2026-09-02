import { IsUUID } from "class-validator";

export class AssignDeliveryDto {
  @IsUUID()
  agentId!: string;
}
