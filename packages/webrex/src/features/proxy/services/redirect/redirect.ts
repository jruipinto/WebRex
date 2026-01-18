import { normalize } from 'node:path';
import type { Context } from 'hono';
import { firstValueFrom } from 'rxjs';
import { ProxyRoute } from '@models/configuration.ts';
import { InternalConfig } from '@core/config/internal-config.ts';
import { serveStatic } from '@core/utils/servestatic.ts';
import { mockFromHAR } from './mock-from-har.ts';
import { getSmartFallbackRoutes } from './get-smart-fallback-routes.ts';
import { getViableResultForRequest } from './get-viable-result-for-request.ts';

/**
 * Takes the request and proxies it to the desired route found in provide webrex configuration.
 * In short it works like a proxy.
 */
export async function redirect({
  context,
  conf,
}: {
  context: Context;
  conf: InternalConfig;
}): Promise<readonly [Response, URL]> {
  const req = context.req.raw;
  const config = await firstValueFrom(conf.config$); // promise ensures that the config is always up-to-date (and it must be inside this function)
  const proxyRoutes = config.proxy;
  const responseMockedFromHar = await mockFromHAR({ req, conf: config });

  if (responseMockedFromHar) {
    return responseMockedFromHar;
  }

  const url = new URL(req.url);
  const staticRoute = proxyRoutes
    .filter((e) => new URL(e.target).protocol === 'file:')
    .find((e) => new RegExp(e.context).exec(url.pathname));

  // for static files serving
  if (staticRoute) {
    const isRequestingAsset = (path: string) => /\w+\.\w+$/.test(path);

    const res = await serveStatic({
      root: normalize(staticRoute.target.replace('file://', '')),
      rewriteRequestPath: (path) =>
        !isRequestingAsset(path) ? '/index.html' : path,
    })(context, async () => {});

    return [
      res ?? Response.json({ status: 'Not found' }, { status: 404 }),
      new URL(staticRoute.target),
    ];
  }

  const urlWithoutOrigin = url.toString().replace(url.origin, '');
  const viableProxyRoutes = (proxyRoutes as ProxyRoute[])
    .filter((e) => !e.disabled && e.isHealthy !== false)
    .filter((e) => new RegExp(e.context).test(urlWithoutOrigin))
    .concat(...getSmartFallbackRoutes(req));

  const { response, responseError, target } = await getViableResultForRequest(
    viableProxyRoutes,
    url,
    req
  );

  if ([301, 302, 307, 308].includes(response.status)) {
    const location = new URL(
      response.headers.get('Location') || '',
      response.url
    );
    return [Response.redirect(location.toString(), response.status), location];
  }

  if (responseError) {
    const timestamp = new Date().toISOString();

    const headersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => (headersObj[key] = value));

    const logData = {
      errorLog: {
        headers: headersObj,
        exception: {
          name: responseError.name,
          message: responseError.message,
          stack: responseError.stack?.split('\n'),
        },
      },
    };
    console.log(
      `[${timestamp}] ${responseError.name.padStart(
        11,
        ' '
      )} ${req.method.padEnd(7, ' ')}${target.href}\n`,
      logData
    );
  }

  return [response, target] as const;
}
