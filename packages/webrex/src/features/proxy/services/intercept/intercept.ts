import { logDifferences } from './log-differences.ts';
import { ResponseInterceptor } from './response-interceptor.model.ts';
import { NoSqlDB } from '@core/database/no-sql-db.ts';
// keep this import as namespace to guarantee that the whole fs is imported
// so that compiled app has access to all tools when running factories from snippets folder
// import * as fs from 'node:fs';
// import { normalize } from 'node:path';

/**
 *
 * Intercept, similarly to Angular http interceptors, takes care of mutating the responses.
 * It tries to find a matching interceptor to current response and executes it if found.
 * Interceptors are callback functions, stored in DB and managed using the WebRex UI, that
 * take response as input and must return the modified response.
 */
export async function intercept(
  pathname: string,
  response: Response,
  config: WebRexConfiguration,
  db: NoSqlDB
): Promise<Response> {
  const responseInterceptorFn = await getInterceptor(pathname, config, db);

  if (responseInterceptorFn === null) {
    return response;
  }

  const patchedResponse = await responseInterceptorFn(response.clone());

  // TODO: bring back logDifferences
  //   if (!isRequestingAsset(pathname) && !isInternalRequest(pathname)) {
  //     console.log(`Reponse patched by interceptor.`);
  //     logDifferences(jsonResponse, patchedResponse);
  //   }

  const headers = new Headers(response.clone().headers);
  headers.delete('content-security-policy');
  headers.delete('X-Origin');

  return new Response(patchedResponse.body, {
    headers,
    status: patchedResponse.status,
    statusText: patchedResponse.statusText,
  });
}

async function getInterceptor(
  pathname: string,
  config: WebRexConfiguration,
  db: NoSqlDB
): Promise<ResponseInterceptor | null> {
  const interceptorTemplate = (
    await db.interceptors.getOne({
      filter: (doc) => doc.value.context === pathname && doc.value.enabled,
    })
  )?.value.codeJS;

  const interceptorUrl = interceptorTemplate
    ? URL.createObjectURL(
        new Blob([interceptorTemplate], { type: 'application/javascript' })
      )
    : null; // await getLocalInterceptor(pathname, config.mockpath);

  if (!interceptorUrl) {
    return null;
  }

  const responseInterceptorFn = await import(interceptorUrl)
    .then((v) => v.default as ResponseInterceptor)
    .catch((error) => new Error(error));

  if (responseInterceptorFn instanceof Error) {
    console.log(responseInterceptorFn);
    return null;
  }

  return responseInterceptorFn;
}

// /**
//  * This function is temporary, to allow getting interceptors from local filesystem, but in
//  * future, all interceptors should come from DB, to allow compiled app to work properly
//  */
// async function getLocalInterceptor(
//   pathname: string,
//   directory?: string
// ): Promise<string | null> {
//   const factoryPath = import.meta.resolve(
//     (
//       (directory ?? `../config/routes/`) +
//       `${pathname.replace(/\/$/, '')}/index.ts`
//     ).replace(/\/\//g, '/')
//   );
//   if (
//     !(await fs.promises
//       .access(normalize(factoryPath.replace('file:///', '')), fs.constants.F_OK)
//       .then(() => true)
//       .catch(() => false))
//   ) {
//     return null;
//   }
//   return factoryPath;
// }
