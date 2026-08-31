import { Injectable } from "@nestjs/common";
import { db } from "./prisma/db";

@Injectable()
export class PrismaService {
  readonly db = db;

  listUsers(limit = 10) {
    return db.orm.public.User.select(
      "id",
      "email",
      "firstName",
      "lastName",
      "status",
      "createdAt",
    )
      .orderBy((u) => u.createdAt.desc())
      .limit(limit)
      .all();
  }
}
