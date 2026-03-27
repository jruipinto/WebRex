import { Subject } from 'rxjs';
import { NoSqlDBCollectionsNames } from '../database/no-sql-db.ts';

export interface RealtimeEvent {
  type: 'realtimechanges';
  data: {
    type: 'DELETE' | 'POST' | 'PATCH' | 'PUT';
    correlationId?: string;
    error?: string;
    data: {
      id?: string;
      entity: NoSqlDBCollectionsNames;
      payload?: unknown;
    };
  };
}

// RxJS Subject for the WebSocket gateway to consume
export const realtimeChanges$ = new Subject<RealtimeEvent>();
