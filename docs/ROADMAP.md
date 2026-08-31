# Feuille de route — Supermarket Backend

> État actuel détaillé : [PROGRESS.md](./PROGRESS.md). Contexte technique : [ARCHITECTURE.md](./ARCHITECTURE.md).

Objectif final : un backend NestJS/Prisma Next complet, consommé par une application desktop Electron Forge (React + Vite + Tailwind + shadcn/ui) développée en parallèle.

## Principe directeur

Le contrat de données (`contract.prisma`) est déjà quasi complet (41 modèles). **Le travail restant est applicatif : exposer ce modèle via une API REST sécurisée, module par module**, en commençant par ce qui débloque le développement du client Electron le plus tôt possible (auth + catalogue + une transaction de vente simple), plutôt que de tout construire avant de rien brancher.

## Phase 0 — Fondations (bloquant pour tout le reste)

- [ ] **Module d'authentification** (`AuthModule`) : login (email/téléphone + mot de passe via `bcryptjs`), génération access/refresh JWT (`@nestjs/jwt` déjà en dépendance), `JwtStrategy` Passport, guard global + décorateur `@Public()` pour les routes ouvertes.
- [ ] **Guard RBAC** basé sur `Role`/`Permission`/`RolePermission` déjà modélisés — décorateur `@RequirePermission(resource, action)`.
- [ ] **Script de seed** (`src/prisma/seed.ts` a été supprimé, à réécrire) : créer l'organisation par défaut, un store, les rôles système (`SUPER_ADMIN`, `CASHIER`, …), les permissions, et le compte admin initial à partir de `SEED_ADMIN_PHONE`/`SEED_ADMIN_PASSWORD`.
- [ ] **Validation globale** : activer `class-validator`/`class-transformer` (déjà en dépendance) via un `ValidationPipe` global + DTOs par endpoint.
- [ ] **Gestion d'erreurs uniforme** : filtre d'exception global NestJS, format de réponse d'erreur cohérent pour le client Electron.
- [ ] **CORS** : autoriser l'origine de l'app Electron en dev (`app://` ou `http://localhost:<port-vite>` selon la config Forge).

## Phase 1 — Modules métier cœur (MVP point de vente)

Ordre suggéré, chaque module = controller + service + DTOs, en s'appuyant sur `db.orm.public.<Model>` :

1. **Organizations / Stores** — CRUD minimal (souvent un seul tenant au départ).
2. **Users / Roles** — gestion des comptes employés depuis l'app desktop (un admin crée les caissiers).
3. **Catalogue** — `Category`, `Brand`, `Product`, `ProductBarcode`, `ProductPrice` : lecture pour la caisse (recherche par code-barres/SKU), écriture pour la gestion de stock.
4. **Stock** — `Stock` (quantité par magasin/produit), `StockMovement` en écriture append-only à chaque mouvement.
5. **Vente / Caisse** — `CashRegister`, `CashierSession` (ouverture/fermeture de caisse), `Sale`/`SaleItem`, `Payment` (au moins `CASH` pour commencer). C'est le flux transactionnel critique : à envelopper dans `db.transaction(...)` (débit stock + création vente + mouvement de caisse atomiques).
6. **Reçus** — génération `Receipt` a minima en base ; l'impression/PDF peut venir plus tard.

## Phase 2 — Modules étendus

- Achats fournisseurs (`Supplier`, `PurchaseOrder`, `GoodsReceipt`) — réception qui alimente `StockMovement`.
- Ajustements de stock & inventaires (`StockAdjustment`, `InventoryCount`).
- Clients & commandes différées (`Customer`, `Order`, `Delivery`) si la superette gère aussi la livraison.
- Paiements mobile money (`MTN_MOMO`, `AIRTEL_MONEY`) — intégration avec un fournisseur d'API réel.
- `AuditLog` — brancher un interceptor NestJS qui journalise les actions sensibles.
- Rapports (`REPORTS` déjà dans `PermissionResource`) — endpoints d'agrégation (`db.orm.<Model>.groupBy(...)`).

## Phase 3 — Qualité, exploitation

- [ ] Tests d'intégration Jest/Supertest sur chaque module (le tooling est déjà en dépendance, aucun test n'existe encore).
- [ ] `npm audit` — 14 vulnérabilités signalées à l'installation (5 modérées, 9 hautes) : à trier avant mise en production.
- [ ] Pipeline CI (lint + type-check + tests) avant merge sur `main`.
- [ ] Décision de déploiement : Composer/Prisma Cloud (déjà scaffoldé dans `module.ts`/`service.ts`) vs. hébergement classique — à trancher selon les besoins de synchronisation multi-magasin.

## Intégration avec l'application Electron (parallèle)

Points de contrat à stabiliser tôt pour ne pas bloquer le développement du client :

- [ ] **Contrat d'API** : préfixe déjà prévu via `API_PREFIX=api` dans `.env` mais pas encore appliqué dans `main.ts` (`app.setGlobalPrefix(...)`) — à activer avant que le client commence à coder des appels HTTP en dur.
- [ ] **Format des réponses & pagination** standard (ex. `{ data, meta }`) pour que le client React puisse construire des hooks génériques.
- [ ] **Authentification côté client** : flux de login + stockage sécurisé du token dans le process principal Electron (`safeStorage`), refresh transparent.
- [ ] **Mode offline/dégradé** : les IDs `Uuid` générés dès la création (pas d'auto-incrément) permettent en théorie une création côté client avant confirmation serveur — à confirmer si un mode caisse hors-ligne est requis.
- [ ] **OpenAPI/Swagger** (`@nestjs/swagger`, pas encore installé) — générer une doc d'API consommable pour accélérer le développement du client, éventuellement génération de types TypeScript partagés.

## Décisions en attente (à trancher avec l'utilisateur)

- Authentification : téléphone ou email comme identifiant principal ? (le contrat autorise les deux, uniques et optionnels sauf email)
- Multi-organisation dès le départ ou un seul tenant pour la V1 ?
- Mode de déploiement cible (Prisma Cloud/Composer vs VPS classique) ?
- Politique de suppression du champ `passwordHash` dans les réponses : centraliser via un `select` systématique ou un intercepteur de sérialisation ?
