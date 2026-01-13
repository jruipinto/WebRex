import type { Context } from 'hono';
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
  const config = await conf.config; // promise ensures that the config is always up-to-date (and it must be inside this function)
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
    const hasExtension = /\w+\.\w+$/.test(url.pathname);

    const res = await serveStatic({
      root: staticRoute.target.replace('file://', ''),
      rewriteRequestPath: (path) =>
        !hasExtension ? '/index.html' : path.replace('/webrex-ui', ''),
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
    console.log(
      `[${new Date().toISOString()}]  ${
        responseError.name
      }  ${req.method.padEnd(6, ' ')}${target.href}\n`,
      {
        errorLog: {
          headers: response.headers,
          exception: responseError,
        },
      }
    );
  }

  return [response, target] as const;
}
