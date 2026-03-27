import { inject, Injectable, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { transform } from 'esbuild-wasm/esm/browser';
import {
  tap,
  switchMap,
  map,
  startWith,
  shareReplay,
  firstValueFrom,
} from 'rxjs';
import { InterceptorDocument } from '@webrex/contracts';
import {
  ApiResponse,
  TypedForm,
  RealtimeApiService,
  DialogService,
} from 'src/shared';
import { InterceptorsApiService } from './interceptors-api.service';

@Injectable({ providedIn: 'root' })
export class InterceptorsService {
  private readonly interceptorsApiService = inject(InterceptorsApiService);
  private readonly realtimeApiService = inject(RealtimeApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogService = inject(DialogService);

  $id = signal('');

  $isFetching = signal(false);

  private refresh$ = this.realtimeApiService.watchEntity('interceptors').pipe(
    map(() => true),
    startWith(true),
  );

  interceptors$ = this.refresh$.pipe(
    tap(() => {
      this.$isFetching.set(true);
    }),
    switchMap(() => this.interceptorsApiService.search()),
    map((response) => response.result),
    tap(() => {
      this.$isFetching.set(false);
    }),
    startWith([] as ApiResponse<InterceptorDocument>['result']),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  form = this.fb.group({
    codeJS: this.fb.control('' as InterceptorDocument['codeJS']),
    codeTS: this.fb.control(interceptorExample, [
      Validators.required,
      Validators.pattern(/export\s+default\s+async\s+function/),
    ]),
    context: this.fb.control('', [
      Validators.required,
      Validators.pattern('/.*'),
    ]),
    enabled: this.fb.control(false),
    folder: this.fb.control(''),
    name: this.fb.control(''),
    type: this.fb.control('http-response-interceptor', [Validators.required]),
  } as TypedForm<InterceptorDocument>);

  async save(e: KeyboardEvent | null): Promise<void> {
    const didUserTypedSaveCommand =
      (e?.ctrlKey || e?.metaKey) && e?.key.toLowerCase() === 's';
    if (!didUserTypedSaveCommand && e !== null) {
      return;
    }

    this.form.updateValueAndValidity({ emitEvent: false });
    if (this.form.invalid) {
      this.dialogService.showWarning(
        `Interceptor form is invalid. Fix errors: ${JSON.stringify(this.form.errors)}`,
      );
      return;
    }

    e?.preventDefault();
    e?.stopPropagation();

    const javascript = await transform(String(this.form.value.codeTS), {
      loader: 'ts',
    });

    this.form.controls.codeJS.setValue(
      javascript.code as InterceptorDocument['codeJS'],
      { emitEvent: false },
    );

    if (!javascript.code.includes('export default async function')) {
      this.dialogService.showWarning(
        'Invalid interceptor! Interceptor must export a default async function.',
      );

      return;
    }

    if (this.$id()) {
      await firstValueFrom(
        this.interceptorsApiService.patch(
          this.$id(),
          this.form.value as InterceptorDocument,
        ),
      );
      return;
    }

    await firstValueFrom(
      this.interceptorsApiService.create(
        this.form.value as InterceptorDocument,
      ),
    );
  }

  open(i: ApiResponse<InterceptorDocument>['result'][0]): void {
    this.form.patchValue(i.value);
    this.$id.set(i.id);
  }

  async delete(
    i: ApiResponse<InterceptorDocument>['result'][0],
  ): Promise<void> {
    const promptResult = await this.dialogService.showPrompt({
      header: 'Are you sure?',
      message: `You're about to delete "${i.value.context}"`,
      primaryBtn: 'Yes, delete',
      secondaryBtn: 'Cancel',
    });

    const canDelete = promptResult?.btnClicked === 'primary';

    if (!canDelete) {
      return;
    }

    await firstValueFrom(this.interceptorsApiService.delete(i.id));
  }

  async toggleInterceptor(
    i: ApiResponse<InterceptorDocument>['result'][0],
  ): Promise<void> {
    await firstValueFrom(this.interceptorsApiService.patch(i.id, i.value));
  }
}

const interceptorExample = `
// This is a basic example of a valid interceptor. It must always follow this signature.

export default async function (response: Response): Promise<Response> {
  const body = await response.json(); // text, bytes, etc... are also valid to mutate, besides json

  // mutate the body here, as you wish...
  // body.myNewProperty = 'my first mutation';

  return Response.json(body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}

`.trim();
