import { Injectable } from '@angular/core';
import { AbstractApiService } from 'src/shared';
import { ReplDocument } from './models';

@Injectable({ providedIn: 'root' })
export class ReplApiService extends AbstractApiService<ReplDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/repl`;
}
