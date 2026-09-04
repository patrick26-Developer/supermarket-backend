#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/6494cd54351d290bff932426f74d5ddd6b909066cfc8de10b8e32aefe77583ea/contract';
import startContract from '../../snapshots/6494cd54351d290bff932426f74d5ddd6b909066cfc8de10b8e32aefe77583ea/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a5af540b9abdd4df23c14a4df7632a45d594a266db46bb881c92b32afe800e0b/contract';
import endContract from '../../snapshots/a5af540b9abdd4df23c14a4df7632a45d594a266db46bb881c92b32afe800e0b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('avatarUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
