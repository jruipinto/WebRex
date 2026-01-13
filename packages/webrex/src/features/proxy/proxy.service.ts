import { Context } from 'hono';
import { InternalConfig } from '@core/config/internal-config.ts';
import { redirect } from './services/redirect/redirect.ts';

export const proxyService = {
  /**
   * Logic to determine where the request should go
   */
  async redirect(params: {
    context: Context;
    conf: InternalConfig;
  }): Promise<Response> {
    const requestMs = performance.now();

    const [responseFromApi, target] = await redirect(params);

    this.logRequest(params.context.req.raw, responseFromApi, target, requestMs);

    return responseFromApi;
  },

  /**
   * Internal Audit Logger
   */
  logRequest(req: Request, res: Response, target: URL, startTime: number) {
    if (this.isInternalRequest(target.pathname)) {
      return;
    }

    const duration = Math.ceil(performance.now() - startTime);
    const timestamp = new Date().toISOString();

    console.log(
      `[${timestamp}] ${(duration + 'ms').padStart(7, ' ')} ${
        res.status
      } ${req.method.padEnd(6, ' ')} ${target.href}`
    );
  },

  /**
   * Filter out internal noise from logs
   */
  isInternalRequest(path: string) {
    return [
      '/remote-types/',
      '/sockjs-node', // this is usually a websocket used by angular to reload page after changes
    ].some((pattern) => path.includes(pattern));
  },
};
