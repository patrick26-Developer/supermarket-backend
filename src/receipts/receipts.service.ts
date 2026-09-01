import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma.service";

@Injectable()
export class ReceiptsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const receipt = await this.prisma.db.orm.public.Receipt.where({ id }).first();
    if (!receipt) throw new NotFoundException("Reçu introuvable");
    return receipt;
  }

  async findByOrder(orderId: string) {
    const receipt = await this.prisma.db.orm.public.Receipt.where({ orderId }).first();
    if (!receipt) throw new NotFoundException("Aucun reçu pour cette commande");
    return receipt;
  }
}
