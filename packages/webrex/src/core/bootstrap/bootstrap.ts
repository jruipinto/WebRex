import { Hono } from 'hono';
import { InternalConfig } from '@core/config/internal-config.ts';
import { findFreePort } from '@core/utils/find-free-port.ts';
import { afterInit } from './after-init.ts';
import { firstValueFrom } from 'rxjs';

type BootstrapParams = {
  conf: InternalConfig;
  app: Hono;
};

/**
 * Universal Bootstrapper
 * Detects runtime and runs accordingly
 */
export async function bootstrap({ app, conf }: BootstrapParams): Promise<void> {
  const config = await firstValueFrom(conf.config$);

  const onListen = afterInit(conf);

  const serverOptions = {
    port: await findFreePort({ basePort: config.port ?? 3001 }),
    hostname: config.hostname,
    fetch: app.fetch,
  };

  if ('Deno' in globalThis) {
    (globalThis as any).Deno.serve({
      ...serverOptions,
      onListen,
      handler: app.fetch,
    });
  } else if ('Bun' in globalThis) {
    (globalThis as any).Bun.serve({ ...serverOptions, fetch: app.fetch });
    onListen(serverOptions);
  } else {
    const { serve } = await import('@hono/node-server');
    serve({ ...serverOptions, fetch: app.fetch }, onListen);
  }
}
