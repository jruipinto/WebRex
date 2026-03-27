export type TreeNode<T = any> = {
  path?: string;
  name: string;
  value: T;
  children?: TreeNode<T>[];
  disabled?: boolean;
  expanded?: boolean;
};
