import { kvdex, model, collection, Collection } from '@olli/kvdex';
import { openKv } from '@deno/kv';
import { ensureFile } from '@core/utils/fs-extra.ts';
import { AppInfoDocument } from '@models/app-info-document.ts';

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
        path
      );
      return res;
    });
  });

  return kvdex({
    kv,
    schema: {
      settings: collection(model<SettingsDocument>()),
      appinfo: collection(model<AppInfoDocument>()),
      repl: collection(model<ReplDocument>()),
      repli: collection(model<RepliDocument>()),
      reploutput: collection(model<RepliDocument>()),
      interceptors: collection(model<InterceptorDocument>()),
      serverlogs: collection(model()),
      weblogs: collection(model()),

      //   numbers: collection(model<number>()),
      // serializedStrings: collection(model<string>(), {
      //   encoder: jsonEncoder()
      // }),
      // users: collection(UserModel, {
      //   history: true,
      //   indices: {
      //     username: "primary" // unique
      //     age: "secondary" // non-unique
      //   }
      // }),
      // Nested collections
      // nested: {
      //   strings: collection(model<string>()),
      // }
    },
  });
}

export type NoSqlDB = Awaited<ReturnType<typeof noSqlDb>>;

type PickString<T> = {
  // deno-lint-ignore no-explicit-any
  [K in keyof T]: T[K] extends Collection<any, any, any> ? K : never;
}[keyof T];

export type NoSqlDBCollectionsNames = PickString<NoSqlDB>;

type CodeDocument = {
  /**
   * This is the TS representation of the configuration object.
   * For safety reasons, this is not evaluated on server side.
   * Consume is responsible to managing code, evaluating it and send the code & codeResultPair
   */
  codeTS: string;
  /**
   * This is the actual configuration being used
   * (basically the evaluation result of code, which server ignores for security reasons)
   */
  codeJS: string;
};

type SettingsDocument = CodeDocument;
type ReplDocument = CodeDocument;
export type RepliDocument = CodeDocument & { result?: string };

type InterceptorDocument = {
  /**
   * This is the TS representation of the configuration object.
   * For safety reasons, this is not evaluated on server side.
   * Consume is responsible to managing code, evaluating it and send the code & codeResultPair
   */
  codeTS: string;
  /**
   * This is the actual configuration being used
   * (basically the evaluation result of code, which server ignores for security reasons)
   */
  codeJS: string;
  /** Only response interceptors are supported, currently. Maybe in future it can be extended to request as well */
  type: 'http-request-interceptor' | 'http-response-interceptor';
  enabled: boolean;
  /**
   * URL.pathname to match which can be expressed as string or string regular expression.
   */
  context: string;
  /** You may group many related interceptors, together, in a folder, to improve UX */
  folder: string;
  /** The interceptor name. Helps to convey the usefullness of the interceptor (the same way as a function name does) */
  name: string;
};
