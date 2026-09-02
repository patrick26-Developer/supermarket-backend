import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { PrismaService } from "../prisma.service";
import type { CreateSupplierDto } from "./dto/create-supplier.dto";
import type { UpdateSupplierDto } from "./dto/update-supplier.dto";

@Injectable()
export class SuppliersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.db.orm.public.Supplier.orderBy((s) => s.name.asc()).all();
  }

  async findOne(id: string) {
    const supplier = await this.prisma.db.orm.public.Supplier.where({ id }).first();
    if (!supplier) throw new NotFoundException("Fournisseur introuvable");
    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    await this.assertCodeAvailable(dto.code);
    return this.prisma.db.orm.public.Supplier.create({
      id: randomUUID(),
      name: dto.name,
      code: dto.code,
      contactName: dto.contactName ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      city: dto.city ?? null,
      taxNumber: dto.taxNumber ?? null,
      status: "ACTIVE",
    });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    if (dto.code) await this.assertCodeAvailable(dto.code, id);
    await this.prisma.db.orm.public.Supplier.where({ id }).update({ ...dto });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.db.orm.public.Supplier.where({ id }).delete();
  }

  private async assertCodeAvailable(code: string, excludingId?: string): Promise<void> {
    const existing = await this.prisma.db.orm.public.Supplier.where({ code }).first();
    if (existing && existing.id !== excludingId) {
      throw new ConflictException(`Le code "${code}" est déjà utilisé`);
    }
  }
}
