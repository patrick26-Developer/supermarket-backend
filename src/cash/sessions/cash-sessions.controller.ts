import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import type { JwtAccessPayload } from "../../auth/types/jwt-payload.type";
import { ValidateBodyPipe } from "../../common/pipes/validate-body.pipe";
import { CashSessionsService } from "./cash-sessions.service";
import { CloseSessionDto } from "./dto/close-session.dto";
import { OpenSessionDto } from "./dto/open-session.dto";
import { RecordCashMovementDto } from "./dto/record-cash-movement.dto";

@Controller("cash-sessions")
export class CashSessionsController {
  constructor(@Inject(CashSessionsService) private readonly sessions: CashSessionsService) {}

  @RequirePermission("CASH_SESSIONS", "READ")
  @Get()
  findAll(@Query("status") status?: string, @Query("cashRegisterId") cashRegisterId?: string) {
    return this.sessions.findAll(status, cashRegisterId);
  }

  @RequirePermission("CASH_SESSIONS", "READ")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sessions.findOne(id);
  }

  @RequirePermission("CASH_SESSIONS", "OPEN")
  @Post("open")
  open(@Body(new ValidateBodyPipe(OpenSessionDto)) dto: OpenSessionDto, @CurrentUser() user: JwtAccessPayload) {
    return this.sessions.open(dto, user.sub);
  }

  @RequirePermission("CASH_SESSIONS", "CLOSE")
  @Post(":id/close")
  close(@Param("id") id: string, @Body(new ValidateBodyPipe(CloseSessionDto)) dto: CloseSessionDto) {
    return this.sessions.close(id, dto);
  }

  @RequirePermission("CASH_SESSIONS", "CREATE")
  @Post(":id/movements")
  recordMovement(
    @Param("id") id: string,
    @Body(new ValidateBodyPipe(RecordCashMovementDto)) dto: RecordCashMovementDto,
  ) {
    return this.sessions.recordMovement(id, dto);
  }
}
