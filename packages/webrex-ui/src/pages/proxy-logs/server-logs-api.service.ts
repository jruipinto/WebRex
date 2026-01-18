import { Injectable } from '@angular/core';
import { ServerlogsDocument } from '@webrex/contracts';
import { AbstractApiService } from 'src/shared';

@Injectable({ providedIn: 'root' })
export class ServerLogsApiService extends AbstractApiService<ServerlogsDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/serverlogs`;
}
