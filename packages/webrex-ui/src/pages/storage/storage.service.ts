import { inject, Injectable, signal } from '@angular/core';
import { filter, firstValueFrom, map, retry, timeout } from 'rxjs';
import {
  DsDialogComponent,
  DsDialogInput,
  DsDialogOutput,
  RealtimeApiService,
  tryToParse,
} from 'src/shared';
import { ReplDocument } from '../repl/models';
import { ReplApiService } from '../repl/repl-api.service';
import { ReplOutputApiService } from './repl-output-api.service';
import { CompressionHelpers } from './helpers';
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
import { Dialog } from '@angular/cdk/dialog';

@Injectable({ providedIn: 'root' })
export class StorageService {
  replApiService = inject(ReplApiService);
  replOutputApiService = inject(ReplOutputApiService);
  realtimeApiService = inject(RealtimeApiService);
  private readonly dialog = inject(Dialog);

  $selectedItem = signal<StorageItem | null>(null);
  $storageItems = signal([] as StorageItem[]);

  async refresh(): Promise<void> {
    const isConnectionAlive = await this.executeInProxiedApp('true');
    if (!isConnectionAlive) {
      return;
    }
    const sessionStorageKeys = tryToParse(
      (await this.executeInProxiedApp(getSessionStorageKeysScript)) ?? '[]'
    ) as string[];

    const localStorageKeys = tryToParse(
      (await this.executeInProxiedApp(getLocalStorageKeysScript)) ?? '[]'
    ) as string[];

    const storageItems = [
      sessionStorageKeys.map(
        (key, id): StorageItem => ({
          id: `sessionitem${id}`,
          key,
          storageType: 'sessionStorage',
          value: 'tobedefined',
        })
      ),
      localStorageKeys.map(
        (key, id): StorageItem => ({
          id: `localitem${id}`,
          key,
          storageType: 'localStorage',
          value: 'tobedefined',
        })
      ),
    ].flat() as StorageItem[];

    this.$storageItems.set(storageItems);
  }

  async readItem(i: StorageItem): Promise<void> {
    const itemValue = (await this.executeInProxiedApp(
      i.storageType === 'sessionStorage'
        ? getSessionStorageValueScript(i.key)
        : getLocalStorageValueScript(i.key)
    )) as string;

    this.$selectedItem.set({
      ...i,
      value: tryToParse(itemValue),
    });
  }

  async writeItem(i: StorageItem): Promise<void> {
    (await this.executeInProxiedApp(
      i.storageType === 'sessionStorage'
        ? setSessionStorageValueScript(i.key, i.value)
        : setLocalStorageValueScript(i.key, i.value)
    )) as string;
  }

  async alert(message: string): Promise<void> {
    await firstValueFrom(
      this.dialog.open<DsDialogOutput, DsDialogInput, DsDialogComponent>(
        DsDialogComponent,
        {
          data: {
            variant: 'alert',
            header: 'Warning!',
            message,
            primaryBtn: 'Ok',
          },
        }
      ).closed
    );
  }

  private async executeInProxiedApp(
    codeTs: string
  ): Promise<string | undefined> {
    const javascript = await transform(codeTs, {
      loader: 'ts',
    });

    const codeJS = javascript.code;

    const result = await firstValueFrom(
      this.replOutputApiService.create({
        codeTS: codeTs,
        codeJS: codeJS,
      })
    );

    const compressedEvaluationResult =
      (await firstValueFrom(
        this.replOutputApiService.get(result['id']).pipe(
          retry(3),
          timeout(3000),
          map((res) => {
            const result = res?.value?.result;
            if (result === null || result === undefined) {
              throw new Error('Not run yet');
            }
            return result;
          })
        )
      )) ?? 'failed';

    if (compressedEvaluationResult === 'failed') {
      await this.alert(
        'The remote execution of some scripts in proxied app, timed out. Please check if the app is open or refresh it.'
      );
      return;
    }

    const evaluationResult = await CompressionHelpers.decompressFromBase64(
      compressedEvaluationResult
    );

    return evaluationResult;
  }
}
