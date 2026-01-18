import { Component, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { filter, firstValueFrom, map, startWith, switchMap, tap } from 'rxjs';
import { transform } from 'esbuild-wasm/esm/browser';
import {
  EditorComponent,
  DsButtonComponent,
  pauseUntilDefined,
  RealtimeApiService,
  DialogService,
} from 'src/shared';
import { SettingsApiService } from './settings-api.service';
import { ExportButtonComponent, ImportButtonComponent } from './components';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  imports: [
    AsyncPipe,
    EditorComponent,
    DsButtonComponent,
    ExportButtonComponent,
    ImportButtonComponent,
  ],
})
export class SettingsComponent {
  settingsApiService = inject(SettingsApiService);
  private readonly realtimeApiService = inject(RealtimeApiService);
  private readonly dialogservice = inject(DialogService);

  $unsavedConfig = signal('');
  $isFetching = signal(false);
  $isSaving = signal(false);
  $isLoading = signal(true);

  private refresh$ = this.realtimeApiService.watchEntity('settings').pipe(
    map(() => true),
    startWith(true)
  );

  settings$ = this.refresh$.pipe(
    tap(() => {
      this.$isFetching.set(true);
    }),
    switchMap(() => this.settingsApiService.search()),
    map((e) => e.result[0]?.value.codeTS),
    filter(Boolean),
    tap(() => {
      this.$isFetching.set(false);
    }),
    startWith('')
  );

  async ngOnInit(): Promise<void> {
    await pauseUntilDefined(() => window.monaco);

    const isTypeAlreadyCached =
      window.monaco.typescript.typescriptDefaults.getExtraLibs()[
        '@webrex-configuration'
      ]?.content?.length;
    if (isTypeAlreadyCached) {
      this.$isLoading.set(false);
      return;
    }

    const settingsTypes = await fetch('@webrex-configuration', {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => ({ content: text, filePath: '@webrex-configuration' }))
      .catch((error) => {
        console.error(error);
        return null;
      });

    if (!settingsTypes?.content) {
      this.$isLoading.set(false);
      return;
    }

    window.monaco.typescript.typescriptDefaults.addExtraLib(
      settingsTypes.content,
      settingsTypes.filePath
    );

    this.$isLoading.set(false);
  }

  async saveSettings(e: KeyboardEvent | null): Promise<void> {
    const didUserTypedSaveCommand =
      (e?.ctrlKey || e?.metaKey) && e?.key.toLowerCase() === 's';
    if (!this.$unsavedConfig() || (!didUserTypedSaveCommand && e !== null)) {
      return;
    }
    this.$isSaving.set(true);

    e?.preventDefault();
    e?.stopPropagation();

    const javascript = await transform(this.$unsavedConfig(), {
      loader: 'ts',
    });

    const safeJS = URL.createObjectURL(
      new Blob([javascript.code], { type: 'application/javascript' })
    );

    const webrexConfigObject = (await import(safeJS)).default;

    if (!webrexConfigObject) {
      this.$isSaving.set(false);

      this.dialogservice.showWarning('Failed to parse!');
      return;
    }

    const oldConfigId = (await firstValueFrom(this.settingsApiService.search()))
      .result[0].id;

    const saveResult = await firstValueFrom(
      this.settingsApiService.update(oldConfigId, {
        codeTS: this.$unsavedConfig(),
        codeJS: webrexConfigObject,
      })
    );

    if(saveResult.errors) {
      this.dialogservice.showWarning(saveResult.errors.join('; '))
    }


    this.$isSaving.set(false);
  }
}
