import { Injectable } from '@angular/core';
import { filter, Observable, shareReplay } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD',
  TRACE: 'TRACE',
  CONNECT: 'CONNECT',
} as const;

type HttpMethod = keyof typeof HttpMethod;

type WsMethod =
  | 'RPC' // used to allow frontend to execute custom remote procedure calls in this server
  | typeof HttpMethod.DELETE
  | typeof HttpMethod.POST
  | typeof HttpMethod.PATCH
  | typeof HttpMethod.PUT;

interface NetMessage<T = HttpMethod> {
  type: T;
  correlationId: string;
  data: {
    id?: string;
    entity: string;
    payload?: any;
  };
  error?: string;
}

type WsMessage = NetMessage<WsMethod>;

type RealtimeChangesEvent = {
  type: 'realtimechanges' | 'wsresponse';
  data: NetMessage<WsMessage>;
};

const Entity = {
  WEBLOGS: 'weblogs',
  SERVERLOGS: 'serverlogs',
  SETTINGS: 'settings',
  REPL: 'repl',
  REPL_OUTPUT: 'reploutput',
  INTERCEPTORS: 'interceptors',
} as const;

type Entity = (typeof Entity)[keyof typeof Entity];

@Injectable({ providedIn: 'root' })
export class RealtimeApiService {
  #socket = webSocket<RealtimeChangesEvent>('ws://localhost:3001/webrex-api/ws');
  #realtimeChanges = this.#socket.pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  /** DO NOT REMOVE `#keepAlive`, altough ide says it's not used. It is subscribing to keep ws connection alive */
  #keepAlive = this.#realtimeChanges.subscribe(); // we keep 1 subscription reference to keep websocket alive during this service lifetime

  executeRpc(
    procedureName: string,
    procedureParams?: Record<string, unknown>
  ) {}

  watchEntity(entity: Entity): Observable<RealtimeChangesEvent> {
    return this.#realtimeChanges.pipe(
      filter(
        (evt) =>
          evt.type === 'realtimechanges' && evt.data?.data?.entity === entity
      )
    );
  }
}
