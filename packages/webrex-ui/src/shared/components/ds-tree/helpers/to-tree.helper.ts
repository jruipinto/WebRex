import { TreeNode } from '../models/tree-node.model';

export function toTree<T = any>(
  item: { name: string; value: T; path?: string },
  { delimiter = '/' } = {},
): TreeNode<T> {
  const [head, ...tail] = item.name.split(delimiter).filter(Boolean);

  return {
    path: `${item.path ?? ''}/${head}`,
    name: head,
    value: item.value,
    children: tail.length
      ? [
          toTree(
            {
              ...item,
              name: tail.join(delimiter),
              path: `${item.path ?? ''}/${head}`,
            },
            { delimiter },
          ),
        ]
      : undefined,
  };
}
