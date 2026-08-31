# Journal d'avancement — Supermarket Backend

> Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour le contexte technique et [ROADMAP.md](./ROADMAP.md) pour les prochaines étapes.

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
