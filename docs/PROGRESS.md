# Journal d'avancement — Supermarket Backend

> Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour le contexte technique et [ROADMAP.md](./ROADMAP.md) pour les prochaines étapes.

## 2026-09-02 — Phase 2 complète : achats, inventaires, clients/livraison, audit, rapports

**Six nouveaux modules livrés en une session** (`src/suppliers/`, `src/purchasing/`, `src/inventory/`, `src/customers/`, `src/delivery/`, `src/audit/`, `src/reports/`), tous suivant les patterns déjà établis (transaction + `StockService.recordMovement(..., tx)` pour tout ce qui touche au stock, `ValidateBodyPipe` pour la validation, permissions déjà seedées le 2026-08-31 — **aucune modification du seed nécessaire**, le catalogue de rôles avait été conçu en anticipant ces ressources).

**Achats fournisseurs** — `Supplier` (CRUD) → `PurchaseOrder` (DRAFT→SUBMITTED→APPROVED, montants calculés) → `GoodsReceipt` (refusée tant que le PO n'est pas `APPROVED`, incrémente le stock dans la même transaction que la réception, marque le PO `RECEIVED`).

**Ajustements & inventaires** — `StockAdjustment` (snapshote `previousQuantity`/`newQuantity` à la création, `POST /:id/apply` applique réellement la correction). `InventoryCount` (snapshote `expectedQty` depuis le stock courant, `POST /:id/approve` applique les écarts via `StockMovement` type `INVENTORY_CORRECTION`).

**Clients & livraison** — `Customer`/`CustomerAddress` en CRUD classique. Décision d'architecture : plutôt que d'inventer un flux de commande client autonome (web/téléphone), `Delivery` est créée **automatiquement par `SalesService.create()`** quand la requête porte `fulfillment: "DELIVERY"` — cohérent avec un magasin physique où le client paie en caisse puis se fait livrer. `CreateSaleDto` étendu (`fulfillment?`, `deliveryAddressId?`, `deliveryFee?`), non-breaking (défaut `IN_STORE`, frais 0). Cycle `PENDING→ASSIGNED→PICKED_UP→IN_TRANSIT→DELIVERED/FAILED/CANCELLED` avec historique, transition bloquée une fois un statut terminal atteint, `failureReason` obligatoire sur `FAILED`.

**Audit** — `AuditService` (module `@Global()`) appelé explicitement (pas d'intercepteur générique) après succès aux points sensibles : login, ouverture/fermeture de caisse, approbation d'achat/inventaire, ajustement de stock appliqué. Toujours appelé **après** la transaction, jamais depuis l'intérieur — le journal reflète ce qui s'est réellement passé.

**Rapports** — `sales-summary`, `stock-value` (valorisation au coût d'achat), `top-products`, agrégés en JS après un fetch ciblé (même approche que la clôture de caisse).

**Un piège de typage rencontré** : `.include("items", (i) => i)` (identité, sans `.select()`) — qui fonctionnait pour un simple retour au client (`sales.service.ts`, `purchase-orders.service.ts`) — perd le typage des champs (`unknown`) dès qu'on **lit** ces champs pour de la logique métier (`stock-adjustments.service.ts`, `inventory-counts.service.ts` doivent lire `item.productId`/`item.difference` pour appliquer les mouvements de stock). Corrigé en explicitant `.select(...)` dans le callback d'`include`. Retenir : dès qu'un include imbriqué est *consommé* par du code (pas juste renvoyé), lui donner un `.select()` explicite.

**Testé de bout en bout** (contre le conteneur Docker, scénario complet enchaîné) :

| Étape | Résultat |
|---|---|
| Réception avant approbation du PO | 400, refusé |
| Submit → Approve → Réception (50kg riz) | stock 108 → 158 ✓, PO passé `RECEIVED` |
| Ajustement de stock (casse -5) créé puis appliqué | stock 158 → 153 ✓ |
| Inventaire (compté 150) créé puis approuvé | stock 153 → 150 ✓ (écart -3 appliqué) |
| Client + adresse créés | OK |
| Vente avec `fulfillment: DELIVERY`, frais 1500 | total = 8000 (marchandise) + 1500 = 9500 ✓, `Delivery` créée automatiquement en `PENDING` |
| Assign → PICKED_UP → IN_TRANSIT → DELIVERED | historique de 4 entrées, chaque timestamp posé correctement |
| Transition après `DELIVERED` | 400, statut terminal respecté |
| `FAILED` sans `failureReason` | 400 |
| Fournisseur code dupliqué | 409 |
| `GET /api/audit-logs` | 5 entrées cohérentes (LOGIN, OPEN_SESSION, 2×APPROVE, STOCK_ADJUSTMENT) avec description lisible |
| `GET /api/reports/sales-summary` | revenu total cohérent avec les ventes créées pendant la session |
| `GET /api/reports/stock-value` | valorisation = quantité réelle × coût d'achat, vérifiée à la main |
| `GET /api/reports/top-products` | exclut correctement les frais de livraison (comptés au niveau vente, pas ligne produit) |

**Phase 2 de la roadmap marquée complète.** Note : `docs/postman/` et `scripts/test-api.ps1` n'ont pas encore été étendus avec les 6 nouveaux modules (testés en HTTP direct pendant cette session, voir tableau ci-dessus) — à faire en petit complément si des tests manuels réguliers sur ces routes sont utiles. Prochaine étape : démarrage du client Electron (`Projets/app-desktop/superette/`).

## 2026-09-01 (suite) — Paiements mobile money simulés (providers)

**Contexte** : pas encore d'identifiants MTN/Airtel Money. Décision prise avec l'utilisateur avant codage (voir échange) : ne pas construire l'infrastructure asynchrone complète (webhooks, vérification de signature) contre une API qu'on ne connaît pas encore — probablement à refaire une fois la vraie doc en main. À la place : un pattern adaptateur qui isole totalement la simulation, pour un remplacement à coût zéro ailleurs dans le code le jour venu.

**Livré — `src/payments/`** : interface `PaymentProvider` (`initiate() → {status, providerRef, failureReason}`), `CashProvider` (confirmation immédiate, comportement CASH inchangé), `FakeMobileMoneyProvider` (couvre MTN_MOMO/AIRTEL_MONEY/CARD/BANK_TRANSFER/OTHER — confirme toujours sauf `forceFailure: true` explicite dans la requête), `PaymentProviderRegistry` (résolution par méthode, seul point à toucher pour brancher un vrai provider plus tard). `providerRef` toujours préfixé `FAKE-` pour ne jamais confondre avec une vraie transaction.

**`SalesService.create()` modifié** : les paiements sont désormais initiés (`initiatePayments()`) **avant** l'ouverture de la transaction DB plutôt que d'être créés directement dedans — anticipe le jour où un vrai provider fera un appel réseau externe (qui ne doit jamais bloquer une transaction ouverte). Un paiement refusé fait échouer toute la vente (`422`) avant la moindre écriture — aucun état intermédiaire.

**Trois bugs découverts en testant et corrigés** :
1. `ValidateBodyPipe` ne remontait pas les messages de validation des DTOs imbriqués dans un tableau (`@ValidateNested({ each: true })`) — un `payments[].method` invalide renvoyait bien 400 mais avec `message: []` vide, `class-validator` rangeant ces erreurs dans `error.children` plutôt que `error.constraints`. Corrigé par un parcours récursif. Ce bug touchait potentiellement tous les DTOs à tableau imbriqué de l'app, pas seulement les ventes.
2. `UsersService.update()` ne vérifiait pas l'unicité du téléphone avant d'écrire (contrairement à `create()`) — un doublon remontait en 500 brut (contrainte Postgres non interceptée) au lieu d'un 409 propre. Corrigé en généralisant `assertUnique()` pour accepter un `excludingId` (même pattern que Category/Brand/Product) et en l'appelant aussi dans `update()`.
3. `scripts/test-api.ps1` sautait silencieusement toute la section Ventes/Reçus si une session de caisse restait ouverte d'un run précédent interrompu (le `POST .../open` échouait en 409, `$session` valait `$null`, et tout le bloc `if ($session) {...}` était ignoré sans message d'erreur visible). Le script nettoie désormais automatiquement toute session restée ouverte sur la caisse de test avant d'en ouvrir une nouvelle — rejouable sans intervention manuelle.

**Testé de bout en bout** (contre le conteneur Docker) :

| Scénario | Résultat |
|---|---|
| Vente CASH | strictement identique à avant (non-régression confirmée) |
| Vente MTN_MOMO (succès simulé) | `Payment.status: CONFIRMED`, `providerRef: FAKE-...`, `transactionRef` client conservé |
| Vente AIRTEL_MONEY avec `forceFailure: true` | 422, message clair, **zéro trace en base** (aucun `Payment`, aucune ligne d'`Order`/`Sale`, stock inchangé) — l'échec survient avant l'ouverture de la transaction |
| Méthode de paiement inconnue (`"BITCOIN"`) | 400 avec message de validation clair (après le correctif) |
| Item de vente invalide imbriqué (quantité négative) | 400 avec message de validation clair (après le correctif) |
| `PUT /api/users/:id` avec un téléphone déjà pris | 409 propre (après le correctif, au lieu du 500 initial) |

**Résultat final** : `scripts/test-api.ps1` — 65 tests, tous conformes, zéro 500 inattendu.

## 2026-09-01 — Module Utilisateurs/Rôles + Reçus (Phase 1.2 et 1.6) — MVP Phase 1 complet

**Incident résolu en début de session** : après une pause/veille de la machine, `POST /api/auth/login` renvoyait 500. Diagnostic : le conteneur Docker Postgres redevenu "healthy" refusait en réalité les connexions réelles (forwarding de port Windows→WSL2 resté bancal après le redémarrage du conteneur) — `psql` depuis l'intérieur du conteneur fonctionnait, mais toute connexion externe (Node `pg`, l'app) échouait avec `Connection terminated unexpectedly`. Résolu par `docker compose down && up` (recrée le conteneur, force un forwarding propre) ; données vérifiées intactes ensuite (volume Docker persistant). Documenté dans `docs/ROADMAP.md` comme piège récurrent à surveiller.

**Livré — `src/users/`** : CRUD utilisateur complet (`POST/GET/PUT /api/users`, `GET /api/users/:id`), assignation/révocation de rôle (`POST /api/users/:id/roles`, `DELETE /api/users/:id/roles/:roleCode`), reset de mot de passe admin (`POST /api/users/:id/reset-password`), filtre par statut. `roles.controller.ts` expose `GET /api/roles` (catalogue en lecture seule des 11 rôles système). Ancien `src/users.controller.ts`/`users.service.ts` (plats, un seul `findAll`) retirés et remplacés ; `PrismaService.listUsers()` supprimé (logique déplacée dans le nouveau service).

**Livré — `src/receipts/`** : `Receipt` généré automatiquement dans la transaction de `SalesService.create()` (aucune action manuelle requise), consultable via `GET /api/receipts/:id` et `GET /api/receipts/by-order/:orderId`.

**Testé de bout en bout** (contre le conteneur Docker, après résolution de l'incident) :

| Scénario | Résultat |
|---|---|
| `GET /api/roles` | les 11 rôles système, id réels |
| Créer un utilisateur "Marie" avec `roles: ["CASHIER"]` | rôle imbriqué dans la réponse (`.include()` à deux niveaux : `User → UserRole → Role`) |
| **Login avec le nouveau compte** | fonctionne immédiatement — le compte est utilisable sans étape supplémentaire |
| Marie tente `POST /api/categories` | 403 (`CASHIER` n'a pas `CATEGORIES:CREATE`) — RBAC appliqué à un compte fraîchement créé, pas seulement à l'admin du seed |
| Marie fait `GET /api/products` | 200 (`CASHIER` a `PRODUCTS:READ`) |
| Créer un utilisateur avec un email déjà pris | 409 |
| `PUT /api/users/:id` (téléphone) | mis à jour |
| `POST /api/users/:id/reset-password` | `passwordChangedAt` mis à jour |
| `DELETE /api/users/:id/roles/CASHIER` | rôle retiré, `roles: []` dans la réponse |
| `POST /api/users` sans password/firstName/lastName | 400, messages de validation détaillés |
| Vente complète → `GET /api/receipts/by-order/:orderId` | reçu retrouvé, montants cohérents avec la vente |

**État Phase 1 (MVP point de vente)** : complet à l'exception du CRUD Organizations/Stores (non bloquant). Voir `docs/ROADMAP.md` § *Phase 1 — état global*.

## 2026-08-31 (suite 4) — Module Vente/Caisse (Phase 1.5)

**Livré** : `src/cash/` (`CashRegister` CRUD léger, `CashierSession` ouvrir/fermer/mouvements manuels) et `src/sales/` (`POST /api/sales`, le cœur transactionnel du POS).

Refactor préalable : `StockService.recordMovement()` accepte désormais un `tx` optionnel (`src/common/db-like.ts`, type `DbLike` — sous-ensemble structurel `{ orm }` commun à `db` et à tout `tx` de transaction) pour pouvoir s'exécuter DANS la transaction d'un appelant plutôt que d'en ouvrir une nouvelle. C'est ce qui permet à `SalesService.create()` de garantir que la vente entière (commande + lignes + décrément de stock + paiements + mouvement de caisse) est atomique — tout échoue ensemble ou rien.

`POST /api/sales` en une seule transaction DB : `Order` + `OrderItem[]` (calcul ligne par ligne : sous-total, remise, TVA depuis `Product.taxRate`) → `Sale` + `SaleItem[]` → décrément de stock par ligne via `StockService.recordMovement(..., tx)` → `Payment[]` (un ou plusieurs modes) → `CashMovement` type `CASH_SALE` si paiement cash. Vérifie en amont que la session de caisse est `OPEN` et que la somme des paiements correspond au total (tolérance 1 centime).

`POST /api/cash-sessions/:id/close` recalcule les totaux de façon **autoritative depuis le ledger** (`CashMovement` + `Sale` de la session), pas depuis un compteur incrémental — évite toute dérive silencieuse.

**Testé de bout en bout** (contre le conteneur Docker, scénario complet) :

| Étape | Résultat |
|---|---|
| Créer une caisse | OK |
| Ouvrir une session (fond de caisse 5000) | `expectedAmount: 5000.00` |
| Ouvrir une 2ᵉ session sur la même caisse | 409 Conflict |
| Vente 5×Riz à 4000 (paiement CASH 20000) | vente créée, stock 60→55 |
| `GET /sales/:id` | items + payments correctement imbriqués (`.include()`) |
| Vente avec paiement ≠ total (100 au lieu de 4000) | 400, message explicite |
| Vente avec quantité (9999) dépassant le stock disponible (53) | 400 — **et le stock n'a pas bougé** (rollback transactionnel complet vérifié, y compris l'Order/Sale déjà construits en mémoire avant l'échec) |
| Mouvement manuel `EXPENSE` -1000 | OK |
| Clôture session, montant compté 32000 | `expectedCash: 32000.00`, `actualCash: 32000.00`, `difference: 0.00` — calcul vérifié à la main : 5000 (ouverture) + 20000 + 8000 (2 ventes cash) − 1000 (dépense) = 32000 ✓ |
| Vente tentée sur une session fermée | 400 |

**Limites connues (documentées dans ROADMAP.md)** : pas de prix par magasin (unitPrice fourni par le client), pas d'annulation/remboursement, remise en montant absolu uniquement.

## 2026-08-31 (suite 3) — Module Stock (Phase 1.4) + bascule vers PostgreSQL Docker

### Découverte : l'app ne parlait pas au conteneur Docker

En cherchant un `storeId` réel pour tester le module Stock, `docker exec superette-postgres psql ... "SELECT * FROM pg_tables WHERE schemaname='public'"` a renvoyé **0 table** — alors que l'API fonctionnait et renvoyait de vraies données. Investigation : un service Windows **PostgreSQL 17 natif** (`postgresql-x64-17`), déjà en écoute sur le port `5432` avant même que Docker s'y branche, interceptait toutes les connexions de l'app (`DATABASE_URL` pointait sur `localhost:5432`). Le conteneur Docker (Postgres 16 Alpine) tournait "healthy" mais **n'a jamais reçu une seule requête** de ce projet — toutes les données du jour (catégories, marques, produits) vivaient en fait dans l'instance native, une instance **partagée avec d'autres projets locaux** (confirmé par la présence de tables `user`/`post`, étrangères à notre contrat).

**Décision (validée avec l'utilisateur)** : basculer proprement vers le conteneur Docker plutôt que de continuer sur l'instance partagée, sans toucher au service Windows natif (pour ne pas risquer de casser d'autres projets qui en dépendent peut-être). Solution retenue : republier le conteneur sur le port **5433** au lieu de 5432 (`docker-compose.yml` + `DATABASE_URL` dans `.env`/`.env.example`), ce qui élimine le conflit sans dépendre de l'état du service natif.

**Actions** : `docker compose down && docker compose up -d` (recréation avec le nouveau port), connexion directe vérifiée avec `pg` (Node) pour confirmer qu'on parle bien à Postgres 16 (Docker) et non 17 (natif), `npx prisma db init` (schéma appliqué dans le conteneur, vide au départ), `npm run seed` (99 permissions / 11 rôles / 402 habilitations / admin), `npx prisma db verify` → `ok: true`. Serveur redémarré et retesté de bout en bout contre la bonne base — tout fonctionne à l'identique.

### Module Stock (`src/stock/`)

**Livré** : `Stock` (quantité par magasin/produit) + `StockMovement` (ledger append-only). `POST /api/stock/movements` est le seul point d'écriture, dans une **transaction DB** (`db.transaction`) : lit le stock courant, calcule la nouvelle quantité selon le sens du type de mouvement (`STOCK_MOVEMENT_DIRECTION` — 8 types à sens fixe + `INVENTORY_CORRECTION` à delta signé), refuse si le résultat serait négatif, upsert `Stock`, insère `StockMovement`. `StockService` est exporté par `StockModule` pour que les futurs modules Vente/Achat l'appellent directement plutôt que de dupliquer la logique de variation de stock.

Endpoints : `GET /api/stock` (filtrable `storeId`/`productId`), `GET /api/stock/:storeId/:productId`, `GET /api/stock/movements` (historique), `POST /api/stock/movements`.

**Testé de bout en bout** (contre le vrai conteneur Docker) :

| Scénario | Résultat |
|---|---|
| Réception fournisseur `PURCHASE_RECEIPT` +100 sur stock vide | `previousQty: 0 → resultingQty: 100` |
| Vente `SALE` -30 | `100 → 70` |
| Vente de 1000 (stock insuffisant) | 400, message explicite |
| `SALE` avec quantité négative (-5) | 400, "la quantité doit être strictement positive" |
| `INVENTORY_CORRECTION` avec delta signé -10 | `70 → 60`, accepté |
| `GET /stock/movements?productId=` | historique complet, plus récent en premier |
| `GET /stock/:storeId/:productId` | `quantity: 60`, `availableQty: 60` cohérents |

### Autre

Outillage de test livré à l'utilisateur : commandes PowerShell (`Invoke-RestMethod`) prêtes à copier-coller pour tester l'API sans Postman, en plus de la collection Postman existante. Confirmation que l'utilisateur teste aussi avec son propre outil local "DevDesk" (API Tester) — fonctionne normalement avec l'API (401 attendu sans header `Authorization`, comportement correct).

## 2026-08-31 (suite 2) — Module Catalogue (Phase 1.3 roadmap)

**Livré** : CRUD complet pour `Category`, `Brand`, `Product` (`src/catalog/`), protégé par `@RequirePermission` (déjà seedé pour tous les rôles). `GET /api/products?search=` (recherche par nom) et `GET /api/products/code/:code` (lookup code-barres → SKU, pensé pour la caisse) ajoutés. Contrôles d'unicité (slug/sku/nom) et de cohérence des FK (`categoryId`/`brandId` doivent exister) avant écriture.

**Un nouveau piège de type découvert** : les colonnes `Numeric(P, S)` du contrat (prix, quantités) sont typées côté ORM comme une chaîne brandée (`Numeric<P, S> = string & {...}`), pas `number` — passer un `number` brut à `.create()`/`.update()` est rejeté par `tsc`. Résolu avec un helper `numeric<P, S>(value: number)` (`src/common/numeric.ts`) qui centralise la conversion ; les DTOs restent en `number` pour rester simples côté client JSON. Documenté dans `docs/ROADMAP.md`.

**Testé de bout en bout** (serveur réel, DB réelle) : création catégorie/marque/produit en chaîne (avec FK), lecture avec les Decimal correctement formatés (`"300.00"`, `"18.00"`), recherche par nom, lookup par SKU (200 et 404), rejet 409 sur SKU dupliqué, rejet 400 sur champs requis manquants, 401 sans token, mise à jour, suppression avec vérification du comportement `onDelete: SetNull` (le produit garde `categoryId: null` après suppression de sa catégorie plutôt que d'échouer).

**Collection Postman** (`docs/postman/supermarket-backend.postman_collection.json` + `.postman_environment.json`) créée : Login/Refresh/Me avec capture automatique des tokens en variables de collection, puis Users et Catalogue (Categories/Brands/Products), Create capturant l'id créé pour enchaîner Update/Delete sans copier-coller manuel.

## 2026-08-31 (suite) — Module d'authentification JWT + RBAC (Phase 0 roadmap)

**Livré** : `AuthModule` complet — login email/mot de passe, access token (15 min) + refresh token (30 jours) via `@nestjs/jwt`, stratégie Passport (`JwtAccessStrategy`), guard global (`JwtAuthGuard`) avec bypass `@Public()`, guard RBAC générique (`PermissionsGuard` + `@RequirePermission(resource, action)`) résolu en base contre `Role`/`RolePermission`/`Permission`. `PrismaModule` global créé pour rendre `PrismaService`/`db` injectable partout. Préfixe `/api` activé (`/` reste public, hors préfixe, en health-check). Script `src/prisma/seed.ts` réécrit : organisation + magasin par défaut, 99 permissions (catalogue `RESOURCE_ACTIONS`), 11 rôles système, 402 habilitations rôle→permission (point de départ à affiner), compte admin initial (`npm run seed`).

**Trois bugs d'exécution découverts et corrigés** (invisibles à `tsc --noEmit`, qui passait sans erreur à chaque fois — seul un test HTTP réel les a révélés) :

1. **Injection par type seul → `undefined` à l'exécution.** Ce projet transpile avec esbuild (tsx en dev, esbuild pour le build), qui n'émet pas `design:paramtypes`. `constructor(private readonly x: Service)` ne reçoit rien. Le scaffold `create-prisma` avait déjà contourné ça avec `@Inject(Token)` explicite partout (`users.service.ts`) — convention que mes premiers fichiers `auth/*` n'avaient pas suivie. Corrigé en ajoutant `@Inject()` explicite sur `JwtAccessStrategy`, `JwtAuthGuard`, `PermissionsGuard`, `AuthService`, `AuthController`.
2. **`@Body() dto: LoginDto` sans réflexion de type = validation silencieusement sautée.** Même cause racine : `ValidationPipe` déduit le DTO à valider via le type réfléchi du paramètre ; sans métadonnée il retombe sur `Object` et laisse passer le payload tel quel (aucune erreur — `POST /auth/login` sans `password` plantait en 500 dans `bcrypt.compare(undefined, ...)` au lieu de renvoyer un 400 propre). Corrigé avec un pipe dédié, `ValidateBodyPipe` (`src/common/pipes/validate-body.pipe.ts`), qui prend la classe DTO explicitement et n'a donc besoin d'aucune métadonnée réfléchie. Appliqué sur `login`/`refresh` ; **convention à répéter sur tout futur endpoint validé par DTO**.
3. **`new Date()` sur une colonne `temporal.updatedAt()`/`DateTime` → `RUNTIME.ENCODE_FAILED` à l'exécution.** Le codec `pg/timestamptz-temporal@1` attend un `Temporal.Instant`, pas un `Date` natif JS. Corrigé dans `AuthService.login` (mise à jour de `lastLoginAt`) avec `Temporal.Now.instant()` (`import { Temporal } from "temporal-polyfill"`). Le script de seed n'a pas ce problème : il omet volontairement `createdAt`/`updatedAt` des `create()` pour laisser les défauts DB s'appliquer.

Ces trois pièges sont documentés dans `docs/ROADMAP.md` § *Gotcha toolchain* pour ne pas les redécouvrir à chaque nouveau module.

**Validation de bout en bout** (serveur réel, base réelle, requêtes HTTP réelles — pas de mocks) :

| Test | Résultat |
|---|---|
| `GET /` (public, hors préfixe) | 200 |
| `GET /api/users` sans token | 401 |
| `GET /api/users` avec token invalide | 401 |
| `POST /api/auth/login` mauvais mot de passe | 401, message FR |
| `POST /api/auth/login` sans `password` | 400, erreurs `class-validator` |
| `POST /api/auth/login` email invalide | 400 |
| `POST /api/auth/login` champ non attendu (`forbidNonWhitelisted`) | 400 |
| `POST /api/auth/login` identifiants corrects | 200, `{ accessToken, refreshToken, user }` |
| `GET /api/auth/me` avec token | 200, payload JWT |
| `GET /api/users` avec token (SUPER_ADMIN a `USERS:READ`) | 200, liste (sans `passwordHash`) |
| `POST /api/auth/refresh` avec refresh token valide | 200, nouvelle paire de tokens |
| `POST /api/auth/refresh` avec token invalide | 401 |

**État** : Phase 0 de la roadmap terminée et testée en conditions réelles. Prochaine étape : Phase 1 (catalogue, stock, vente/caisse).

## 2026-08-31 — Remise en état du backend et validation "fonctionnel de bout en bout"

**Contexte** : reprise du projet généré par `create-prisma`, contrat de données déjà très avancé (41 modèles) mais code applicatif minimal et cassé après une réorganisation des migrations.

### Diagnostic initial

- Working tree avec des changements non commités : ancienne migration + snapshot supprimés, `contract.prisma`/`.json`/`.d.ts` modifiés, `src/prisma/seed.ts` et `src/prisma/users.ts` supprimés, `docker-compose.yml` ajouté (non suivi).
- **Bug bloquant** : [`src/prisma.service.ts`](../src/prisma.service.ts) importait `./prisma/users` (fichier supprimé) → build cassé.
- Docker Desktop installé mais arrêté ; aucune base locale démarrée.
- Aucun fichier de suivi de projet (`.md`) hormis le `README.md` générique.

### Actions réalisées

1. **Dépendances** — `npm install` (941 packages, `postinstall` → `prisma skills sync` OK). `Node v24.7.0` vs `tsdown` qui demande `>=24.11` : simple warning `EBADENGINE`, sans impact observé.
2. **PostgreSQL local** — démarrage via `docker compose up -d` (`superette-postgres` healthy, `superette-pgadmin` up sur le port 5050).
3. **Contrat Prisma** — `prisma contract emit` : `contract.json`/`contract.d.ts` régénérés, hash `6494cd54…` cohérent avec la ref de dev déjà présente (`migrations/app/refs/db.json`).
4. **Vérification DB ↔ contrat** — `prisma db verify` : ✅ *"Database marker and schema match contract"*. La base locale (probablement initialisée lors d'une session précédente) est déjà à jour avec le contrat actuel — aucune donnée perdue, aucune migration destructive nécessaire.
5. **Baseline de migration** — le graphe de migrations sur disque était vide (l'ancienne migration `20260829T1123_init` avait été supprimée) alors que la ref `db` pointait déjà vers un hash réel. `prisma migration plan --name init` a généré la migration baseline [`migrations/app/20260831T1006_baseline/`](../migrations/app/20260831T1006_baseline/) (`null → 6494cd54…`), pour que le graphe de migrations reflète à nouveau l'état réel de la base. *(Cf. `prisma-8` skill, § "auto-baseline" / "retrofit a database that has no on-disk migrations".)*
6. **Correction du code cassé** — [`src/prisma.service.ts`](../src/prisma.service.ts) réécrit pour utiliser directement `db.orm.public.User` (le vrai modèle `User` du contrat) au lieu de l'ancien starter `./prisma/users` :
   ```ts
   listUsers(limit = 10) {
     return db.orm.public.User
       .select("id", "email", "firstName", "lastName", "status", "createdAt")
       .orderBy((u) => u.createdAt.desc())
       .limit(limit)
       .all();
   }
   ```
   (le mot de passe haché n'est volontairement jamais sélectionné).
7. **Type-check** — `npx tsc --noEmit` : ✅ aucune erreur.
8. **Test réel de bout en bout** — serveur démarré avec `npm run dev` :
   - `GET http://localhost:3000/` → `200 {"message":"hello from create-prisma + nest"}`
   - `GET http://localhost:3000/users` → `200 []` (table vide, requête DB réelle exécutée avec succès via Prisma Next → PostgreSQL)
   - Logs NestJS propres, aucune erreur au démarrage ni pendant les requêtes.
9. **`.env.example` recréé** (avait été supprimé), sans secrets réels, pour faciliter l'onboarding.
10. **Documentation** — création de `docs/ARCHITECTURE.md`, `docs/PROGRESS.md`, `docs/ROADMAP.md`.

### État vérifié à l'issue de cette session

| Élément | État |
|---|---|
| `npm install` | ✅ OK |
| PostgreSQL local (Docker) | ✅ up & healthy |
| Contrat Prisma ↔ base de données | ✅ synchronisés (`db verify` clean) |
| Graphe de migrations | ✅ baseline créée, cohérente avec la DB |
| Compilation TypeScript | ✅ sans erreur |
| Serveur NestJS (`npm run dev`) | ✅ démarre, répond, interroge la vraie DB |
| Endpoints existants | `GET /`, `GET /users` — tous deux testés en HTTP réel |
| Authentification | ❌ pas encore implémentée (dépendances installées, code absent) |
| CRUD métier (produits, ventes, stock, etc.) | ❌ pas encore implémenté (seul le contrat de données existe) |
| Seed des données initiales (admin, rôles) | ❌ script supprimé, à réécrire |

**Conclusion** : le socle technique (NestJS + Prisma Next + PostgreSQL) est **fonctionnel et validé de bout en bout**. Le travail restant est fonctionnel/applicatif (auth, modules métier), pas un problème d'infrastructure.

À faire ensuite → voir [ROADMAP.md](./ROADMAP.md).
