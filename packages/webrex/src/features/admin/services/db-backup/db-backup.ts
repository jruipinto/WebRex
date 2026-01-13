import { NoSqlDB } from "@core/database/no-sql-db.ts";
import { Backup } from './backup.model.ts';

export async function dbBackup(_req: Request, db: NoSqlDB) {
  const backup: Backup = {
    repl: (await db.repl.getMany()).result.map(({ value }) => value),
    interceptors: (await db.interceptors.getMany()).result.map(
      ({ value }) => value
    ),
    settings: (await db.settings.getMany()).result.map(({ value }) => value),
    appinfo: (await db.appinfo.getMany()).result.map(({ value }) => value),
  };

  return Response.json(backup, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="webrex-backup.json"',
    },
  });
}
