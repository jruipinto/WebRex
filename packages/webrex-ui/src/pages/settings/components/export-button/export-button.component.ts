import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DsButtonComponent } from 'src/shared';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-export-button',
  templateUrl: './export-button.component.html',
  styleUrl: './export-button.component.css',
  imports: [DsButtonComponent],
})
export class ExportButtonComponent {
  http = inject(HttpClient);
  $isLoading = signal(false);

  async export(): Promise<void> {
    this.$isLoading.set(true);
    const blob = await firstValueFrom(
      this.http.get('/webrex-api/backup', { responseType: 'blob' })
    );
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'webrex-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    }
    this.$isLoading.set(false);
  }
}
