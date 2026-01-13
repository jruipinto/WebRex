import { Component, inject, input, signal } from '@angular/core';
import {
  ApiResponse,
  DsButtonComponent,
  DsMenuComponent,
  DsMenuOptionComponent,
  LoadingDirective,
} from 'src/shared';
import { ReplDocument } from '../../models';
import { ReplService } from '../../repl.service';

@Component({
  selector: 'app-snippet-item',
  templateUrl: './snippet-item.component.html',
  styleUrl: './snippet-item.component.css',
  imports: [
    DsButtonComponent,
    DsMenuComponent,
    DsMenuOptionComponent,
    LoadingDirective,
  ],
})
export class SnippetItemComponent {
  private readonly service = inject(ReplService);

  $isRunning = signal(false);
  $isDeleting = signal(false);

  nodeInput = input.required<{
    name: string;
    value: ApiResponse<ReplDocument>['result'][0];
  }>();

  async run(i: Parameters<ReplService['run']>[0]): Promise<void> {
    this.$isRunning.set(true);
    await this.service.run(i);
    this.$isRunning.set(false);
  }

  async open(i: Parameters<ReplService['open']>[0]): Promise<void> {
    this.service.open(i);
  }

  async delete(i: Parameters<ReplService['delete']>[0]): Promise<void> {
    this.$isDeleting.set(true);
    await this.service.delete(i);
    this.$isDeleting.set(false);
  }
}
