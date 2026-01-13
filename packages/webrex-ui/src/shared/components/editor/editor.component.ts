import {
  Component,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  OnDestroy,
  OnInit,
  output,
  Output,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type monacoNamespace from 'monaco-editor';
import type { IDisposable } from 'monaco-editor';
import prettier from 'prettier/standalone';
import prettierPluginBabel from 'prettier/plugins/babel';
import prettierPluginTypescript from 'prettier/plugins/typescript';
import prettierPluginEstree from 'prettier/plugins/estree';
import { LoadingDirective } from 'src/shared/directives';
import { EditorService } from './editor.service';
import { pauseUntilDefined } from '../../helpers';
import { jsonParseEditorAction, jsonStringifyEditorAction } from './helpers';

declare global {
  interface Window {
    monaco: typeof monacoNamespace;
    require(paths: string[], cb: () => void): void;
  }
}

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
  imports: [CommonModule, FormsModule, LoadingDirective],
})
export class EditorComponent implements OnInit, OnDestroy {
  private readonly editorService = inject(EditorService);
  readonly availableLanguages = ['TypeScript', 'JSON', 'CSS', 'HTML'];
  private disposables = <IDisposable[]>[];

  private editor?: monacoNamespace.editor.IStandaloneCodeEditor;
  private console?: monacoNamespace.editor.IStandaloneCodeEditor;

  private _value = '';
  @Input()
  set value(v: string) {
    if (v === this.value) {
      return;
    }
    this._value = v;
    this.editor?.setValue(v);
    setTimeout(() => {
      this.editor?.focus();
      this.editor?.getAction?.('editor.action.formatDocument')?.run();
    }, 300);
  }
  get value(): string {
    return this.editor?.getValue() ?? this._value;
  }

  $title = input('Editor');

  $isLoading = input(false);

  $showLanguageSelector = input(false);
  $initialLanguage = input<'json' | 'typescript'>('typescript');

  @Output()
  valueChange = new EventEmitter<string>();

  /** Event emited when editor finishes initializing */
  ready = output();

  readonly editorContainerRef =
    viewChild<ElementRef<HTMLDivElement>>('editorContainer');

  async ngOnInit() {
    await this.editorService.initializeESBuild();
    await this.setupMonaco();
    this.ready.emit();
  }

  ngOnDestroy(): void {
    this.disposables.forEach((d) => d.dispose());
    this.editor?.dispose();
    this.console?.dispose();
  }

  updateLanguage(event: Event) {
    window.monaco.editor.setModelLanguage(
      this.editor!.getModel()!,
      event.target!['value']
    );
  }

  private async setupMonaco() {
    (self as any).MonacoEnvironment ??= {
      getWorkerUrl: function (moduleId: string, label: string) {
        return `assets/monaco/min/vs/base/worker/workerMain.js`.replace(
          '//',
          '/'
        );
      },
    };

    const monacoScriptEl = document.createElement('script');
    monacoScriptEl.src = `assets/monaco/min/vs/loader.js`.replace('//', '/');
    monacoScriptEl.id = 'monacoScriptEl';
    if (!document.head.querySelector(`#${monacoScriptEl.id}`)) {
      document.head.appendChild(monacoScriptEl);
    }

    await pauseUntilDefined(() => window.require);

    (window.require as any).config({
      paths: {
        vs: `assets/monaco/min/vs`.replace('//', '/'),
      },
    });

    window.require(['vs/editor/editor.main'], () => {
      // create new editor and save its reference
      this.editor = window.monaco.editor.create(
        this.editorContainerRef()!.nativeElement,
        {
          value: this.value,
          language: this.$initialLanguage(),
          theme: 'vs-dark',
          automaticLayout: true,
          placeholder: 'Type and Run!',
          tabSize: 2,
          insertSpaces: true,
          stopRenderingLineAfter: 20000, // increased value to be useful while avoid too much impact on rendering performance
          // stickyScroll: { maxLineCount: 2 },
        }
      );

      this.disposables.push(
        this.editor.onDidChangeModelContent((e) => {
          const changes = e.changes;
          if (changes.length === 1) {
            const change = changes[0];
            if (change.text === '""' || change.text === "''") {
              this.editor?.trigger(
                'keyboard',
                'editor.action.triggerSuggest',
                {}
              );
            }
          }
        })
      );

      // emit value @output at every change
      this.disposables.push(
        this.editor.getModel()!.onDidChangeContent(() => {
          this.valueChange.emit(this.value);
          this.processImports(this.value);
        })
      );

      // add prettier as default formatter
      this.disposables.push(
        window.monaco.languages.registerDocumentFormattingEditProvider(
          this.availableLanguages.map((i) => i.toLowerCase()),
          {
            provideDocumentFormattingEdits: async (model) => {
              const formatted = await prettier.format(model.getValue(), {
                parser: this.$initialLanguage(),
                plugins: [
                  prettierPluginBabel,
                  prettierPluginEstree,
                  prettierPluginTypescript,
                ],
              });
              return [{ range: model.getFullModelRange(), text: formatted }];
            },
          }
        )
      );

      // add command that enables users to JSON.parse and JSON.stringify selected code inline
      this.disposables.push(
        this.editor?.addAction(jsonStringifyEditorAction),
        this.editor?.addAction(jsonParseEditorAction)
      );
    });
  }

  private async processImports(sourceCode: string): Promise<void> {
    const IMPORTS_REGEXP =
      /^\s*import\s+[^'";\(\)]+['"]{1}([^'"\s]+)['"]{1}[\s;]*$/gim;
    const importUrls = Array.from(sourceCode.match(IMPORTS_REGEXP) ?? []).map(
      (i) => i.replace(/^[^'"]*['"]/, '').replace(/['"]*[^'"]*$/, '')
    );

    if (!importUrls.length) {
      return;
    }

    const alreadyImported = Object.keys(
      window.monaco.typescript.typescriptDefaults.getExtraLibs() ?? {}
    );

    const missingImportUrls = importUrls.filter(
      (url) => !alreadyImported.includes(url)
    );

    if (!missingImportUrls.length) {
      return;
    }

    const remoteImportsResolved: { content: string; filePath?: string }[] = (
      await Promise.all(
        missingImportUrls.map((remoteUrl) =>
          fetch(remoteUrl, { cache: 'no-store' })
            .then((res) => res.text())
            .then((text) =>
              !text ? null : { content: text, filePath: remoteUrl }
            )
            .catch((error) => {
              console.error(error);
              return null;
            })
        )
      )
    ).filter((res) => res !== null);

    remoteImportsResolved.forEach((remoteImport) => {
      this.disposables.push(
        window.monaco.typescript.typescriptDefaults.addExtraLib(
          remoteImport.content,
          remoteImport.filePath
        )
      );
    });

    const model = this.editor?.getModel();
    if (model) {
      model.setValue(model.getValue()); // force update triggers re-check
      const lineNumber = model.getLineCount();
      // fix the problem of cursor going to the start of the line
      this.editor?.setPosition({
        lineNumber,
        column: model.getLineLength(lineNumber) + 1,
      });
    }
  }
}
