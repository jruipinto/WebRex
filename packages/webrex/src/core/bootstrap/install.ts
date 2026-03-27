import { join } from 'node:path';
import { WEB_UI_PATH } from '@core/config/constants/app.constants.ts';
import { NoSqlDB } from '@core/database/no-sql-db.ts';
import { ensureDir } from '@core/utils/fs-extra.ts';
import { AppInfoDocument } from '@models/app-info-document.ts';
import { extract } from 'tar';
import denoJson from '../../../deno.json' with { type: 'json' };

/**
 * Instals the required static files in user folder, on first run of the **compiled** app.
 * Does nothing, otherwise;
 */
export async function install({ db }: { db: NoSqlDB }): Promise<void> {
  const appInfoDocument = await db.appinfo.getOne();

  const isVersionAlreadyInstalled =
    appInfoDocument?.value.installedVersion === denoJson.version;

  if (isVersionAlreadyInstalled) {
    return;
  }

  console.log(`Installing new version ${denoJson.version}...`);

  await ensureDir(WEB_UI_PATH);

  await extract({
    file: join(import.meta.dirname!, '..', '..', '..', 'tmp', 'web-ui.tar.gz'),
    cwd: WEB_UI_PATH,
  });

  const updatedAppInfoDocumentValue = {
    installDate: new Date().toISOString(),
    installedVersion: denoJson.version,
  } as AppInfoDocument;

  if (appInfoDocument?.id) {
    // discard old app info
    await db.appinfo.deleteMany();
  }

  await db.appinfo.add(updatedAppInfoDocumentValue);
}
