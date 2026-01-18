import { NoSqlDB, NoSqlDBCollectionsNames } from '@core/database/no-sql-db.ts';
import { dbBackup } from './services/db-backup/db-backup.ts'; // You can move this logic here later
import { dbRestore } from './services/db-backup/db-restore.ts';
import {
  realtimeChanges$,
  RealtimeEvent,
} from '@core/bootstrap/realtime.stream.ts';

export const adminService = {
  /**
   * Generic CRUD: Read
   */
  async getEntity(db: NoSqlDB, entity: NoSqlDBCollectionsNames, id?: string) {
    const collection = db[entity];
    if (!collection) throw new Error(`Collection ${entity} not found`);

    return id ? await collection.find(id) : await collection.getMany();
  },

  /**
   * Generic CRUD: Create
   */
  async createEntity(
    db: NoSqlDB,
    entity: NoSqlDBCollectionsNames,
    payload: any
  ) {
    const collection = db[entity];
    collection.getOne();
    const status = await collection
      .add(payload)
      .catch(mapSchemaErrors(undefined));

    if (status.ok) {
      this.notify(entity, 'POST', status.id, payload);
    }
    return status;
  },

  /**
   * Generic CRUD: Update (Replace)
   */
  async updateEntity(
    db: NoSqlDB,
    entity: NoSqlDBCollectionsNames,
    id: string,
    payload: any
  ) {
    const collection = db[entity];
    const status = await collection
      .upsert({ id, update: payload, set: payload }, { strategy: 'replace' })
      .catch(mapSchemaErrors(id));

    if (status.ok) {
      this.notify(entity, 'PUT', status.id, payload);
    }
    return status;
  },

  /**
   * Generic CRUD: Patch (Merge)
   */
  async patchEntity(
    db: NoSqlDB,
    entity: NoSqlDBCollectionsNames,
    id: string,
    payload: any
  ) {
    const collection = db[entity];
    const status = await collection
      .update(id, payload, { strategy: 'merge' })
      .catch(mapSchemaErrors(id));

    if (status.ok) {
      this.notify(entity, 'PATCH', status.id, payload);
    }
    return status;
  },

  /**
   * Generic CRUD: Delete
   */
  async deleteEntity(db: NoSqlDB, entity: NoSqlDBCollectionsNames, id: string) {
    const collection = db[entity];

    if (id === '*') {
      await collection.deleteMany();
    } else {
      await collection.delete(id);
    }

    this.notify(entity, 'DELETE', id);
    return { ok: true };
  },

  /**
   * System Tasks
   */
  async backup(req: Request, db: NoSqlDB) {
    return await dbBackup(req, db);
  },

  async restore(req: Request, db: NoSqlDB) {
    return await dbRestore(req, db);
  },

  /**
   * Internal Helper to trigger WebSocket updates
   */
  notify(
    entity: NoSqlDBCollectionsNames,
    type: RealtimeEvent['data']['type'],
    id?: string,
    payload?: unknown
  ) {
    realtimeChanges$.next({
      type: 'realtimechanges',
      data: {
        type,
        data: {
          entity,
          id,
          payload,
        },
      },
    });
  },
};

const mapSchemaErrors = (id: string | undefined) => (err: Error) => ({
  errors: (JSON.parse(err.message) ?? [])?.map(
    (i: { message: string }) => i.message
  ),
  ok: false,
  id,
});
