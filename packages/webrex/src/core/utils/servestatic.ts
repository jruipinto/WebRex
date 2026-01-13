import type { serveStatic as bunServeStatic } from 'hono/bun';
import type { serveStatic as denoServeStatic } from 'hono/deno';

export const { serveStatic } = (await import(
  // deno-lint-ignore no-explicit-any
  typeof (globalThis as any).Bun !== 'undefined' ? 'hono/bun' : 'hono/deno'
)) as { serveStatic: typeof denoServeStatic | typeof bunServeStatic };
