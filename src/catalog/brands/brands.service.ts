import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { PrismaService } from "../../prisma.service";
import type { CreateBrandDto } from "./dto/create-brand.dto";
import type { UpdateBrandDto } from "./dto/update-brand.dto";

@Injectable()
export class BrandsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.db.orm.public.Brand.orderBy((b) => b.name.asc()).all();
  }

  async findOne(id: string) {
    const brand = await this.prisma.db.orm.public.Brand.where({ id }).first();
    if (!brand) throw new NotFoundException("Marque introuvable");
    return brand;
  }

  async create(dto: CreateBrandDto) {
    await this.assertUnique(dto.name, dto.slug);
    return this.prisma.db.orm.public.Brand.create({
      id: randomUUID(),
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findOne(id);
    if (dto.name || dto.slug) await this.assertUnique(dto.name, dto.slug, id);

    await this.prisma.db.orm.public.Brand.where({ id }).update({ ...dto });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.db.orm.public.Brand.where({ id }).delete();
  }

  private async assertUnique(name?: string, slug?: string, excludingId?: string): Promise<void> {
    if (name) {
      const existing = await this.prisma.db.orm.public.Brand.where({ name }).first();
      if (existing && existing.id !== excludingId) {
        throw new ConflictException(`Le nom "${name}" est déjà utilisé`);
      }
    }
    if (slug) {
      const existing = await this.prisma.db.orm.public.Brand.where({ slug }).first();
      if (existing && existing.id !== excludingId) {
        throw new ConflictException(`Le slug "${slug}" est déjà utilisé`);
      }
    }
  }
}
