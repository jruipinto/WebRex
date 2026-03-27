import { Hono } from 'hono';
import { serveStatic } from '@core/utils/servestatic.ts';
import { isCompiledMode } from '@core/utils/is-compiled-mode.ts';
import { WEB_UI_PATH } from '@core/config/constants/app.constants.ts';
import { InternalConfig } from '@core/config/internal-config.ts';

export const uiRouter = (_conf: InternalConfig) => {
  const app = new Hono();

  // Helper to detect if a request is for an asset (e.g., style.css)
  // or a route (e.g., /settings)
  const isRequestingAsset = (path: string) => /\w+\.\w+$/.test(path);

  // Expose the raw model for the Monaco editor
  app.get('/@webrex-configuration', async (c) => {
    const webrexModel = await import('@models/configuration.ts', {
      with: { type: 'text' },
    });
    return c.text(webrexModel.default);
  });

  /**
   * Serve Static Files
   */
  app.use(
    '*',
    serveStatic({
      // Determine root based on runtime mode
      root: isCompiledMode() ? WEB_UI_PATH : '../webrex-ui/dist/browser',

      // If it's not a file (asset), serve index.html (SPA support).
      // Otherwise, strip the '/webrex-ui' prefix to find the file on disk.
      rewriteRequestPath: (path) => {
        return !isRequestingAsset(path)
          ? '/index.html'
          : path.replace('/webrex-ui', '');
      },
    })
  );

  /**
   * CATCH-ALL FOR UI
   * If serveStatic reached this point, it means the file wasn't found.
   * Return a 404 here to "consume" the /webrex-ui path so it doesn't fall through to the proxy.
   */
  app.all('*', (c) => {
    return c.json({ status: 'Not found in UI assets' }, 404);
  });

  return app;
};
