import { Hono } from 'hono';
import { InternalConfig } from '@core/config/internal-config.ts';
import { findFreePort } from '@core/utils/find-free-port.ts';
import { afterInit } from './after-init.ts';

type BootstrapParams = {
  conf: InternalConfig;
  app: Hono;
};

/**
 * Universal Bootstrapper
 * Detects runtime and runs accordingly
 */
export async function bootstrap({ conf, app }: BootstrapParams): Promise<void> {
  const onListen = afterInit(conf);

  const serverOptions = {
    port: await findFreePort({ basePort: (await conf.config).port ?? 3001 }),
    hostname: (await conf.config).hostname,
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
