# Architecture — Supermarket Backend (Superette)

> Dernière mise à jour : 2026-08-31

## 1. Vue d'ensemble

Backend API pour la gestion d'une chaîne de superettes/supermarchés (multi-organisation, multi-magasin), destiné à être consommé par une application desktop **Electron Forge + React + Vite + Tailwind + shadcn/ui** développée en parallèle.

```
┌─────────────────────────┐        HTTP/REST        ┌──────────────────────────┐
│  Electron (React/Vite)  │ ───────────────────────▶ │   NestJS API (ce repo)   │
│  desktop client          │ ◀─────────────────────── │                          │
└─────────────────────────┘                           └────────────┬─────────────┘
                                                                     │ Prisma Next (ORM typé)
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │   PostgreSQL 16       │
                                                          │  (docker-compose)     │
                                                          └──────────────────────┘
```

## 2. Stack technique

| Couche | Choix | Version |
|---|---|---|
| Runtime | Node.js | v24.x |
| Langage | TypeScript | ^5.9 |
| Framework HTTP | NestJS | ^11.1 |
| Data layer | **Prisma Next (Prisma 8)** — contract-first, pas de `schema.prisma` classique | 8.0.0-rc.12 |
| Driver DB | `@prisma/orm-postgres` | 8.0.0-rc.8 |
| Déploiement managé | `@prisma/composer` + `@prisma/composer-prisma-cloud` (optionnel, cloud) | 0.16.0 |
| Base de données locale | PostgreSQL 16 (Alpine) via Docker Compose | — |
| Auth (prévu, pas encore câblé) | `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcryptjs` | — |
| Bundler build | esbuild | ^0.28 |
| Dev runner | tsx (watch mode) | ^4.21 |
| Tests | Jest + ts-jest + Supertest | ^30 |

**Pourquoi Prisma Next et pas Prisma ORM classique ?** Ce projet a été généré via `create-prisma` et utilise le modèle "contract-first" : on édite `src/prisma/contract.prisma`, puis `prisma contract emit` génère `contract.json` (données) et `contract.d.ts` (types). Le client typé s'obtient via `db.orm.<namespace>.<Model>` (ex. `db.orm.public.User`) ou `db.sql.<table>` pour du SQL bas niveau. Voir la skill `prisma-8` du projet pour la référence complète — **ne pas raisonner avec les habitudes de Prisma ORM 7 (schema.prisma, `PrismaClient`)**, l'API est différente.

## 3. Structure du dépôt

```
supermarket-backend/
├── src/
│   ├── main.ts                 # bootstrap NestJS
│   ├── app.module.ts           # module racine
│   ├── app.controller.ts       # GET /
│   ├── users.controller.ts     # GET /users
│   ├── users.service.ts
│   ├── prisma.service.ts       # wrapper injectable autour de `db`
│   └── prisma/
│       ├── contract.prisma     # ⭐ source de vérité du schéma de données
│       ├── contract.json       # généré — ne pas éditer à la main
│       ├── contract.d.ts       # généré — ne pas éditer à la main
│       ├── db.ts               # client runtime (`export const db`)
│       └── composer.ts         # binding du contrat pour Prisma Composer
├── migrations/
│   ├── app/
│   │   ├── <horodatage>_baseline/   # migrations versionnées (graphe)
│   │   └── refs/db.json             # pointeur "où en est la DB de dev"
│   └── snapshots/<hash>/            # snapshots de contrat par migration
├── module.ts, service.ts       # définition de l'app pour Prisma Composer (déploiement cloud)
├── prisma.config.ts            # config CLI Prisma (contrat, connexion, composer)
├── prisma-composer.config.ts   # config Composer (extensions, state)
├── docker-compose.yml          # Postgres 16 + pgAdmin pour le dev local
└── docs/                       # ce dossier
```

## 4. Modèle de données (contract.prisma)

Le contrat couvre **41 modèles** organisés en domaines métier, en `XAF/FCFA` par défaut :

| Domaine | Modèles principaux |
|---|---|
| Identité & accès | `User`, `Role`, `Permission`, `UserRole`, `RolePermission` (RBAC complet) |
| Organisation | `Organization`, `Store`, `StoreUser` (multi-magasin) |
| Catalogue | `Category`, `Brand`, `Product`, `ProductBarcode`, `ProductPrice`, `ProductImage` |
| Achats | `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`, `GoodsReceiptItem` |
| Stock | `Stock`, `StockMovement`, `StockAdjustment`, `StockAdjustmentItem`, `InventoryCount`, `InventoryCountItem` |
| Clients | `Customer`, `CustomerAddress` |
| Commandes | `Order`, `OrderItem` |
| Livraison | `Delivery`, `DeliveryStatusHistory` |
| Caisse | `CashRegister`, `CashierSession`, `CashMovement`, `CashSessionClosing` |
| Ventes | `Sale`, `SaleItem` |
| Paiements | `Payment` (mobile money MTN/Airtel inclus) |
| Documents | `Receipt`, `Invoice` |
| Audit | `AuditLog` |

