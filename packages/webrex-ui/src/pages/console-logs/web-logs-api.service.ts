import { Injectable } from '@angular/core';
import { WeblogsDocument } from '@webrex/contracts';
import { AbstractApiService } from 'src/shared';

@Injectable({ providedIn: 'root' })
export class WebLogsApiService extends AbstractApiService<WeblogsDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/weblogs`;
}
