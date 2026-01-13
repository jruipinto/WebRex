import { Component, computed, inject, input, model } from '@angular/core';
import { EditorSidebarComponent } from 'src/shared';
import { StorageItemComponent } from '../storage-item';
import { StorageService } from '../../storage.service';

@Component({
  selector: 'app-storage-list',
  templateUrl: './storage-list.component.html',
  styleUrl: './storage-list.component.css',
  imports: [EditorSidebarComponent, StorageItemComponent],
})
export class StorageListComponent {
  readonly service = inject(StorageService);

  $storageItems = this.service.$storageItems;

  $storageItemsMapped = computed(() =>
    (this.$storageItems() ?? [])
      .filter((i) => i.key?.match(this.$searchValue()))
      .map((i) => ({
        name: `/${i.storageType}/${i.key}` as `/${string}`,
        value: i,
      }))
  );

  $searchValue = model('');

  $isLoading = input(false);
}
