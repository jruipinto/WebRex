import { Hono } from 'hono';
import { InternalConfig } from '@core/config/internal-config.ts';
import { bootstrap } from '@core/bootstrap/bootstrap.ts';

import { pathSanitizer } from '@middleware/path-sanitizer.ts';

import { adminRouter } from '@features/admin/admin.router.ts';
import { proxyRouter } from '@features/proxy/proxy.router.ts';
import { uiRouter } from '@features/ui/ui.router.ts';

console.log('Starting...');

const conf = new InternalConfig();
const app = new Hono();

// --- THE PIPELINE (Ordered execution) ---
app.use('*', pathSanitizer); // Block unwanted paths early

// --- THE ROUTES (Modular responsibility) ---
app.route('/webrex-api', await adminRouter(conf));
app.route('/webrex-ui', uiRouter(conf));
app.route('/', proxyRouter(conf)); // The proxy engine is inside here

// Universal Bootstrapper: Deno.serve / Bun.serve / Node
bootstrap({ conf, app });
