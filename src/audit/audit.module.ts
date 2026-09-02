import { Global, Module } from "@nestjs/common";

import { AuditLogsController } from "./audit-logs.controller";
import { AuditService } from "./audit.service";

/** @Global() : AuditService injectable partout sans import explicite du module (comme PrismaModule). */
@Global()
@Module({
  controllers: [AuditLogsController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
