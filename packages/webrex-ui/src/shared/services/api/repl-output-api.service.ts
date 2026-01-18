import { Injectable } from '@angular/core';
import { ReplOutputDocument } from '@webrex/contracts';
import { AbstractApiService } from 'src/shared';

@Injectable({ providedIn: 'root' })
export class ReplOutputApiService extends AbstractApiService<ReplOutputDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/reploutput`;
}
