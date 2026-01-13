import {
  Component,
  computed,
  input,
  signal,
  Signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Tree, TreeItem, TreeItemGroup } from '@angular/aria/tree';
import { FlatNode, TreeNode } from './models';
import { byHierarchicalPath, mergeBranches, toTree } from './helpers';

/**
 * @example Basic usage example
 * ```html
 * <!-- render tree, and pass a template reference to be renderer for each tree node -->
 * <ng-template #item let-node> <my-tree-item [data]="node" /> </ng-template>
 * <ds-tree [$treeItemTemplateRef]="item" />
 * ```
 */
@Component({
  selector: 'ds-tree',
  templateUrl: './ds-tree.component.html',
  styleUrl: './ds-tree.component.css',
  imports: [Tree, TreeItem, TreeItemGroup, NgTemplateOutlet],
})
export class DsTreeComponent {
  $treeItemTemplateRef = input<TemplateRef<unknown> | null>(null);

  $isLoading = input(false);

  $flatNodes = input.required<FlatNode[]>();

  $nodes: Signal<TreeNode[]> = computed(() =>
    mergeBranches(
      this.$flatNodes()
        .sort(byHierarchicalPath)
        .map((node) => toTree(node))
    )
  );

  $expandedIds = signal(new Set<string>());

  toggleExpanded(id: string): void {
    this.$expandedIds.update((oldSet) => {
      if (oldSet.has(id)) {
        oldSet.delete(id);
        return oldSet;
      }
      oldSet.add(id);
      return oldSet;
    });
  }
}
