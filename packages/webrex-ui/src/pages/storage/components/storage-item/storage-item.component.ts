import { Component, inject, input, signal } from '@angular/core';
import { LoadingDirective } from 'src/shared';
import { StorageService } from '../../storage.service';
import { StorageItem } from '../../models';

@Component({
  selector: 'app-storage-item',
  templateUrl: './storage-item.component.html',
  styleUrl: './storage-item.component.css',
  imports: [LoadingDirective],
})
export class StorageItemComponent {
  private readonly service = inject(StorageService);

  nodeInput = input.required<{
    name: string;
    value: StorageItem;
  }>();

  $isReading = signal(false);

  async read(i: Parameters<StorageService['readItem']>[0]): Promise<void> {
    this.$isReading.set(true);
    await this.service.readItem(i);
    this.$isReading.set(false);
  }
}