Le rôle métier (`RoleCode`) couvre déjà : `SUPER_ADMIN`, `ADMIN`, `STORE_MANAGER`, `CASHIER`, `STOCK_MANAGER`, `PURCHASING_MANAGER`, `SALES_MANAGER`, `ACCOUNTANT`, `DELIVERY_AGENT`, `AUDITOR`, `CUSTOMER`.

> **Le contrat est très avancé, l'API applicative ne l'est pas encore.** Voir [`ROADMAP.md`](./ROADMAP.md) — seuls `GET /` et `GET /users` existent aujourd'hui.

## 5. Cycle de vie du contrat de données

```
1. Éditer src/prisma/contract.prisma
2. npx prisma contract emit           # régénère contract.json + contract.d.ts
3. npx prisma migration plan --name <slug>   # planifie une migration (diff)
4. npx prisma db migrate --db "$DATABASE_URL" --advance-ref db   # applique + avance la ref
5. npx prisma db verify               # vérifie que la DB correspond au contrat
```

Le graphe de migrations vit sous `migrations/app/`. La ref `migrations/app/refs/db.json` indique à quel hash de contrat la base de dev a été amenée — **ne pas la modifier à la main**, elle est gérée par `db init`/`db update`/`db migrate --advance-ref`.

## 6. Runtime applicatif

- `src/prisma/db.ts` exporte un singleton `db` construit soit via le binding Prisma Composer (déploiement cloud), soit via `postgres<Contract>({ url: DATABASE_URL })` en direct (dev local). C'est ce singleton qu'il faut importer partout — **ne jamais instancier un nouveau client par requête**.
- `PrismaService` (NestJS `@Injectable`) expose `db` aux autres services et centralise les requêtes transverses.
- Les requêtes utilisent le lane ORM : `db.orm.public.<Model>.where(...).select(...).all()`. Voir la skill `prisma-8/references/queries-postgres.md` pour la syntaxe complète (predicates, `.include()`, agrégations, transactions `db.transaction(...)`).

## 7. Environnement local

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL (pointe vers le conteneur docker-compose en local) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secrets JWT — **prévus, pas encore utilisés dans le code** |
| `PORT`, `API_PREFIX`, `NODE_ENV` | Config serveur |
| `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` | Prévus pour un script de seed de l'admin initial (à écrire, voir roadmap) |

`docker-compose.yml` démarre :
- `postgres` (**port hôte 5433** → 5432 dans le conteneur, DB `superette_db`) — le port 5433 est délibéré : évite un conflit si un PostgreSQL natif tourne déjà sur le 5432 standard (cas rencontré en dev, voir `docs/PROGRESS.md`)
- `pgadmin` (port 5050, http://localhost:5050)

> ⚠️ Avant de lancer `docker compose up -d`, vérifier qu'aucun autre service PostgreSQL n'écoute déjà sur le port choisi : `Get-NetTCPConnection -LocalPort 5433 -State Listen` (PowerShell). Si `DATABASE_URL` pointe silencieusement vers une autre instance Postgres que le conteneur du projet, l'app fonctionne quand même (aucune erreur) mais les données n'atterrissent pas là où on le croit — symptôme difficile à repérer sans y penser explicitement.

## 8. Décisions d'architecture notables

- **Prisma Next contract-first plutôt que `schema.prisma` classique** : imposé par `create-prisma`, cohérent avec le tooling `prisma-composer` pour un déploiement cloud géré plus tard.
- **UUID comme clé primaire partout** (`Uuid @id @default(uuid())`) : adapté à un futur mode offline-first / sync multi-poste (caisse) où la génération d'ID doit pouvoir se faire côté client.
- **Devise par défaut `XAF`** et pays `CG` (Congo) : marché cible identifié.
- **`updatedAt` via `temporal.updatedAt()`** : horodatage géré par Prisma Next avec `temporal-polyfill`, pas de trigger DB manuel.
- **RBAC en base plutôt que rôles applicatifs codés en dur** : `Role`/`Permission`/`RolePermission` permettent une gestion fine sans redéploiement.

## Documents liés

- [PROGRESS.md](./PROGRESS.md) — état d'avancement, ce qui a été vérifié fonctionnel
- [ROADMAP.md](./ROADMAP.md) — prochaines étapes, y compris l'intégration avec l'app Electron
