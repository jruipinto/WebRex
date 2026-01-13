import { Injectable } from '@angular/core';
import { AbstractApiService } from 'src/shared';

type RepliDocument = {
  codeTS: string;
  codeJS: string;
  result?: string;
};

@Injectable({ providedIn: 'root' })
export class ReplOutputApiService extends AbstractApiService<RepliDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/reploutput`;
}
