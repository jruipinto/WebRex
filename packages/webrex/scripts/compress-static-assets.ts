import { create } from 'tar';
import { ensureDir } from "@core/utils/fs-extra.ts";

async function compressStaticAssets(): Promise<void> {
  const WEB_UI_DIST_PATH = '../webrex-ui/dist/browser';
  const DEST_PATH = './tmp';

  await ensureDir(DEST_PATH);

  await create(
    {
      gzip: true,
      file: DEST_PATH + '/web-ui.tar.gz',
      cwd: WEB_UI_DIST_PATH, // Uses folder content as root
    },
    ['.'] // Pack everything inside WEB_UI_DIST_PATH
  );
}

compressStaticAssets();
