import { Injectable } from '@angular/core';
import { AbstractApiService } from 'src/shared';

type SettingsDocument = {
  codeTS: string;
  codeJS: string;
};

@Injectable({ providedIn: 'root' })
export class SettingsApiService extends AbstractApiService<SettingsDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/settings`;
}
