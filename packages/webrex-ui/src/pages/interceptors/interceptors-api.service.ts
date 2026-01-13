import { Injectable } from '@angular/core';
import { AbstractApiService } from 'src/shared';
import { InterceptorDocument } from './models';

@Injectable({ providedIn: 'root' })
export class InterceptorsApiService extends AbstractApiService<InterceptorDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/interceptors`;
}
