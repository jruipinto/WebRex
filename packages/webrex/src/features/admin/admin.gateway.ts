import { Context } from 'hono';
import { merge, fromEvent, tap, takeWhile, map } from 'rxjs';
import { NoSqlDB } from '@core/database/no-sql-db.ts';
import { serverLogStream$ } from '@core/bootstrap/telemetry.stream.ts';
import {
  realtimeChanges$,
  RealtimeEvent,
} from '@core/bootstrap/realtime.stream.ts';
import { adminService } from './admin.service.ts';

export function handleAdminWebSocket(
  c: Context,
  db: NoSqlDB
): Promise<Response> {
  // Runtime-specific upgrade (This logic is Deno-specific, but isolated here)
  const { socket, response } = Deno.upgradeWebSocket(c.req.raw);

  const logBroadcast$ = serverLogStream$.pipe(
    map(
      (log) =>
        ({
          type: 'realtimechanges',
          data: { type: 'POST', data: { entity: 'serverlogs', payload: log } },
        } as RealtimeEvent)
    )
  );

  merge(
    fromEvent<{ type: 'close' }>(socket, 'close'),
    fromEvent<{ type: 'error' }>(socket, 'error'),
    fromEvent<MessageEvent<string>>(socket, 'message'),
    realtimeChanges$, // Listen to changes made via REST API to broadcast them
    logBroadcast$ // teletry does not use admin service so we need to listen to its own stream
  )
    .pipe(
      tap(async (evt) => {
        // Handle Inbound Messages (Client -> Server)
        if (evt.type === 'message') {
          const wsMessage = JSON.parse(evt.data);

          if (wsMessage.type === 'RPC') {
            // Handle custom RPC logic here
            return;
          }

          // Handle CRUD operations sent over WS
          await handleWsCrud(wsMessage, db);
        }

        // Handle Outbound Messages (Server -> Client)
        if (evt.type === 'realtimechanges') {
          socket.send(JSON.stringify(evt));
        }
      }),
      // Keep the stream alive until the socket closes or errors
      takeWhile((evt) => evt.type !== 'error' && evt.type !== 'close')
    )
    .subscribe();

  return Promise.resolve(response);
}

/**
 * Maps WebSocket CRUD messages to the Admin Service
 */
async function handleWsCrud(message: any, db: NoSqlDB) {
  const { type, data } = message;
  const { entity, id, payload } = data;

  switch (type) {
    case 'POST':
      return await adminService.createEntity(db, entity, payload);
    case 'PUT':
      return await adminService.updateEntity(db, entity, id, payload);
    case 'PATCH':
      return await adminService.patchEntity(db, entity, id, payload);
    case 'DELETE':
      return await adminService.deleteEntity(db, entity, id);
    default:
      console.warn(`Unsupported WS Method: ${type}`);
  }
}
