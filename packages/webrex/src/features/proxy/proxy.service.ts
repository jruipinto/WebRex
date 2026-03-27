import { Context } from 'hono';
import { InternalConfig } from '@core/config/internal-config.ts';
import { redirect } from './services/redirect/redirect.ts';
import { firstValueFrom } from 'rxjs';

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

    this.logRequest(
      params.context.req.raw,
      responseFromApi,
      target,
      requestMs,
      params.conf,
    );

    return responseFromApi;
  },

  /**
   * Internal Audit Logger
   */
  async logRequest(
    req: Request,
    res: Response,
    target: URL,
    startTime: number,
    conf: InternalConfig,
  ): Promise<void> {
    if (this.isInternalRequest(target.pathname)) {
      return;
    }

    const duration = Math.ceil(performance.now() - startTime);
    const timestamp = new Date().toISOString();

    console.log(
      `[${timestamp}] ${(duration + 'ms').padStart(7, ' ')} ${
        res.status
      } ${req.method.padEnd(6, ' ')} ${target.href}`,
    );

    if (res.status === 403) {
      console.log(
        '403 Request headers:',
        JSON.stringify(objFromHeaders(req.headers)),
      );
      console.log(
        '403 Response headers:',
        JSON.stringify(objFromHeaders(res.headers)),
      );
      console.log(
        '403 Response body:',
        JSON.stringify(await res.clone().text()),
      );
    }

    return;
    const db = await firstValueFrom(conf.db$);

    db.proxylogs.add({
      correlationId: startTime.toString(),
      request: {
        url: req.url,
        method: req.method as any,
        headers: objFromHeaders(req.headers),
        body: req.body ? await req.text() : '',
      },
      responses: [
        {
          url: res.url,
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          headers: objFromHeaders(res.headers),
          body: res.body ? await res.text() : '',
        },
      ],
    });
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

function objFromHeaders(headers: Headers): Record<string, string> {
  const obj = {} as Record<string, string>;
  headers.forEach((_, k) => {
    obj[k] = headers.get(k) ?? '';
  });
  return obj;
}
