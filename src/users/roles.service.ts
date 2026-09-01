import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma.service";

@Injectable()
export class RolesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.db.orm.public.Role.select("id", "code", "name", "description", "isSystem")
      .orderBy((r) => r.code.asc())
      .all();
  }
}
