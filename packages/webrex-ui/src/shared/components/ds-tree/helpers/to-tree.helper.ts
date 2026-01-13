import { TreeNode } from '../models/tree-node.model';

export function toTree<T = any>(
  item: { name: string; value: T },
  { delimiter = '/' } = {}
): TreeNode<T> {
  const [head, ...tail] = item.name.split(delimiter).filter(Boolean);

  return {
    name: head,
    value: item.value,
    children: tail.length
      ? [toTree({ ...item, name: tail.join(delimiter) }, { delimiter })]
      : undefined,
  };
}
