export interface FlatNode {
  /**
   * A node name, started with delimiter '/', with the full context (which will converted by ds-tree to tree structure)
   * @example
   * name: '/favorites/a/a1/my-item'
   */
  name: `/${string}`;
  /**
   * The value that will be passed to the individual node item while projecting the ds-tree node items.
   * It can be anything.
   * The ds-tree does not touch it. Just passes it along.
   */
  value: { id: string };
}
