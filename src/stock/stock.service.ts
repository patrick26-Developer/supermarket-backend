import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { numeric } from "../common/numeric";
import { PrismaService } from "../prisma.service";
import type { RecordMovementDto } from "./dto/record-movement.dto";
import { STOCK_MOVEMENT_DIRECTION } from "./types/stock-enums";

@Injectable()
export class StockService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(storeId?: string, productId?: string) {
    let query = this.prisma.db.orm.public.Stock.orderBy((s) => s.updatedAt.desc());
    if (storeId) query = query.where({ storeId });
    if (productId) query = query.where({ productId });
    return query.all();
  }

  async findOne(storeId: string, productId: string) {
    const stock = await this.prisma.db.orm.public.Stock.where({ storeId })
      .where({ productId })
      .first();
    if (!stock) throw new NotFoundException("Aucune fiche de stock pour ce magasin/produit");
    return stock;
  }

  listMovements(storeId?: string, productId?: string, limit = 50) {
    let query = this.prisma.db.orm.public.StockMovement.orderBy((m) => m.createdAt.desc()).limit(
      Math.min(limit, 200),
    );
    if (storeId) query = query.where({ storeId });
    if (productId) query = query.where({ productId });
    return query.all();
  }

  /**
   * Enregistre un mouvement de stock et met à jour la fiche `Stock`
   * correspondante de façon atomique (transaction DB). C'est le SEUL point
   * d'entrée censé faire varier une quantité de stock — les futurs modules
   * Vente/Achat doivent appeler cette méthode plutôt que d'écrire
   * directement dans `Stock`.
   */
  async recordMovement(dto: RecordMovementDto) {
    await this.assertStoreExists(dto.storeId);
    await this.assertProductExists(dto.productId);

    const direction = STOCK_MOVEMENT_DIRECTION[dto.type];
    if (direction === "signed") {
      if (dto.quantity === 0) {
        throw new BadRequestException("La quantité de correction ne peut pas être nulle");
      }
    } else if (dto.quantity <= 0) {
      throw new BadRequestException(
        `La quantité doit être strictement positive pour le type ${dto.type}`,
      );
    }
    const delta = direction === "signed" ? dto.quantity : dto.quantity * direction;

    return this.prisma.db.transaction(async (tx) => {
      const existingStock = await tx.orm.public.Stock.where({ storeId: dto.storeId })
        .where({ productId: dto.productId })
        .first();

      const previousQty = existingStock ? Number(existingStock.quantity) : 0;
      const resultingQty = previousQty + delta;
      if (resultingQty < 0) {
        throw new BadRequestException(
          `Stock insuffisant : disponible ${previousQty}, mouvement demandé ${delta}`,
        );
      }

      if (existingStock) {
        await tx.orm.public.Stock.where({ id: existingStock.id }).update({
          quantity: numeric<14, 3>(resultingQty),
          availableQty: numeric<14, 3>(resultingQty - Number(existingStock.reservedQty)),
        });
      } else {
        await tx.orm.public.Stock.create({
          id: randomUUID(),
          storeId: dto.storeId,
          productId: dto.productId,
          quantity: numeric<14, 3>(resultingQty),
          reservedQty: numeric<14, 3>(0),
          availableQty: numeric<14, 3>(resultingQty),
        });
      }

      const movement = await tx.orm.public.StockMovement.create({
        id: randomUUID(),
        storeId: dto.storeId,
        productId: dto.productId,
        type: dto.type,
        quantity: numeric<14, 3>(delta),
        unitCost: dto.unitCost !== undefined ? numeric<14, 2>(dto.unitCost) : null,
        referenceType: dto.referenceType ?? null,
        referenceId: dto.referenceId ?? null,
        previousQty: numeric<14, 3>(previousQty),
        resultingQty: numeric<14, 3>(resultingQty),
        notes: dto.notes ?? null,
      });

      return { movement, stock: { storeId: dto.storeId, productId: dto.productId, quantity: resultingQty } };
    });
  }

  private async assertStoreExists(storeId: string): Promise<void> {
    const store = await this.prisma.db.orm.public.Store.where({ id: storeId }).first();
    if (!store) throw new NotFoundException("Magasin introuvable");
  }

  private async assertProductExists(productId: string): Promise<void> {
    const product = await this.prisma.db.orm.public.Product.where({ id: productId }).first();
    if (!product) throw new NotFoundException("Produit introuvable");
  }
}
