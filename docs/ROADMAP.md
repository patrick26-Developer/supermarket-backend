# Feuille de route — Supermarket Backend

> État actuel détaillé : [PROGRESS.md](./PROGRESS.md). Contexte technique : [ARCHITECTURE.md](./ARCHITECTURE.md).

Objectif final : un backend NestJS/Prisma Next complet, consommé par une application desktop Electron Forge (React + Vite + Tailwind + shadcn/ui) développée en parallèle.

## Principe directeur

Le contrat de données (`contract.prisma`) est déjà quasi complet (41 modèles). **Le travail restant est applicatif : exposer ce modèle via une API REST sécurisée, module par module**, en commençant par ce qui débloque le développement du client Electron le plus tôt possible (auth + catalogue + une transaction de vente simple), plutôt que de tout construire avant de rien brancher.

## Phase 0 — Fondations (bloquant pour tout le reste)

- [x] **Module d'authentification** (`AuthModule`) — login email + mot de passe (`bcryptjs`), access/refresh JWT (`@nestjs/jwt`), `JwtAccessStrategy` Passport, `JwtAuthGuard` global + décorateur `@Public()`. Testé de bout en bout le 2026-08-31 (voir PROGRESS.md).
- [x] **Guard RBAC** — `PermissionsGuard` + décorateur `@RequirePermission(resource, action)`, résolu en base via `Role`→`RolePermission`→`Permission` à chaque requête (pas embarqué dans le JWT, pour qu'une révocation soit immédiate).
- [x] **Script de seed** (`src/prisma/seed.ts`) — organisation/magasin par défaut, 99 permissions, 11 rôles système, 402 habilitations rôle→permission, compte admin initial. `npm run seed`.
- [x] **Validation** — DTOs `class-validator` + `ValidateBodyPipe` (voir gotcha esbuild ci-dessous ; ⚠️ ne pas utiliser `@Body() dto: X` seul).
- [ ] **Gestion d'erreurs uniforme** : filtre d'exception global NestJS (le format actuel est celui par défaut de Nest — correct mais pas encore personnalisé).
- [x] **CORS** activé (`origin: true` en dev — à restreindre en prod).
- [x] **Préfixe API** (`/api`) appliqué, `/` conservé en health-check public hors préfixe.

### ⚠️ Gotcha toolchain à connaître avant tout nouveau module

Ce projet transpile avec **esbuild** (tsx en dev, esbuild pour `npm run build`), qui **n'émet pas `design:paramtypes`** (`emitDecoratorMetadata`). Conséquences, déjà rencontrées et corrigées dans `AuthModule` :

1. **Injection de dépendances par type seul ne fonctionne pas.** `constructor(private readonly x: SomeService)` reçoit `undefined` à l'exécution. Le scaffold `create-prisma` avait déjà contourné ça avec `@Inject(Token)` explicite (voir `users.service.ts`) — **toujours répéter le token explicitement** : `constructor(@Inject(SomeService) private readonly x: SomeService)`.
2. **`@Body() dto: SomeDto` seul ne valide RIEN.** Le `ValidationPipe` global déduit le DTO via le type réfléchi du paramètre ; sans métadonnée, il retombe sur `Object` et **saute la validation silencieusement** (pas d'erreur, le payload passe tel quel — a fait planter `AuthService.login` en 500 au lieu de renvoyer un 400 propre). Utiliser systématiquement `@Body(new ValidateBodyPipe(SomeDto)) dto: SomeDto` (`src/common/pipes/validate-body.pipe.ts`).
3. **Les colonnes `DateTime`/`temporal.updatedAt()` attendent un `Temporal.Instant`, pas un `Date` natif.** `new Date()` compile mais échoue à l'exécution (`RUNTIME.ENCODE_FAILED`). Utiliser `Temporal.Now.instant()` (`import { Temporal } from "temporal-polyfill"`), ou omettre le champ pour laisser le défaut DB s'appliquer (approche du seed).

Ces trois pièges sont invisibles à la compilation (`tsc --noEmit` passe), ils ne se révèlent qu'à l'exécution — les garder en tête pour chaque nouveau module de la Phase 1.

## Phase 1 — Modules métier cœur (MVP point de vente)

Ordre suggéré, chaque module = controller + service + DTOs, en s'appuyant sur `db.orm.public.<Model>` :

1. **Organizations / Stores** — CRUD minimal (souvent un seul tenant au départ). *Pas encore fait — l'org/store par défaut du seed suffit pour l'instant.*
2. [x] **Users / Roles** — `src/users/` (CRUD utilisateur, assignation/révocation de rôle, reset de mot de passe) + `src/users/roles.controller.ts` (`GET /api/roles`, catalogue en lecture seule). Un admin peut désormais créer un compte caissier avec `roles: ["CASHIER"]` dès la création, sans toucher à la base. Testé de bout en bout le 2026-09-01 (voir PROGRESS.md), y compris la vérification RBAC croisée : un compte `CASHIER` fraîchement créé se voit refuser `POST /categories` (403) mais autoriser `GET /products` (200) — la même logique de permission que l'admin, cohérente pour tout nouvel utilisateur.
3. [x] **Catalogue** — `Category`, `Brand`, `Product` : CRUD complet + `GET /products?search=` + `GET /products/code/:code` (lookup SKU/code-barres pour la caisse). Testé de bout en bout le 2026-08-31 (voir PROGRESS.md). `ProductBarcode` (codes-barres multiples) et `ProductPrice` (prix par magasin) **restent à faire** — le lookup actuel ne couvre que le SKU exact, pas encore une table de codes-barres dédiée.
4. [x] **Stock** — `Stock` (quantité par magasin/produit) + `StockMovement` (ledger append-only). `POST /api/stock/movements` est le seul point d'entrée censé faire varier une quantité (transaction DB atomique : lecture du stock courant, calcul, upsert `Stock`, insertion `StockMovement`). Garde-fous testés : stock insuffisant refusé (400), quantité négative refusée pour les types à sens fixe, `INVENTORY_CORRECTION` accepte un delta signé. `StockService` exporté par `StockModule` pour être appelé directement par les futurs modules Vente/Achat plutôt que de dupliquer la logique. Testé de bout en bout le 2026-08-31 (voir PROGRESS.md).
5. [x] **Vente / Caisse** — `CashRegister` (CRUD léger) + `CashierSession` (ouvrir/clôturer, une seule session `OPEN` par caisse à la fois) + `CashMovement` (ledger, mouvements manuels + `CASH_SALE` automatique) + `Sale`/`SaleItem`/`Order`/`OrderItem`/`Payment`. `POST /api/sales` est LE flux transactionnel critique : une seule transaction DB crée `Order` + `OrderItem[]` + `Sale` + `SaleItem[]` + décrémente le stock via `StockService.recordMovement(..., tx)` + crée `Payment[]` + `CashMovement` (`CASH_SALE`) si paiement cash — tout ou rien. `POST /api/cash-sessions/:id/close` recalcule les totaux (ventes, encaissements, sorties) depuis le ledger `CashMovement`/`Sale` plutôt que depuis un compteur incrémental, pour éviter toute dérive. Testé de bout en bout le 2026-08-31 (voir PROGRESS.md), y compris le rollback complet sur stock insuffisant en cours de vente.
6. [x] **Reçus** — `Receipt` généré automatiquement dans la même transaction que chaque vente (`SalesService.create()`), `GET /api/receipts/:id` et `GET /api/receipts/by-order/:orderId` pour la consultation. Pas d'impression/PDF (`pdfUrl` reste `null` pour l'instant) — a minima en base comme prévu.

### Limites connues du module Vente (V1)

- **Pas de prix par magasin** (`ProductPrice` pas encore branché) : le caissier/le client fournit `unitPrice` explicitement à chaque ligne de vente. À corriger dès que le catalogue expose les prix par magasin.
- **Un seul type de remise** : `discountAmount` par ligne, en montant absolu — pas de remise en pourcentage ni de remise globale sur la vente.
- **Pas d'annulation/remboursement** : `Sale.status`, `PaymentStatus.REFUNDED`, `CashMovementType.CASH_REFUND` existent dans le contrat mais aucun endpoint ne les pilote encore.
- **Référence générée côté app** (`generateReference()`, `src/common/reference.ts`), pas garantie unique sous forte concurrence (repose sur la contrainte `@unique` en base en dernier recours) — largement suffisant à l'échelle d'une caisse, à revisiter si univers multi-caisses à très fort débit.

### Paiements mobile money — providers simulés en attendant les identifiants (2026-09-01)

`src/payments/` introduit une abstraction `PaymentProvider` (`initiate(...) → { status, providerRef, failureReason }`) résolue par méthode via `PaymentProviderRegistry` :
- `CashProvider` — confirmation immédiate, inchangé par rapport à avant.
- `FakeMobileMoneyProvider` — couvre `MTN_MOMO`, `AIRTEL_MONEY`, `CARD`, `BANK_TRANSFER`, `OTHER` en attendant les vrais identifiants opérateur. Confirme toujours, sauf `forceFailure: true` explicite dans la requête (utile pour tester le chemin d'échec côté client Electron). `providerRef` toujours préfixé `FAKE-` — **ne jamais confondre avec une vraie transaction** une fois de vrais paiements en production (filtrer sur ce préfixe pour les rapports/l'audit).

**Point de branchement pour les vrais opérateurs** : écrire `MtnMomoProvider`/`AirtelMoneyProvider` implémentant `PaymentProvider` (`src/payments/providers/payment-provider.interface.ts`), les enregistrer dans `PaymentProviderRegistry.resolve()`. **Aucun autre fichier à toucher** — `SalesService`, les DTOs, la base de données restent identiques.

**Décision d'architecture volontaire** : `SalesService.create()` appelle `initiatePayments()` (résout tous les providers, un seul appel réseau externe futur par paiement) **avant** d'ouvrir la transaction DB — jamais d'appel réseau externe à l'intérieur d'une transaction ouverte (mauvais pour le pool de connexions, et un vrai paiement mobile money prend plusieurs secondes le temps que le client confirme sur son téléphone). Si un paiement échoue, toute la vente est refusée (`422 PaymentFailedException`) avant même que la moindre ligne ne soit écrite — aucun état intermédiaire "vente à moitié payée".

**Ce que ça ne couvre pas encore** (à faire quand les vrais identifiants arrivent) : flux asynchrone réel (webhook de confirmation, polling de statut), un vrai paiement mobile money n'est jamais confirmé de façon synchrone dans la requête HTTP comme le simulateur le fait aujourd'hui — prévoir un état `PENDING` réellement tenu et un endpoint de confirmation quand ce jour arrive.

**Bug découvert et corrigé en testant ce module** : `ValidateBodyPipe` ne remontait pas les messages d'erreur `class-validator` des DTOs imbriqués (`@ValidateNested({ each: true })`, ex. un `payments[].method` invalide) — un 400 correct était renvoyé mais avec `"message": []` (vide), car `class-validator` range ces erreurs dans `error.children`, pas dans `error.constraints` du champ parent. Corrigé par un parcours récursif dans `src/common/pipes/validate-body.pipe.ts`. **Concerne tous les DTOs à tableau imbriqué de l'app** (pas seulement les ventes) — vérifier qu'un message clair remonte bien pour toute nouvelle DTO du même genre.

### Note d'implémentation — champs `Numeric`/`Decimal`

Les colonnes `Numeric(P, S)` du contrat (prix, quantités, taux) sont typées `Numeric<P, S>` côté ORM — une **chaîne brandée**, pas un `number`. Un `number` JS brut ne passe pas le type-check sur `.create()`/`.update()`. Convention adoptée : les DTOs restent en `number` (plus simple pour un client JSON), et le service convertit à la frontière avec `numeric<P, S>(value)` (`src/common/numeric.ts`). Utilisé dans `products.service.ts`, `stock.service.ts`, `cash-sessions.service.ts`, `sales.service.ts`.

### Note d'implémentation — composer des transactions entre services

`StockService.recordMovement(dto, tx?)` accepte un `tx` optionnel (`src/common/db-like.ts`, type `DbLike`) : sans lui, il ouvre sa propre transaction (usage direct via l'endpoint HTTP) ; avec lui, il participe à la transaction de l'appelant (c'est ainsi que `SalesService.create()` garantit que vente + décrément de stock sont atomiques). **Reproduire ce pattern** pour tout futur service qui doit composer ses écritures avec celles d'un autre (achats → réception qui alimente le stock, etc.) plutôt que d'ouvrir des transactions imbriquées ou dupliquer la logique.

### ⚠️ Piège infra rencontré — port PostgreSQL

Un PostgreSQL natif (service Windows, partagé avec d'autres projets) écoutait déjà sur le port `5432` standard. `docker-compose.yml` publiait aussi sur `5432` : le conteneur du projet démarrait "healthy" mais **l'app parlait en réalité à l'instance native** (aucune erreur — les deux bases acceptaient les mêmes identifiants). Corrigé en republiant le conteneur sur `5433` (`docker-compose.yml` + `DATABASE_URL`). Symptôme qui aurait dû alerter plus tôt : des tables `user`/`post` (étrangères au contrat) visibles en interrogeant la base — signe qu'elle est partagée avec un autre projet.

### ⚠️ Piège infra récurrent — forwarding de port cassé après veille/redémarrage Docker

Après une mise en veille de la machine (ou un redémarrage de Docker Desktop), le conteneur `superette-postgres` peut redevenir "healthy" côté Docker tout en refusant les connexions réelles depuis l'app (`CONTRACT.MARKER_READ_FAILED` / `Connection terminated unexpectedly` dans les logs NestJS), alors que `psql` **depuis l'intérieur du conteneur** fonctionne — c'est le forwarding de port Windows→WSL2→conteneur qui reste dans un état bancal, pas la base elle-même. **Symptôme observé une fois en session** (2026-09-01) : login qui renvoie 500 juste après une reprise de veille.

**Diagnostic rapide** : `Test-NetConnection -Port 5433` réussit (juste un SYN/ACK) mais une vraie requête SQL échoue → c'est ce piège, pas un problème de données.
**Correctif** : `docker compose down && docker compose up -d` (recrée le conteneur, force un forwarding propre) puis redémarrer le serveur Node. Les données survivent (volume Docker persistant) — aucune perte, juste un redémarrage réseau.

## Phase 1 — état global

Le MVP point de vente est fonctionnellement complet : auth, catalogue, stock, caisse/ventes, reçus, gestion des employés. Il ne manque que la gestion CRUD des organisations/magasins eux-mêmes (non bloquant, l'org/magasin par défaut du seed suffit pour une V1 mono-magasin). Prochaine étape naturelle : **Phase 2**, ou démarrage du client Electron en parallèle puisque le contrat d'API est maintenant stable sur l'essentiel du parcours caisse.

## Phase 2 — Modules étendus — ✅ complète (2026-09-02)

- [x] **Achats fournisseurs** (`src/suppliers/`, `src/purchasing/`) — `Supplier` (CRUD), `PurchaseOrder` (DRAFT → SUBMITTED → APPROVED → CANCELLED, montants calculés ligne par ligne), `GoodsReceipt` (réception réelle, refusée si le PO n'est pas `APPROVED`, alimente le stock via `StockService.recordMovement(..., tx)` dans la même transaction, marque le PO `RECEIVED`). *Simplification V1 assumée : pas de suivi `PARTIALLY_RECEIVED` — toute réception marque le PO entièrement reçu.*
- [x] **Ajustements de stock & inventaires** (`src/inventory/`) — `StockAdjustment` (créer en DRAFT avec `previousQuantity`/`newQuantity`/`difference` snapshotés, puis `POST /:id/apply` qui applique réellement la correction via `StockService` — DRAFT→APPLIED en une étape, pas de palier SUBMITTED/APPROVED séparé). `InventoryCount` (créer avec `expectedQty` snapshoté depuis le stock courant + `countedQty` saisi, puis `POST /:id/approve` qui applique les écarts via `StockMovement` type `INVENTORY_CORRECTION`).
- [x] **Clients & livraison** (`src/customers/`, `src/delivery/`) — `Customer` + `CustomerAddress` (CRUD complet). `Delivery` **n'est pas un flux de commande autonome** : elle est créée automatiquement par `SalesService.create()` quand `fulfillment: "DELIVERY"` est passé sur une vente (le client paie en caisse, la livraison suit) — pas encore de commande web/téléphone sans passage caisse (voir limite ci-dessous). Cycle de statut `PENDING → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED/FAILED/CANCELLED`, historique dans `DeliveryStatusHistory`, transition bloquée une fois un statut terminal atteint.
- [x] **Paiements mobile money** — fait en amont (voir entrée `src/payments/` plus haut), simulés en attendant les identifiants MTN/Airtel réels.
- [x] **`AuditLog`** (`src/audit/`, module `@Global()`) — instrumentation **ciblée**, pas un intercepteur générique sur toutes les routes : `AuditService.log(...)` appelé explicitement après succès (jamais depuis l'intérieur d'une transaction, pour que le journal reflète ce qui s'est réellement passé) aux points sensibles déjà câblés : `LOGIN` (AuthService), `OPEN_SESSION`/`CLOSE_SESSION` (CashSessionsService), `APPROVE` sur achats et inventaires, `STOCK_ADJUSTMENT` appliqué. `GET /api/audit-logs` (filtrable `userId`/`storeId`/`action`/`resource`). Un intercepteur générique capturant automatiquement chaque requête reste possible plus tard si le besoin se confirme — pas fait ici, volontairement.
- [x] **Rapports** (`src/reports/`) — `GET /api/reports/sales-summary`, `/stock-value` (valorisation au coût d'achat), `/top-products` — agrégés en JS après un fetch ciblé (même pattern que `CashSessionsService.close()`), adéquat à l'échelle d'une superette ; à revisiter avec de l'agrégation SQL si le volume de données grossit significativement.

### Limites connues de la Phase 2 (documentées, pas des bugs)

- Pas de commande client autonome (web/téléphone) sans passage en caisse — la livraison s'attache toujours à une vente POS payée. À ajouter en Phase 3 si la superette a besoin de recevoir des commandes à distance.
- `PurchaseOrderStatus.PARTIALLY_RECEIVED` existe dans le contrat mais n'est jamais posé — toute réception (même partielle en quantité) marque le PO `RECEIVED`.
- `StockAdjustment`/`InventoryCount` sautent les paliers `SUBMITTED` intermédiaires du contrat (`DRAFT` → directement `APPLIED`/`APPROVED`) — un seul rôle crée ET applique pour l'instant, pas de séparation demandeur/approbateur.
- Rapports non exportables (`REPORTS:EXPORT`/`PRINT` seedés mais aucun endpoint CSV/PDF).

## Phase 3 — Qualité, exploitation

- [ ] Tests d'intégration Jest/Supertest sur chaque module (le tooling est déjà en dépendance, aucun test n'existe encore).
- [ ] `npm audit` — 14 vulnérabilités signalées à l'installation (5 modérées, 9 hautes) : à trier avant mise en production.
- [ ] Pipeline CI (lint + type-check + tests) avant merge sur `main`.
- [ ] Décision de déploiement : Composer/Prisma Cloud (déjà scaffoldé dans `module.ts`/`service.ts`) vs. hébergement classique — à trancher selon les besoins de synchronisation multi-magasin.

## Intégration avec l'application Electron (parallèle)

Points de contrat à stabiliser tôt pour ne pas bloquer le développement du client :

- [x] **Contrat d'API** : préfixe `/api` actif (`API_PREFIX` dans `.env`). Surface complète au 2026-09-02 : auth, users/roles, catalogue (categories/brands/products), stock, caisse/ventes, reçus, fournisseurs/achats, ajustements/inventaires, clients/livraison, audit-logs, reports — voir `docs/postman/` pour la liste exhaustive des routes testées.
- [x] **Client démarré** — `Projets/app-desktop/superette/` (dossier parent), Electron Forge + React + Vite + TypeScript + Tailwind + shadcn/ui. Voir son propre `docs/` pour l'avancement côté frontend.
- [ ] **Format des réponses & pagination** standard (ex. `{ data, meta }`) pour que le client React puisse construire des hooks génériques.
- [ ] **Authentification côté client** : flux de login + stockage sécurisé du token dans le process principal Electron (`safeStorage`), refresh transparent. Le backend renvoie déjà `{ accessToken, refreshToken, user }` sur `/api/auth/login`.
- [ ] **Mode offline/dégradé** : les IDs `Uuid` générés dès la création (pas d'auto-incrément) permettent en théorie une création côté client avant confirmation serveur — à confirmer si un mode caisse hors-ligne est requis.
- [ ] **OpenAPI/Swagger** (`@nestjs/swagger`, pas encore installé) — générer une doc d'API consommable pour accélérer le développement du client, éventuellement génération de types TypeScript partagés.

## Décisions déjà tranchées

- **Identifiant de connexion : email** (seul champ requis+unique du modèle `User` ; `phone` reste optionnel). Login par téléphone ajoutable plus tard sans changement de schéma si besoin.
- **Permissions résolues en base à chaque requête**, pas embarquées dans le JWT — cohérence immédiate si un rôle est modifié, au prix d'une requête DB par route protégée par `@RequirePermission`.

## Décisions en attente (à trancher avec l'utilisateur)

- Multi-organisation dès le départ ou un seul tenant pour la V1 ?
- Mode de déploiement cible (Prisma Cloud/Composer vs VPS classique) ?
- Politique de suppression du champ `passwordHash` dans les réponses : centraliser via un `select` systématique ou un intercepteur de sérialisation ?
