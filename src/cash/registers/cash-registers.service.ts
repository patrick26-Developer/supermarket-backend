import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { PrismaService } from "../../prisma.service";
import type { CreateCashRegisterDto } from "./dto/create-cash-register.dto";

@Injectable()
export class CashRegistersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(storeId?: string) {
    let query = this.prisma.db.orm.public.CashRegister.orderBy((r) => r.code.asc());
    if (storeId) query = query.where({ storeId });
    return query.all();
  }

  async findOne(id: string) {
    const register = await this.prisma.db.orm.public.CashRegister.where({ id }).first();
    if (!register) throw new NotFoundException("Caisse introuvable");
    return register;
  }

  async create(dto: CreateCashRegisterDto) {
    const store = await this.prisma.db.orm.public.Store.where({ id: dto.storeId }).first();
    if (!store) throw new NotFoundException("Magasin introuvable");

    const existing = await this.prisma.db.orm.public.CashRegister.where({ storeId: dto.storeId })
      .where({ code: dto.code })
      .first();
    if (existing) throw new ConflictException(`Le code "${dto.code}" est déjà utilisé dans ce magasin`);

    return this.prisma.db.orm.public.CashRegister.create({
      id: randomUUID(),
      storeId: dto.storeId,
      code: dto.code,
      name: dto.name,
      status: "ACTIVE",
    });
  }
}
