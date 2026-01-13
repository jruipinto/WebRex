import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { transform } from 'esbuild-wasm/esm/browser';
import {
  tap,
  switchMap,
  combineLatest,
  map,
  startWith,
  shareReplay,
  firstValueFrom,
} from 'rxjs';
import {
  ApiResponse,
  TypedForm,
  DsDialogComponent,
  DsDialogOutput,
  DsDialogInput,
  RealtimeApiService,
} from 'src/shared';
import { ReplDocument } from './models';
import { ReplApiService } from './repl-api.service';

@Injectable({ providedIn: 'root' })
export class ReplService {
  private readonly dialog = inject(Dialog);
  private readonly http = inject(HttpClient); // TODO: remove when oldSnippets get removed, if not needed anymore
  private readonly replApiService = inject(ReplApiService);
  private readonly realtimeApiService = inject(RealtimeApiService);
  private readonly fb = inject(NonNullableFormBuilder);

  $id = signal('');
  $isFetching = signal(false);

  // // TODO: remove oldSnippets and related code when transition to API fully done
  // private oldSnippets$: Observable<ApiResponse<ReplDocument>> = this.http
  //   .get<ApiResponse<Snippet>>('/snippets')
  //   .pipe(
  //     map((response) => ({
  //       ...response,
  //       result: response.result.map((snippetDoc) => ({
  //         ...snippetDoc,
  //         value: {
  //           codeJS: snippetDoc.value.sourceCode,
  //           codeTS: snippetDoc.value.sourceCode,
  //           context: snippetDoc.value.name,
  //           name: snippetDoc.value.name,
  //         } satisfies ReplDocument,
  //       })),
  //     }))
  //   );

  private refresh$ = this.realtimeApiService.watchEntity('repl').pipe(
    map(() => true),
    startWith(true)
  );

  snippets$ = this.refresh$.pipe(
    tap(() => {
      this.$isFetching.set(true);
    }),
    switchMap(() =>
      combineLatest([
        this.replApiService.search(),
        // this.oldSnippets$
      ])
    ),
    map(
      ([
        response,
        // responseOld
      ]) => [
        // ...responseOld.result,
        ...response.result,
      ]
    ),
    tap(() => {
      this.$isFetching.set(false);
    }),
    startWith([] as ApiResponse<ReplDocument>['result']),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  form = this.fb.group({
    codeJS: this.fb.control(''),
    codeTS: this.fb.control(snippetExample, [Validators.required]),
    context: this.fb.control('', [
      Validators.required,
      Validators.pattern('/.*'),
    ]),
  } as TypedForm<ReplDocument>);

  async save(e: KeyboardEvent | null): Promise<void> {
    const didUserTypedSaveCommand =
      (e?.ctrlKey || e?.metaKey) && e?.key.toLowerCase() === 's';
    if (!didUserTypedSaveCommand && e !== null) {
      return;
    }

    this.form.updateValueAndValidity({ emitEvent: false });
    if (this.form.invalid) {
      alert(
        `Snippet form is invalid. Fix errors: ${JSON.stringify(this.form.errors)}`
      );
      return;
    }

    e?.preventDefault();
    e?.stopPropagation();

    const javascript = await transform(String(this.form.value.codeTS), {
      loader: 'ts',
    });

    this.form.controls.codeJS.setValue(javascript.code, { emitEvent: false });

    if (this.$id()) {
      await firstValueFrom(
        this.replApiService.patch(this.$id(), this.form.value as ReplDocument)
      );

      return;
    }

    await firstValueFrom(
      this.replApiService.create(this.form.value as ReplDocument)
    );
  }

  open(i: ApiResponse<ReplDocument>['result'][0]): void {
    this.form.patchValue(i.value);
    this.$id.set(i.id);
  }

  async delete(i: ApiResponse<ReplDocument>['result'][0]): Promise<void> {
    const promptResult = await firstValueFrom(
      this.dialog.open<DsDialogOutput, DsDialogInput, DsDialogComponent>(
        DsDialogComponent,
        {
          data: {
            header: 'Are you sure?',
            message: `You're about to delete "${i.value.context}"`,
            primaryBtn: 'Yes, delete',
            secondaryBtn: 'Cancel',
          },
        }
      ).closed
    );

    const canDelete = promptResult?.btnClicked === 'primary';

    if (!canDelete) {
      return;
    }

    await firstValueFrom(this.replApiService.delete(i.id));
  }

  async run(
    i: Pick<ApiResponse<Pick<ReplDocument, 'codeTS'>>['result'][0], 'value'> & {
      id?: string;
    }
  ): Promise<void> {
    const javascript = await transform(String(i.value.codeTS), {
      loader: 'ts',
    });

    // TODO: split snippets from repl, in backend and frontend accordingly.
    // currently the first documeent in repl api, is being used as place
    // for current repl document intended to be executed.
    // In short, when 1st document gets updated, it gets executed in the
    // proxied app. This could lead to bugs because nothing guarantes
    // that the 1st document is always the placeholder.
    // Having a snippets api split from repl api will prevent bugs
    const oldId = (await firstValueFrom(this.replApiService.search())).result[0]
      ?.id;

    oldId
      ? await firstValueFrom(
          this.replApiService.update(oldId, {
            codeTS: i.value.codeTS,
            codeJS: javascript.code,
          } as ReplDocument)
        )
      : await firstValueFrom(
          this.replApiService.create({
            codeTS: i.value.codeTS,
            codeJS: javascript.code,
          } as ReplDocument)
        );
  }

  async compileToJSAndCopyToClipboard(codeTs: string): Promise<void> {
    try {
      const javascript = await transform(String(codeTs), {
        loader: 'ts',
      });
      await navigator.clipboard.writeText(javascript.code);
    } catch (error) {
      console.error(error);
    }
  }
}

// import type * as NS from 'http://localhost:3001/remote-types/index.ts';
const snippetExample = `
// Write your own typescript snippet with type annotations.
// Run it, save, compile to JS, share, etc...

`.trim();
