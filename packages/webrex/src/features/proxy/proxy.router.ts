import { Hono } from 'hono';
import { InternalConfig } from '@core/config/internal-config.ts';
import { proxyService } from './proxy.service.ts';
import { proxyInterceptorMiddleware } from './proxy.interceptor.ts';

export const proxyRouter = (conf: InternalConfig) => {
  const app = new Hono();

  app.use('*', proxyInterceptorMiddleware(conf));

  /**
   * Catch-all Proxy Handler
   */
  app.all('*', async (c) => {
    const responseFromApi = await proxyService.redirect({
      context: c,
      conf,
    });

    return responseFromApi;
  });

  return app;
};
