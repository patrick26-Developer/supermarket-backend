import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";

import { AuditService } from "../../audit/audit.service";
import { numeric } from "../../common/numeric";
import { PrismaService } from "../../prisma.service";
import type { CashSessionStatusValue } from "../types/cash-enums";
import { CASH_MOVEMENT_DIRECTION } from "../types/cash-enums";
import type { CloseSessionDto } from "./dto/close-session.dto";
import type { OpenSessionDto } from "./dto/open-session.dto";
import type { RecordCashMovementDto } from "./dto/record-cash-movement.dto";

@Injectable()
export class CashSessionsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  findAll(status?: string, cashRegisterId?: string) {
    let query = this.prisma.db.orm.public.CashierSession.orderBy((s) => s.openedAt.desc());
    if (status) query = query.where({ status: status as CashSessionStatusValue });
    if (cashRegisterId) query = query.where({ cashRegisterId });
    return query.all();
  }

  async findOne(id: string) {
    const session = await this.prisma.db.orm.public.CashierSession.where({ id }).first();
    if (!session) throw new NotFoundException("Session de caisse introuvable");
    return session;
  }

  async open(dto: OpenSessionDto, cashierId: string) {
    const register = await this.prisma.db.orm.public.CashRegister.where({
      id: dto.cashRegisterId,
    }).first();
    if (!register) throw new NotFoundException("Caisse introuvable");
    if (register.status !== "ACTIVE") throw new BadRequestException("Cette caisse n'est pas active");

    const alreadyOpen = await this.prisma.db.orm.public.CashierSession.where({
      cashRegisterId: dto.cashRegisterId,
    })
      .where({ status: "OPEN" })
      .first();
    if (alreadyOpen) throw new ConflictException("Une session est déjà ouverte sur cette caisse");

    const session = await this.prisma.db.transaction(async (tx) => {
      const created = await tx.orm.public.CashierSession.create({
        id: randomUUID(),
        cashRegisterId: dto.cashRegisterId,
        cashierId,
        status: "OPEN",
        openingAmount: numeric<14, 2>(dto.openingAmount),
        expectedAmount: numeric<14, 2>(dto.openingAmount),
        actualAmount: null,
        difference: null,
        closedAt: null,
        notes: null,
      });

      await tx.orm.public.CashMovement.create({
        id: randomUUID(),
        sessionId: created.id,
        type: "OPENING_FLOAT",
        amount: numeric<14, 2>(dto.openingAmount),
        reason: null,
        referenceType: null,
        referenceId: null,
      });

      return created;
    });

    await this.audit.log({
      userId: cashierId,
      storeId: register.storeId,
      action: "OPEN_SESSION",
      resource: "CASH_SESSIONS",
      resourceId: session.id,
      description: `Ouverture caisse ${register.code}, fond ${dto.openingAmount}`,
    });

    return session;
  }

  async recordMovement(sessionId: string, dto: RecordCashMovementDto) {
    const session = await this.assertOpen(sessionId);

    const direction = CASH_MOVEMENT_DIRECTION[dto.type];
    if (direction === "signed") {
      if (dto.amount === 0) throw new BadRequestException("Le montant ne peut pas être nul");
    } else if (dto.amount <= 0) {
      throw new BadRequestException(`Le montant doit être strictement positif pour ${dto.type}`);
    }
    const delta = direction === "signed" ? dto.amount : dto.amount * direction;

    return this.prisma.db.transaction(async (tx) => {
      const movement = await tx.orm.public.CashMovement.create({
        id: randomUUID(),
        sessionId,
        type: dto.type,
        amount: numeric<14, 2>(delta),
        reason: dto.reason ?? null,
        referenceType: null,
        referenceId: null,
      });

      // Champ de confort mis à jour de façon incrémentale ; recalculé de
      // façon autoritative depuis le ledger CashMovement à la clôture.
      await tx.orm.public.CashierSession.where({ id: sessionId }).update({
        expectedAmount: numeric<14, 2>(Number(session.expectedAmount) + delta),
      });

      return movement;
    });
  }

  async close(sessionId: string, dto: CloseSessionDto, cashierId: string) {
    const session = await this.assertOpen(sessionId);
    const register = await this.prisma.db.orm.public.CashRegister.where({
      id: session.cashRegisterId,
    }).first();

    const closing = await this.prisma.db.transaction(async (tx) => {
      const movements = await tx.orm.public.CashMovement.where({ sessionId }).all();
      const sumByType = (type: string) =>
        movements
          .filter((m) => m.type === type)
          .reduce((sum, m) => sum + Number(m.amount), 0);

      const expectedCash = movements.reduce((sum, m) => sum + Number(m.amount), 0);
      const totalCash = sumByType("CASH_SALE");
      const totalRefunds = Math.abs(sumByType("CASH_REFUND"));
      const totalCashIn = sumByType("CASH_IN");
      const totalCashOut =
        Math.abs(sumByType("CASH_OUT")) + Math.abs(sumByType("EXPENSE")) + Math.abs(sumByType("SAFE_DEPOSIT"));

      const sales = await tx.orm.public.Sale.where({ sessionId }).all();
      const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

      const difference = dto.actualAmount - expectedCash;

      await tx.orm.public.CashierSession.where({ id: sessionId }).update({
        status: "CLOSED",
        actualAmount: numeric<14, 2>(dto.actualAmount),
        difference: numeric<14, 2>(difference),
        closedAt: Temporal.Now.instant(),
        notes: dto.notes ?? null,
      });

      return tx.orm.public.CashSessionClosing.create({
        id: randomUUID(),
        sessionId,
        totalSales: numeric<14, 2>(totalSales),
        totalCash: numeric<14, 2>(totalCash),
        totalRefunds: numeric<14, 2>(totalRefunds),
        totalCashIn: numeric<14, 2>(totalCashIn),
        totalCashOut: numeric<14, 2>(totalCashOut),
        expectedCash: numeric<14, 2>(expectedCash),
        actualCash: numeric<14, 2>(dto.actualAmount),
        difference: numeric<14, 2>(difference),
        notes: dto.notes ?? null,
      });
    });

    await this.audit.log({
      userId: cashierId,
      storeId: register?.storeId ?? null,
      action: "CLOSE_SESSION",
      resource: "CASH_SESSIONS",
      resourceId: sessionId,
      description: `Clôture caisse${register ? " " + register.code : ""}, écart ${closing.difference}`,
    });

    return closing;
  }

  private async assertOpen(sessionId: string) {
    const session = await this.findOne(sessionId);
    if (session.status !== "OPEN") {
      throw new BadRequestException("Cette session de caisse n'est pas ouverte");
    }
    return session;
  }
}
