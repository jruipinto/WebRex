import { Component, inject, output, signal } from '@angular/core';
import { DsButtonComponent } from 'src/shared';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-import-button',
  templateUrl: './import-button.component.html',
  styleUrl: './import-button.component.css',
  imports: [DsButtonComponent],
})
export class ImportButtonComponent {
  private readonly http = inject(HttpClient);
  $isLoading = signal(false);

  importSuccess = output<boolean>();

  async uploadBackup(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.$isLoading.set(true);

    const formData = new FormData();
    formData.append('webrex-backup', file);

    await firstValueFrom(this.http.put('/webrex-api/restore', formData));

    this.$isLoading.set(false);
    this.importSuccess.emit(true);
  }
}
