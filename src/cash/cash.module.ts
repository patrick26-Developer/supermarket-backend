import { Module } from "@nestjs/common";

import { CashRegistersController } from "./registers/cash-registers.controller";
import { CashRegistersService } from "./registers/cash-registers.service";
import { CashSessionsController } from "./sessions/cash-sessions.controller";
import { CashSessionsService } from "./sessions/cash-sessions.service";

@Module({
  controllers: [CashRegistersController, CashSessionsController],
  providers: [CashRegistersService, CashSessionsService],
  exports: [CashSessionsService],
})
export class CashModule {}
