# Journal d'avancement — Supermarket Backend

> Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour le contexte technique et [ROADMAP.md](./ROADMAP.md) pour les prochaines étapes.

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
