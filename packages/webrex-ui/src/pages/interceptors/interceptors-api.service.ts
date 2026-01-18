import { Injectable } from '@angular/core';
import { InterceptorDocument } from '@webrex/contracts';
import { AbstractApiService } from 'src/shared';

@Injectable({ providedIn: 'root' })
export class InterceptorsApiService extends AbstractApiService<InterceptorDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/interceptors`;
}
