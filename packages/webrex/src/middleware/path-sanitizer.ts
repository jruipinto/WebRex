import { Context, Next } from 'hono';

/**
 * Path Sanitizer Middleware
 * Blocks "noise" requests like /.well-known/ or source maps
 * before they even reach routers.
 */
export const pathSanitizer = async (c: Context, next: Next) => {
  const { pathname } = new URL(c.req.url);

  if (pathname.includes('/.well-known/') || pathname.includes('/sm/') || pathname.includes('/remote-types/')) {
    return c.json({ status: 'Not found' }, 404);
  }

  await next();
};
