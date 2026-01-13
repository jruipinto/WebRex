import { Injectable } from '@angular/core';
import { AbstractApiService } from 'src/shared/services/api/abstract-api.service';

type WebLogsDocument = string;

@Injectable({ providedIn: 'root' })
export class WebLogsApiService extends AbstractApiService<WebLogsDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/weblogs`;
}
