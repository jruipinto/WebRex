import {
  Component,
  ElementRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerLogsApiService } from './server-logs-api.service';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  RealtimeApiService,
  DsButtonComponent,
  SearchInputComponent,
} from 'src/shared';

@Component({
  selector: 'app-proxy-logs',
  templateUrl: './proxy-logs.component.html',
  styleUrl: './proxy-logs.component.css',
  imports: [CommonModule, FormsModule, DsButtonComponent, SearchInputComponent],
})
export class ProxyLogsComponent {
  serverLogsApiService = inject(ServerLogsApiService);
  realtimeApiService = inject(RealtimeApiService);

  $logsContainer = viewChild.required<ElementRef<HTMLElement>>('logsContainer');

  $searchValue = model('');
  private searchValue$ = toObservable(this.$searchValue).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(''),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  refresh$ = this.realtimeApiService
    .watchEntity('serverlogs')
    .pipe(debounceTime(300), startWith({}));

  logs$ = combineLatest({
    searchValue: this.searchValue$,
    refresh: this.refresh$,
  }).pipe(
    switchMap(() => this.serverLogsApiService.search()),
    map((response) =>
      response.result.filter((i) =>
        new RegExp(this.$searchValue(), 'i').test(i.value)
      )
    ),
    tap(() => {
      const bottom = this.$logsContainer().nativeElement.scrollHeight - 40;
      const currentPosition =
        this.$logsContainer().nativeElement.scrollTop +
        this.$logsContainer().nativeElement.clientHeight;
      const isAtBottomOfScroll = currentPosition >= bottom;
      if (!isAtBottomOfScroll) {
        return;
      }
      // waits 300ms before scrolling to bottom to avoid miscalculating the scrollHeight
      setTimeout(() => {
        this.$logsContainer().nativeElement.scrollTo({
          behavior: 'auto',
          top: this.$logsContainer().nativeElement.scrollHeight,
        });
      }, 100);
    }),
    startWith([])
  );

  $isClearing = signal(false);

  async clearLogs(): Promise<void> {
    this.$isClearing.set(true);
    await firstValueFrom(this.serverLogsApiService.delete('*'));
    this.$isClearing.set(false);
  }
}
