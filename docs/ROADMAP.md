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
2. **Users / Roles** — gestion des comptes employés depuis l'app desktop (un admin crée les caissiers). *Pas encore fait.*
3. [x] **Catalogue** — `Category`, `Brand`, `Product` : CRUD complet + `GET /products?search=` + `GET /products/code/:code` (lookup SKU/code-barres pour la caisse). Testé de bout en bout le 2026-08-31 (voir PROGRESS.md). `ProductBarcode` (codes-barres multiples) et `ProductPrice` (prix par magasin) **restent à faire** — le lookup actuel ne couvre que le SKU exact, pas encore une table de codes-barres dédiée.
4. **Stock** — `Stock` (quantité par magasin/produit), `StockMovement` en écriture append-only à chaque mouvement.
5. **Vente / Caisse** — `CashRegister`, `CashierSession` (ouverture/fermeture de caisse), `Sale`/`SaleItem`, `Payment` (au moins `CASH` pour commencer). C'est le flux transactionnel critique : à envelopper dans `db.transaction(...)` (débit stock + création vente + mouvement de caisse atomiques).
6. **Reçus** — génération `Receipt` a minima en base ; l'impression/PDF peut venir plus tard.

### Note d'implémentation — champs `Numeric`/`Decimal`

Les colonnes `Numeric(P, S)` du contrat (prix, quantités, taux) sont typées `Numeric<P, S>` côté ORM — une **chaîne brandée**, pas un `number`. Un `number` JS brut ne passe pas le type-check sur `.create()`/`.update()`. Convention adoptée : les DTOs restent en `number` (plus simple pour un client JSON), et le service convertit à la frontière avec `numeric<P, S>(value)` (`src/common/numeric.ts`). Exemple dans `products.service.ts`. À répéter pour `Stock`, `Sale`, `Payment`, etc.

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

- [x] **Contrat d'API** : préfixe `/api` actif (`API_PREFIX` dans `.env`). Routes actuelles : `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`, `GET /api/users`, `GET /` (health-check public, hors préfixe).
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
