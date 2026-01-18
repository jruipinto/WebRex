import { Component, computed, inject, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EditorSidebarComponent } from 'src/shared';
import { SnippetItemComponent } from '../snippet-item';
import { ReplService } from '../../repl.service';

@Component({
  selector: 'app-snippet-list',
  templateUrl: './snippet-list.component.html',
  styleUrl: './snippet-list.component.css',
  imports: [EditorSidebarComponent, SnippetItemComponent],
})
export class SnippetListComponent {
  readonly service = inject(ReplService);

  $snippets = toSignal(this.service.snippets$);

  $snippetsMapped = computed(() =>
    (this.$snippets() ?? [])
      .filter((i) => i.value.context)
      .filter((i) => new RegExp(this.$searchValue(), 'i').test(i.value.context))
      .map((node) => ({
        name: node.value.context as `/${string}`,
        value: node,
      }))
  );

  $searchValue = model('');
}
