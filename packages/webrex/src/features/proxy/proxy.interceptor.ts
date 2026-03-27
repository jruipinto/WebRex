import { Context, Next } from 'hono';
import { firstValueFrom } from 'rxjs';
import { InternalConfig } from '@core/config/internal-config.ts';
import { patchHtmlResponses } from './services/patch-html-response/patch-html-response.ts';
import { intercept } from './services/intercept/intercept.ts';

export const proxyInterceptorMiddleware = (conf: InternalConfig) => {
  return async (c: Context, next: Next) => {
    await next(); // Let the proxy fetch the response first

    const response = c.res;
    const url = new URL(c.req.url);
    const contentType = response.headers.get('content-type');

    // --- BUSINESS RULES ---
    const isHtml = contentType?.includes('text/html');
    const isJs = contentType?.includes('text/javascript');

    const isAsset = /\.\w+$/.test(url.pathname);
    const isSuccess = response.status >= 200 && response.status < 300;

    // Rule: Don't intercept assets or non-2xx status (unless forceMock is on)
    const config = await firstValueFrom(conf.config$);
    if ((isAsset && !isHtml && !isJs) || (!config.forceMock && !isSuccess)) {
      return;
    }

    // Rule: Patch HTML if applicable
    let finalResponse = response;
    if (isHtml) {
      finalResponse = await patchHtmlResponses(
        response,
        url.pathname.startsWith('/mf'),
      );
    }

    // Rule: Apply final interception (Snippets, etc.)
    const db = await firstValueFrom(conf.db$);
    c.res = await intercept(url.pathname, finalResponse, config, db);
  };
};
