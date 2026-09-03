import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "./auth/guards/permissions.guard";
import { CashModule } from "./cash/cash.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CustomersModule } from "./customers/customers.module";
import { DeliveryModule } from "./delivery/delivery.module";
import { InventoryModule } from "./inventory/inventory.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PurchasingModule } from "./purchasing/purchasing.module";
import { ReceiptsModule } from "./receipts/receipts.module";
import { ReportsModule } from "./reports/reports.module";
import { SalesModule } from "./sales/sales.module";
import { StockModule } from "./stock/stock.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { UploadsModule } from "./uploads/uploads.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    CatalogModule,
    StockModule,
    CashModule,
    SalesModule,
    ReceiptsModule,
    UsersModule,
    SuppliersModule,
    PurchasingModule,
    InventoryModule,
    CustomersModule,
    DeliveryModule,
    ReportsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [
    // Ordre d'enregistrement = ordre d'exécution : JwtAuthGuard peuple
    // request.user avant que PermissionsGuard ne s'appuie dessus.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
