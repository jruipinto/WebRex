import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EditorComponent,
  DsButtonComponent,
  PathInputComponent,
} from 'src/shared';
import { SnippetListComponent } from './components';
import { ReplService } from './repl.service';

@Component({
  selector: 'app-repl',
  templateUrl: './repl.component.html',
  styleUrl: './repl.component.css',
  imports: [
    CommonModule,
    EditorComponent,
    SnippetListComponent,
    DsButtonComponent,
    PathInputComponent,
  ],
})
export class ReplComponent {
  private readonly service = inject(ReplService);
  form = this.service.form;

  $isRunning = signal(false);
  $isDeleting = signal(false);
  $isSaving = signal(false);
  $isCompilingJs = signal(false);

  async run(i: Parameters<ReplService['run']>[0]): Promise<void> {
    this.$isRunning.set(true);
    await this.service.run(i);
    this.$isRunning.set(false);
  }

  async compileToJSAndCopyToClipboard(
    i: Parameters<ReplService['compileToJSAndCopyToClipboard']>[0]
  ): Promise<void> {
    this.$isCompilingJs.set(true);
    await this.service.compileToJSAndCopyToClipboard(i);
    this.$isCompilingJs.set(false);
  }

  async delete(i: Parameters<ReplService['delete']>[0]): Promise<void> {
    this.$isDeleting.set(true);
    await this.service.delete(i);
    this.$isDeleting.set(false);
  }

  async save(i: Parameters<ReplService['save']>[0]): Promise<void> {
    this.$isSaving.set(true);
    await this.service.save(i);
    this.$isSaving.set(false);
  }
}
