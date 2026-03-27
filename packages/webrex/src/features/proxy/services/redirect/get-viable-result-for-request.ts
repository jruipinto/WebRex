import { ProxyRoute } from '@models/configuration.ts';
import { forwardRequestToUrl } from './forward-request-to-url.ts';

export async function getViableResultForRequest(
  routes: ProxyRoute[],
  requestUrl: URL,
  request: Request,
): Promise<{
  response: Response;
  responseError: Error | null;
  target: URL;
}> {
  // Avoid infinite loops
  const viableProxyRoutes = routes.filter(
    ({ target }) => !target.includes(requestUrl.host)
  );

  if (!viableProxyRoutes.length) {
    return {
      response: Response.json({}, { status: 404 }),
      target: requestUrl,
      responseError: new Error(
        `No viable proxy routes found to match: ${requestUrl.toString()}`
      ),
    };
  }

  let result!: readonly [Response, null | Error];
  let target!: URL;

  for (const route of viableProxyRoutes) {
    const proxyUrl = getProxyUrl(requestUrl, route);

    result = await forwardRequestToUrl(request, proxyUrl);
    target = proxyUrl;

    const [response, responseError] = result;
    if (response.status === 404 || responseError) {
      continue;
    }
    break;
  }

  const [response, responseError] = result;

  return { response, responseError, target };
}

function getProxyUrl(requestUrl: URL, route: ProxyRoute): URL {
  let url = requestUrl.pathname + requestUrl.search;
  if (route.pathRewrite) {
    Object.entries(route.pathRewrite ?? {}).forEach(([k, v]) => {
      url = url.replace(new RegExp(k), v);
    });
  }

  const proxyUrl = new URL(
    route.target.replace(/\/*$/, '') + '/' + url.replace(/^\/*/, '')
  );

  return proxyUrl;
}
