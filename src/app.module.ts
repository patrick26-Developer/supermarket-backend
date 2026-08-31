import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "./auth/guards/permissions.guard";
import { CashModule } from "./cash/cash.module";
import { CatalogModule } from "./catalog/catalog.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SalesModule } from "./sales/sales.module";
import { StockModule } from "./stock/stock.module";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    StockModule,
    CashModule,
    SalesModule,
  ],
  controllers: [
    AppController,
    UsersController
  ],
  providers: [
    UsersService,
    // Ordre d'enregistrement = ordre d'exécution : JwtAuthGuard peuple
    // request.user avant que PermissionsGuard ne s'appuie dessus.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
