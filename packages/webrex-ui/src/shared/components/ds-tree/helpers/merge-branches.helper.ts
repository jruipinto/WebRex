import { TreeNode } from '../models/tree-node.model';

export function mergeBranches(nodes: TreeNode[]): TreeNode[] {
  return Object.values(
    nodes.reduce(
      (acc, node) => {
        const prev = acc[node.name];
        const children = [...(prev?.children ?? []), ...(node.children ?? [])];

        return {
          ...acc,
          [node.name]: {
            ...node, // Last-write wins for value/props
            children: children.length ? mergeBranches(children) : undefined,
          },
        };
      },
      {} as Record<string, TreeNode>
    )
  );
}
