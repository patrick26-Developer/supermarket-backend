import { Global, Module } from "@nestjs/common";

import { PrismaService } from "../prisma.service";

/**
 * Rend `PrismaService` (donc `db`) injectable dans tous les modules sans
 * avoir à le ré-importer partout. Un seul singleton `db` pour tout le process
 * (voir prisma-8 skill § runtime — ne jamais instancier un client par requête).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
