import {
  Component,
  inject,
  linkedSignal,
  OnDestroy,
  signal,
} from '@angular/core';
import { EditorComponent, DsButtonComponent } from 'src/shared';
import { StorageService } from './storage.service';
import { StorageListComponent } from './components';
import { StorageItem } from './models';
import { Dialog } from '@angular/cdk/dialog';

@Component({
  selector: 'app-storage',
  templateUrl: './storage.component.html',
  styleUrl: './storage.component.css',
  imports: [EditorComponent, DsButtonComponent, StorageListComponent],
})
export class StorageComponent implements OnDestroy {
  private readonly service = inject(StorageService);

  $selectedItem = this.service.$selectedItem;
  $value = linkedSignal(() => this.$selectedItem()?.value ?? '');

  $isLoading = signal(true);
  $isSaving = signal(false);

  ngOnDestroy(): void {
    this.service.$selectedItem.set(null);
  }

  async initStorageList(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.$isLoading.set(true);
    await this.service.refresh();
    this.$isLoading.set(false);
  }

  async writeItem(i: StorageItem | null, updatedValue: string): Promise<void> {
    if (!i) {
      await this.service.alert(
        'Please select a storage item and make changes, to be able to save anything.'
      );
      return;
    }
    this.$isSaving.set(true);
    await this.service.writeItem({ ...i, value: updatedValue });
    this.$isSaving.set(false);
  }
}
