import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { Temporal } from "temporal-polyfill";

import { PrismaService } from "../prisma.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";
import type { RoleCodeValue, UserStatusValue } from "./types/user-enums";

const SAFE_FIELDS = [
  "id",
  "email",
  "phone",
  "firstName",
  "lastName",
  "displayName",
  "status",
  "lastLoginAt",
  "passwordChangedAt",
  "createdAt",
  "updatedAt",
] as const;

const LIST_LIMIT = 200;

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(status?: UserStatusValue) {
    let query = this.prisma.db.orm.public.User.select(...SAFE_FIELDS)
      .orderBy((u) => u.createdAt.desc())
      .limit(LIST_LIMIT);
    if (status) query = query.where({ status });
    return query.all();
  }

  async findOne(id: string) {
    const user = await this.prisma.db.orm.public.User.select(...SAFE_FIELDS)
      .where({ id })
      .include("roles", (r) => r.include("role", (rr) => rr.select("code", "name")))
      .first();
    if (!user) throw new NotFoundException("Utilisateur introuvable");
    return user;
  }

  async create(dto: CreateUserDto) {
    await this.assertUnique({ email: dto.email, phone: dto.phone });
    const passwordHash = await hash(dto.password, 12);

    const user = await this.prisma.db.orm.public.User.create({
      id: randomUUID(),
      email: dto.email,
      phone: dto.phone ?? null,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: dto.displayName ?? null,
      status: "ACTIVE",
      lastLoginAt: null,
      passwordChangedAt: null,
    });

    for (const roleCode of dto.roles ?? []) {
      await this.assignRoleInternal(user.id, roleCode);
    }

    return this.findOne(user.id);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.assertExists(id);
    if (dto.phone) await this.assertUnique({ phone: dto.phone, excludingId: id });
    await this.prisma.db.orm.public.User.where({ id }).update({ ...dto });
    return this.findOne(id);
  }

  async assignRole(id: string, roleCode: RoleCodeValue) {
    await this.assertExists(id);
    await this.assignRoleInternal(id, roleCode);
    return this.findOne(id);
  }

  async revokeRole(id: string, roleCode: RoleCodeValue) {
    await this.assertExists(id);
    const role = await this.prisma.db.orm.public.Role.where({ code: roleCode }).first();
    if (!role) throw new NotFoundException(`Rôle "${roleCode}" introuvable`);

    await this.prisma.db.orm.public.UserRole.where({ userId: id }).where({ roleId: role.id }).delete();
    return this.findOne(id);
  }

  async resetPassword(id: string, dto: ResetPasswordDto): Promise<{ success: true }> {
    await this.assertExists(id);
    const passwordHash = await hash(dto.newPassword, 12);
    await this.prisma.db.orm.public.User.where({ id }).update({
      passwordHash,
      passwordChangedAt: Temporal.Now.instant(),
    });
    return { success: true };
  }

  private async assignRoleInternal(userId: string, roleCode: RoleCodeValue): Promise<void> {
    const role = await this.prisma.db.orm.public.Role.where({ code: roleCode }).first();
    if (!role) throw new NotFoundException(`Rôle "${roleCode}" introuvable`);

    const existing = await this.prisma.db.orm.public.UserRole.where({ userId })
      .where({ roleId: role.id })
      .first();
    if (existing) return; // idempotent

    await this.prisma.db.orm.public.UserRole.create({ userId, roleId: role.id });
  }

  private async assertExists(id: string): Promise<void> {
    const user = await this.prisma.db.orm.public.User.where({ id }).select("id").first();
    if (!user) throw new NotFoundException("Utilisateur introuvable");
  }

  private async assertUnique(params: {
    email?: string;
    phone?: string;
    excludingId?: string;
  }): Promise<void> {
    const { email, phone, excludingId } = params;

    if (email) {
      const existingEmail = await this.prisma.db.orm.public.User.where({ email }).first();
      if (existingEmail && existingEmail.id !== excludingId) {
        throw new ConflictException(`L'email "${email}" est déjà utilisé`);
      }
    }

    if (phone) {
      const existingPhone = await this.prisma.db.orm.public.User.where({ phone }).first();
      if (existingPhone && existingPhone.id !== excludingId) {
        throw new ConflictException(`Le téléphone "${phone}" est déjà utilisé`);
      }
    }
  }
}
