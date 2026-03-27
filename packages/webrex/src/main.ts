import * as esbuild from 'esbuild-wasm';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { InternalConfig } from '@core/config/internal-config.ts';
import { bootstrap } from '@core/bootstrap/bootstrap.ts';

import { pathSanitizer } from '@middleware/path-sanitizer.ts';

import { adminRouter } from '@features/admin/admin.router.ts';
import { proxyRouter } from '@features/proxy/proxy.router.ts';
import { uiRouter } from '@features/ui/ui.router.ts';

console.log('Software licensed under AGPL-3.0-only\n');
console.log('Starting...');

await esbuild.initialize({
  worker: false,
});

const conf = new InternalConfig();
const app = new Hono();

// --- THE PIPELINE (Ordered execution) ---
app.use(
  '*',
  cors({
    origin: (origin) => origin, // Declaratively reflect the requesting origin
    credentials: true,
  }),
);
app.use('*', pathSanitizer); // Block unwanted paths early

// --- THE ROUTES (Modular responsibility) ---
app.route('/webrex-api', await adminRouter(conf));
app.route('/webrex-ui', uiRouter(conf));
app.route('/', proxyRouter(conf)); // The proxy engine is inside here

// Universal Bootstrapper: Deno.serve / Bun.serve / Node
bootstrap({ conf, app });
