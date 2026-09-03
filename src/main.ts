import "reflect-metadata";

import { join } from "node:path";

import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Fichiers uploadés (images produits…) servis en statique, hors du préfixe
  // `/api` — voir src/uploads/uploads.controller.ts.
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });

  const apiPrefix = (process.env.API_PREFIX ?? "api").trim() || "api";
  app.setGlobalPrefix(apiPrefix, {
    // Racine "/" laissée hors préfixe : health-check simple pour les sondes/monitoring.
    exclude: [{ path: "/", method: RequestMethod.GET }],
  });

  // Filet de sécurité global. ATTENTION : ce projet transpile avec esbuild
  // (tsx / esbuild build), qui n'émet pas `design:paramtypes`. Sans cette
  // métadonnée, ValidationPipe ne peut pas déduire le DTO d'un `@Body()` et
  // saute la validation SANS ERREUR. Pour tout endpoint validé par DTO,
  // utiliser explicitement `@Body(new ValidateBodyPipe(MonDto))`
  // (src/common/pipes/validate-body.pipe.ts) — ne pas compter sur ce pipe
  // global seul pour la validation de payloads.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Origine du client Electron en dev (Vite). À restreindre en prod via env dédiée.
  app.enableCors({ origin: true, credentials: true });

  const rawPort = (process.env.PORT ?? "").trim();
  const parsedPort = rawPort.length > 0 ? Number(rawPort) : Number.NaN;
  const port =
    Number.isFinite(parsedPort) && parsedPort >= 0 && parsedPort <= 65535 ? parsedPort : 3000;
  await app.listen(port);
  console.log(`Server running at http://localhost:${port} (API prefix: /${apiPrefix})`);
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
