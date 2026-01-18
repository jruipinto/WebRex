import { Injectable } from '@angular/core';
import { SettingsDocument } from '@webrex/contracts';
import { AbstractApiService } from 'src/shared';

@Injectable({ providedIn: 'root' })
export class SettingsApiService extends AbstractApiService<SettingsDocument> {
  protected override readonly API_PATH = `${this.API_PREFIX}/settings`;
}
