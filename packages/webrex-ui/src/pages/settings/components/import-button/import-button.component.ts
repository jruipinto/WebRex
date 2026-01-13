import { Component, inject, signal } from '@angular/core';
import { DsButtonComponent } from 'src/shared';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SettingsApiService } from '../../settings-api.service';

@Component({
  selector: 'app-import-button',
  templateUrl: './import-button.component.html',
  styleUrl: './import-button.component.css',
  imports: [DsButtonComponent],
})
export class ImportButtonComponent {
  private readonly http = inject(HttpClient);
  private readonly settingsApiService = inject(SettingsApiService);
  $isLoading = signal(false);

  async uploadBackup(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.$isLoading.set(true);

    const formData = new FormData();
    formData.append('webrex-backup', file);

    await firstValueFrom(this.http.put('/webrex-api/restore', formData));
    // hacky refresh
    const settingsDocument = (
      await firstValueFrom(this.settingsApiService.search())
    ).result.at(0);
    if (settingsDocument?.id) {
      await firstValueFrom(
        this.settingsApiService.update(
          settingsDocument.id,
          settingsDocument.value
        )
      );
    }
    // hacky refresh end
    this.$isLoading.set(false);
  }
}
