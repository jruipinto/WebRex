export type TreeNode<T = any> = {
  name: string;
  value: T;
  children?: TreeNode<T>[];
  disabled?: boolean;
  expanded?: boolean;
};
