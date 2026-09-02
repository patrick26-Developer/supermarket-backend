import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";

import { PrismaService } from "../prisma.service";
import type { AssignDeliveryDto } from "./dto/assign-delivery.dto";
import type { UpdateDeliveryStatusDto } from "./dto/update-delivery-status.dto";
import type { DeliveryStatusValue } from "./types/delivery-enums";

const TERMINAL_STATUSES: DeliveryStatusValue[] = ["DELIVERED", "FAILED", "CANCELLED"];

@Injectable()
export class DeliveriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(storeId?: string, status?: DeliveryStatusValue, agentId?: string) {
    let query = this.prisma.db.orm.public.Delivery.orderBy((d) => d.createdAt.desc());
    if (storeId) query = query.where({ storeId });
    if (status) query = query.where({ status });
    if (agentId) query = query.where({ agentId });
    return query.all();
  }

  async findOne(id: string) {
    const delivery = await this.prisma.db.orm.public.Delivery.where({ id })
      .include("statusHistory", (h) => h.orderBy((row) => row.createdAt.desc()))
      .first();
    if (!delivery) throw new NotFoundException("Livraison introuvable");
    return delivery;
  }

  async assign(id: string, dto: AssignDeliveryDto) {
    const delivery = await this.assertNotTerminal(id);
    const agent = await this.prisma.db.orm.public.User.where({ id: dto.agentId }).first();
    if (!agent) throw new NotFoundException("Livreur introuvable");

    await this.prisma.db.transaction(async (tx) => {
      await tx.orm.public.Delivery.where({ id }).update({
        agentId: dto.agentId,
        status: "ASSIGNED",
        assignedAt: Temporal.Now.instant(),
      });
      await tx.orm.public.DeliveryStatusHistory.create({
        id: randomUUID(),
        deliveryId: id,
        status: "ASSIGNED",
        note: `Assignée à ${agent.firstName} ${agent.lastName}`,
      });
    });

    return this.findOne(delivery.id);
  }

  async updateStatus(id: string, dto: UpdateDeliveryStatusDto) {
    await this.assertNotTerminal(id);
    if (dto.status === "FAILED" && !dto.failureReason) {
      throw new BadRequestException("failureReason est requis quand le statut passe à FAILED");
    }

    const now = Temporal.Now.instant();

    await this.prisma.db.transaction(async (tx) => {
      // Champs typés explicitement par statut plutôt qu'un objet dynamique —
      // évite de perdre le typage strict des colonnes de l'ORM.
      switch (dto.status) {
        case "PICKED_UP":
          await tx.orm.public.Delivery.where({ id }).update({ status: "PICKED_UP", pickedUpAt: now });
          break;
        case "DELIVERED":
          await tx.orm.public.Delivery.where({ id }).update({ status: "DELIVERED", deliveredAt: now });
          break;
        case "FAILED":
          await tx.orm.public.Delivery.where({ id }).update({
            status: "FAILED",
            failedAt: now,
            failureReason: dto.failureReason ?? null,
          });
          break;
        default:
          await tx.orm.public.Delivery.where({ id }).update({ status: dto.status });
      }

      await tx.orm.public.DeliveryStatusHistory.create({
        id: randomUUID(),
        deliveryId: id,
        status: dto.status,
        note: dto.note ?? null,
      });
    });

    return this.findOne(id);
  }

  private async assertNotTerminal(id: string) {
    const delivery = await this.prisma.db.orm.public.Delivery.where({ id }).first();
    if (!delivery) throw new NotFoundException("Livraison introuvable");
    if (TERMINAL_STATUSES.includes(delivery.status)) {
      throw new BadRequestException(`Cette livraison est déjà ${delivery.status} — statut définitif`);
    }
    return delivery;
  }
}
