import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { numeric } from "../../common/numeric";
import { PrismaService } from "../../prisma.service";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";

// Plafond de sécurité tant qu'il n'y a pas de pagination (voir docs/ROADMAP.md).
const DEFAULT_LIST_LIMIT = 100;

@Injectable()
export class ProductsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(search?: string) {
    let query = this.prisma.db.orm.public.Product.orderBy((p) => p.name.asc()).limit(
      DEFAULT_LIST_LIMIT,
    );
    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      query = this.prisma.db.orm.public.Product.where((p) => p.name.ilike(term))
        .orderBy((p) => p.name.asc())
        .limit(DEFAULT_LIST_LIMIT);
    }
    return query.all();
  }

  async findOne(id: string) {
    const product = await this.prisma.db.orm.public.Product.where({ id }).first();
    if (!product) throw new NotFoundException("Produit introuvable");
    return product;
  }

  /** Recherche caisse : code-barres exact d'abord, puis SKU exact en repli. */
  async findByCode(code: string) {
    const byBarcode = await this.prisma.db.orm.public.ProductBarcode
      .where({ barcode: code })
      .include("product")
      .first();
    if (byBarcode) return byBarcode.product;

    const bySku = await this.prisma.db.orm.public.Product.where({ sku: code }).first();
    if (bySku) return bySku;

    throw new NotFoundException("Aucun produit pour ce code-barres/SKU");
  }

  async create(dto: CreateProductDto) {
    await this.assertUnique(dto.sku, dto.slug);
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);
    if (dto.brandId) await this.assertBrandExists(dto.brandId);

    return this.prisma.db.orm.public.Product.create({
      id: randomUUID(),
      categoryId: dto.categoryId ?? null,
      brandId: dto.brandId ?? null,
      sku: dto.sku,
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      productType: dto.productType ?? "STANDARD",
      unitType: dto.unitType ?? "PIECE",
      status: dto.status ?? "ACTIVE",
      costPrice: numeric<14, 2>(dto.costPrice),
      taxRate: numeric<5, 2>(dto.taxRate),
      reorderLevel: numeric<14, 3>(dto.reorderLevel),
      minimumStock: numeric<14, 3>(dto.minimumStock),
      maximumStock: dto.maximumStock !== undefined ? numeric<14, 3>(dto.maximumStock) : null,
      imageUrl: dto.imageUrl ?? null,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.sku || dto.slug) await this.assertUnique(dto.sku, dto.slug, id);
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);
    if (dto.brandId) await this.assertBrandExists(dto.brandId);

    await this.prisma.db.orm.public.Product.where({ id }).update({
      ...dto,
      costPrice: dto.costPrice !== undefined ? numeric<14, 2>(dto.costPrice) : undefined,
      taxRate: dto.taxRate !== undefined ? numeric<5, 2>(dto.taxRate) : undefined,
      reorderLevel: dto.reorderLevel !== undefined ? numeric<14, 3>(dto.reorderLevel) : undefined,
      minimumStock: dto.minimumStock !== undefined ? numeric<14, 3>(dto.minimumStock) : undefined,
      maximumStock: dto.maximumStock !== undefined ? numeric<14, 3>(dto.maximumStock) : undefined,
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.db.orm.public.Product.where({ id }).delete();
  }

  private async assertUnique(sku?: string, slug?: string, excludingId?: string): Promise<void> {
    if (sku) {
      const existing = await this.prisma.db.orm.public.Product.where({ sku }).first();
      if (existing && existing.id !== excludingId) {
        throw new ConflictException(`Le SKU "${sku}" est déjà utilisé`);
      }
    }
    if (slug) {
      const existing = await this.prisma.db.orm.public.Product.where({ slug }).first();
      if (existing && existing.id !== excludingId) {
        throw new ConflictException(`Le slug "${slug}" est déjà utilisé`);
      }
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.db.orm.public.Category.where({ id: categoryId }).first();
    if (!category) throw new NotFoundException("Catégorie introuvable");
  }

  private async assertBrandExists(brandId: string): Promise<void> {
    const brand = await this.prisma.db.orm.public.Brand.where({ id: brandId }).first();
    if (!brand) throw new NotFoundException("Marque introuvable");
  }
}
