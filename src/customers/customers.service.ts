import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { numeric } from "../common/numeric";
import { generateReference } from "../common/reference";
import { PrismaService } from "../prisma.service";
import type { CreateCustomerAddressDto } from "./dto/create-customer-address.dto";
import type { CreateCustomerDto } from "./dto/create-customer.dto";
import type { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(storeId?: string) {
    let query = this.prisma.db.orm.public.Customer.orderBy((c) => c.createdAt.desc());
    if (storeId) query = query.where({ storeId });
    return query.all();
  }

  async findOne(id: string) {
    const customer = await this.prisma.db.orm.public.Customer.where({ id })
      .include("addresses", (a) => a)
      .first();
    if (!customer) throw new NotFoundException("Client introuvable");
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const store = await this.prisma.db.orm.public.Store.where({ id: dto.storeId }).first();
    if (!store) throw new NotFoundException("Magasin introuvable");

    return this.prisma.db.orm.public.Customer.create({
      id: randomUUID(),
      storeId: dto.storeId,
      customerNo: generateReference("CUST"),
      type: dto.type ?? "INDIVIDUAL",
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      companyName: dto.companyName ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      status: "ACTIVE",
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.assertExists(id);
    await this.prisma.db.orm.public.Customer.where({ id }).update({ ...dto });
    return this.findOne(id);
  }

  async addAddress(customerId: string, dto: CreateCustomerAddressDto) {
    await this.assertExists(customerId);

    if (dto.isDefault) {
      await this.prisma.db.orm.public.CustomerAddress.where({ customerId }).update({
        isDefault: false,
      });
    }

    await this.prisma.db.orm.public.CustomerAddress.create({
      id: randomUUID(),
      customerId,
      label: dto.label ?? null,
      recipient: dto.recipient,
      phone: dto.phone ?? null,
      address: dto.address,
      city: dto.city,
      district: dto.district ?? null,
      landmark: dto.landmark ?? null,
      latitude: dto.latitude !== undefined ? numeric<10, 7>(dto.latitude) : null,
      longitude: dto.longitude !== undefined ? numeric<10, 7>(dto.longitude) : null,
      isDefault: dto.isDefault ?? false,
    });

    return this.findOne(customerId);
  }

  async removeAddress(customerId: string, addressId: string): Promise<void> {
    await this.assertExists(customerId);
    const address = await this.prisma.db.orm.public.CustomerAddress.where({ id: addressId })
      .where({ customerId })
      .first();
    if (!address) throw new NotFoundException("Adresse introuvable pour ce client");
    await this.prisma.db.orm.public.CustomerAddress.where({ id: addressId }).delete();
  }

  private async assertExists(id: string): Promise<void> {
    const customer = await this.prisma.db.orm.public.Customer.where({ id }).select("id").first();
    if (!customer) throw new NotFoundException("Client introuvable");
  }
}
