import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { PrismaService } from "../../prisma.service";
import type { CreateCategoryDto } from "./dto/create-category.dto";
import type { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.db.orm.public.Category.orderBy((c) => c.name.asc()).all();
  }

  async findOne(id: string) {
    const category = await this.prisma.db.orm.public.Category.where({ id }).first();
    if (!category) throw new NotFoundException("Catégorie introuvable");
    return category;
  }

  async create(dto: CreateCategoryDto) {
    await this.assertSlugAvailable(dto.slug);
    if (dto.parentId) await this.findOne(dto.parentId);

    return this.prisma.db.orm.public.Category.create({
      id: randomUUID(),
      parentId: dto.parentId ?? null,
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      status: dto.status ?? "ACTIVE",
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.slug) await this.assertSlugAvailable(dto.slug, id);
    if (dto.parentId) await this.findOne(dto.parentId);

    await this.prisma.db.orm.public.Category.where({ id }).update({ ...dto });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.db.orm.public.Category.where({ id }).delete();
  }

  private async assertSlugAvailable(slug: string, excludingId?: string): Promise<void> {
    const existing = await this.prisma.db.orm.public.Category.where({ slug }).first();
    if (existing && existing.id !== excludingId) {
      throw new ConflictException(`Le slug "${slug}" est déjà utilisé`);
    }
  }
}
