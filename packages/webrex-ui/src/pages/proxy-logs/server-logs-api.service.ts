import { Injectable } from '@angular/core';
import { AbstractApiService } from 'src/shared';

type ServerLogsDocument = string;

@Injectable({ providedIn: 'root' })
export class ServerLogsApiService extends AbstractApiService<ServerLogsDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/serverlogs`;
}
