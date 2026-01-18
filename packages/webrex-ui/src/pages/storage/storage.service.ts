import { inject, Injectable, signal } from '@angular/core';
import { catchError, filter, firstValueFrom, map, of, timeout } from 'rxjs';
import { ReplOutputDocument } from '@webrex/contracts';
import {
  DialogService,
  RealtimeApiService,
  ReplOutputApiService,
  tryToParse,
} from 'src/shared';
import { ReplApiService } from '../repl/repl-api.service';
import { StorageItem } from './models';
import { transform } from 'esbuild-wasm/esm/browser';
import {
  getSessionStorageKeysScript,
  getLocalStorageKeysScript,
  getLocalStorageValueScript,
  getSessionStorageValueScript,
  setLocalStorageValueScript,
  setSessionStorageValueScript,
} from './helpers';

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly replApiService = inject(ReplApiService);
  readonly replOutputApiService = inject(ReplOutputApiService);
  readonly realtimeApiService = inject(RealtimeApiService);
  readonly dialogService = inject(DialogService);

  $selectedItem = signal<StorageItem | null>(null);
  $storageItems = signal([] as StorageItem[]);

  async refresh(): Promise<void> {
    const isConnectionAlive = await this.executeInProxiedApp('true');
    if (!isConnectionAlive) {
      return;
    }
    const sessionStorageKeys = tryToParse(
      (await this.executeInProxiedApp(getSessionStorageKeysScript)) ?? '[]',
    ) as string[];

    const localStorageKeys = tryToParse(
      (await this.executeInProxiedApp(getLocalStorageKeysScript)) ?? '[]',
    ) as string[];

    const storageItems = [
      sessionStorageKeys.map(
        (key, id): StorageItem => ({
          id: `sessionitem${id}`,
          key,
          storageType: 'sessionStorage',
          value: 'tobedefined',
        }),
      ),
      localStorageKeys.map(
        (key, id): StorageItem => ({
          id: `localitem${id}`,
          key,
          storageType: 'localStorage',
          value: 'tobedefined',
        }),
      ),
    ].flat() as StorageItem[];

    this.$storageItems.set(storageItems);
  }

  async readItem(i: StorageItem): Promise<void> {
    const itemValue = (await this.executeInProxiedApp(
      i.storageType === 'sessionStorage'
        ? getSessionStorageValueScript(i.key)
        : getLocalStorageValueScript(i.key),
    )) as string;

    this.$selectedItem.set({
      ...i,
      value: tryToParse(itemValue),
    });
  }

  async writeItem(i: StorageItem): Promise<void> {
    (await this.executeInProxiedApp(
      i.storageType === 'sessionStorage'
        ? setSessionStorageValueScript(i.key, JSON.stringify(i.value))
        : setLocalStorageValueScript(i.key, JSON.stringify(i.value)),
    )) as string;
  }

  private async executeInProxiedApp(
    codeTs: string,
  ): Promise<string | undefined> {
    const javascript = await transform(codeTs, {
      loader: 'ts',
    }).catch((e) => {
      console.log(e);
    });

    if (!javascript) {
      return;
    }

    const codeJS = javascript.code;

    const result = await firstValueFrom(
      this.replOutputApiService.create({
        codeTS: codeTs,
        codeJS: codeJS,
      }),
    );

    const evaluationResult =
      (await firstValueFrom(
        this.realtimeApiService.watchEntity('reploutput').pipe(
          filter((i) => i.data?.data?.id === result.id),
          map((i) => (i.data?.data?.payload as ReplOutputDocument)?.result),
          filter((result) => result !== null && result !== undefined),
          timeout(4000),
          catchError((err) => {
            console.error(err);
            return of(undefined);
          }),
        ),
      )) ?? 'failed';

    if (evaluationResult === 'failed') {
      await this.dialogService.showWarning(
        'No proxied app is responding. Please check if proxied app is open or refresh it.',
      );
      return;
    }

    return evaluationResult;
  }
}
