import { ProxyRoute } from '@models/configuration.ts';

/**
 * Provides a graceful smart fallback, to be appended to proxyRoutes, which proxies requests
 * to original url.origin, in case no appropriate proxy is found or succeeds
 */
export function getSmartFallbackRoutes(request: Request): ProxyRoute[] {
  return [
    {
      context: '/',
      target: (
        (request.headers.get('referer') &&
          new URL(request.headers.get('referer')!).searchParams.get(
            'trueOrigin'
          )) ??
        (request.headers.get('X-Origin') || null) ??
        request.headers.get('referer')
      )?.split('?')[0],
      pathRewrite: { '^/mf': '' },
    },
    {
      context: '/',
      target:
        request.headers.get('referer') &&
        new URL(request.headers.get('referer')!).href
          .replace('/mf', '')
          .split('?')[0],
      pathRewrite: { '^/mf': '' },
    },
  ].filter((p) => p.target) as ProxyRoute[];
}
