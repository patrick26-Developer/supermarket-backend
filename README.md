# supermarket-backend

Backend NestJS + Prisma 8 (Prisma Next) pour la gestion d'une chaîne de superettes/supermarchés. Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/PROGRESS.md`](docs/PROGRESS.md) et [`docs/ROADMAP.md`](docs/ROADMAP.md) pour le suivi détaillé du projet.

## Run locally (flux validé)

1. Copier `.env.example` en `.env` et adapter les valeurs si besoin.
2. Démarrer PostgreSQL local :
   ```bash
   docker compose up -d
   ```
3. Installer les dépendances puis lancer le serveur en mode watch :
   ```bash
   npm install
   npm run dev
   ```
4. Vérifier : `curl http://localhost:3000/` et `curl http://localhost:3000/users`.

pgAdmin est disponible sur http://localhost:5050 (voir identifiants dans `docker-compose.yml`).

## Run via Prisma Composer (déploiement géré, optionnel)

```bash
npm run dev:composer
```

Construit l'app et la démarre via Composer. Pour les projets PostgreSQL, une base Prisma Postgres locale est provisionnée et le contrat y est appliqué automatiquement. Ce flux n'a pas encore été validé sur ce projet — privilégier le flux Docker Compose ci-dessus pour le développement.

## Deploy

```bash
npm run deploy
```

Construit le build framework, provisionne Prisma Postgres si sélectionné, applique les migrations, et déploie l'app sur Prisma Compute.

## Prisma

- Contract: `src/prisma/contract.prisma`
- Prisma and Composer config: `prisma.config.ts`
- Composer app: `module.ts` and `service.ts`

After changing the contract, run:

```bash
npm run contract:emit
npx prisma migration plan --name <slug>
npx prisma db migrate --db "$DATABASE_URL" --advance-ref db
npx prisma db verify
```

To use the framework's development server directly, run `npm run dev`. This direct mode requires `DATABASE_URL`.
