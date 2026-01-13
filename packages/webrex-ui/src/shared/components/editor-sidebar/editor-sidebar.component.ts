import {
  Component,
  computed,
  inject,
  input,
  model,
  signal,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DsTreeComponent, TreeNode } from '../ds-tree';
import { SearchInputComponent } from '../search-input';
import { DsButtonComponent } from '../ds-button';

@Component({
  selector: 'app-editor-sidebar',
  templateUrl: './editor-sidebar.component.html',
  styleUrl: './editor-sidebar.component.css',
  imports: [
    FormsModule,
    SearchInputComponent,
    DsButtonComponent,
    DsTreeComponent,
  ],
})
export class EditorSidebarComponent {
  $isSmallScreen = toSignal(
    inject(BreakpointObserver)
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(map((r) => r.matches))
  );

  $isExpanded = signal(true);
  $headerStyles = computed(() =>
    this.$isExpanded() ? headerStylesMap.expanded : headerStylesMap.collapsed
  );

  $treeItemTemplateRef = input<TemplateRef<{ node: TreeNode }> | null>(null);

  $flatNodes = input<ReturnType<DsTreeComponent['$flatNodes']>>([]);
  $isLoading = input(false);

  $searchValue = model('');

  $header = input('Sidebar');
}

const headerStylesMap = {
  expanded: 'block font-medium text-neutral-400',
  collapsed:
    'block font-medium text-neutral-400 mt-8 -mr-3 [writing-mode:vertical-rl]',
} as const;
