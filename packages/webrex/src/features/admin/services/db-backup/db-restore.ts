import { NoSqlDB } from '@core/database/no-sql-db.ts';
import { Backup } from './backup.model.ts';

export async function dbRestore(req: Request, db: NoSqlDB) {
  try {
    const formData = await req.formData();
    const file = formData.get('webrex-backup') as File;
    const backup = JSON.parse(await file.text()) as Backup;

    await db.repl.deleteMany();
    await db.repl.addMany(backup.repl as any);

    await db.interceptors.deleteMany();
    await db.interceptors.addMany(backup.interceptors as any);

    const settings = await db.settings.getOne();
    await db.settings.update(settings!.id, backup.settings[0] as any, {
      strategy: 'replace',
    });

    return Response.json({ status: 'Restore Successful' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ status: 'Restore Failed' }, { status: 500 });
  }
}
