import { Controller, Get, Inject, Query } from "@nestjs/common";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { AuditService } from "./audit.service";
import type { AuditActionValue } from "./types/audit-enums";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @RequirePermission("AUDIT_LOGS", "READ")
  @Get()
  findAll(
    @Query("userId") userId?: string,
    @Query("storeId") storeId?: string,
    @Query("action") action?: AuditActionValue,
    @Query("resource") resource?: string,
    @Query("limit") limit?: string,
  ) {
    return this.audit.findAll({
      userId,
      storeId,
      action,
      resource,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
