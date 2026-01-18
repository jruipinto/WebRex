import { kvdex, collection, Collection } from '@olli/kvdex';
import { jsonEncoder } from '@olli/kvdex/encoding/json';
import { brotliCompressor } from '@olli/kvdex/encoding/brotli';
import { openKv } from '@deno/kv';
import { ensureFile } from '@core/utils/fs-extra.ts';
import { AppInfoDocument } from '@models/app-info-document.ts';
import { SettingsDocument } from '@models/settings-document.ts';
import { ReplDocument } from '@models/repl-document.ts';
import { ReplOutputDocument } from '@models/repl-output-document.ts';
import { InterceptorDocument } from '@models/interceptor-document.ts';
import { ServerlogsDocument } from '@models/serverlogs-document.ts';
import { WeblogsDocument } from '@models/weblogs-document.ts';

export async function noSqlDb(path?: string) {
  console.log('Preparing DB...');

  if (path) {
    await ensureFile(path);
  }

  const kv = await openKv(path).catch((error) => {
    console.log('Failed to start DenoKv (key value store).\n\n', error);
    return openKv().then((res) => {
      console.log(
        '\n\nStarted DenoKv in :inmemory: mode, due to failure starting at specified path: ',
        path,
      );
      return res;
    });
  });

  return kvdex({
    kv,
    schema: {
      settings: collection(SettingsDocument),
      appinfo: collection(AppInfoDocument),
      repl: collection(ReplDocument),
      reploutput: collection(ReplOutputDocument, {
        encoder: jsonEncoder({ compressor: brotliCompressor() }),
      }),
      interceptors: collection(InterceptorDocument),
      serverlogs: collection(ServerlogsDocument),
      weblogs: collection(WeblogsDocument),
    },
  });
}

export type NoSqlDB = Awaited<ReturnType<typeof noSqlDb>>;

type PickString<T> = {
  // deno-lint-ignore no-explicit-any
  [K in keyof T]: T[K] extends Collection<any, any, any> ? K : never;
}[keyof T];

export type NoSqlDBCollectionsNames = PickString<NoSqlDB>;
