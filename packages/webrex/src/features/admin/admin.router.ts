import { Hono } from 'hono';
import { InternalConfig } from '@core/config/internal-config.ts';
import { adminService } from './admin.service.ts';
import { handleAdminWebSocket } from './admin.gateway.ts';
import process from 'node:process';
import { NoSqlDBCollectionsNames } from "@core/database/no-sql-db.ts";

export const adminRouter = async (conf: InternalConfig) => {
  const db = await conf.db;
  const app = new Hono();

  app.get('/exit', (c) => {
    console.log('WebRex: Shutdown requested via API.');
    process.exit(0);
    return c.json({ status: 'exiting' });
  });

  // Backups/Restores
  app.all('/backup', (c) => adminService.backup(c.req.raw, db));
  app.all('/restore', (c) => adminService.restore(c.req.raw, db));

  // WebSocket Gateway
  app.get('/ws', (c) => handleAdminWebSocket(c, db));

  // Generic REST API
  app.get('/:entity/:id?', async (c) => {
    const { entity, id } = c.req.param();
    const data = await adminService.getEntity(db, entity as NoSqlDBCollectionsNames, id);
    return c.json(data);
  });

  app.post('/:entity', async (c) => {
    const { entity } = c.req.param();
    const payload = await c.req.json();
    const status = await adminService.createEntity(db, entity as NoSqlDBCollectionsNames, payload);
    return c.json(status, status.ok ? 201 : 500);
  });

  app.put('/:entity/:id', async (c) => {
    const { entity, id } = c.req.param();
    const payload = await c.req.json();
    const status = await adminService.updateEntity(db, entity as NoSqlDBCollectionsNames, id, payload);
    return c.json(status, status.ok ? 201 : 500);
  });

  app.patch('/:entity/:id', async (c) => {
    const { entity, id } = c.req.param();
    const payload = await c.req.json();
    const status = await adminService.patchEntity(db, entity as NoSqlDBCollectionsNames, id, payload);
    return c.json(status, status.ok ? 201 : 500);
  });

  app.delete('/:entity/:id', async (c) => {
    const { entity, id } = c.req.param();
    await adminService.deleteEntity(db, entity as NoSqlDBCollectionsNames, id);
    return c.json({}, 201);
  });

  /**
   * If serveStatic reached this point, it means the endoint wasn't found.
   * Return a 404 here to "consume" the /webrex-api path so it doesn't fall through to the proxy.
   */
  app.all('*', (c) => {
    return c.json({ status: 'Not found in API' }, 404);
  });

  return app;
};
