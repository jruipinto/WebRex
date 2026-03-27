import { FlatNode } from '../models';

/**
 * Compares 2 FlatNodes and returns sort order
 */
export function byHierarchicalPath(a: FlatNode, b: FlatNode): number {
  const segsA = a.name.split('/').filter(Boolean);
  const segsB = b.name.split('/').filter(Boolean);

  const compare = (i = 0) => {
    if (segsA[i] === segsB[i]) return compare(i + 1);

    const isDirA = i < segsA.length - 1;
    const isDirB = i < segsB.length - 1;

    if (isDirA !== isDirB) return isDirA ? -1 : 1;
    return (segsA[i] || '').localeCompare(segsB[i] || '');
  };

  return compare();
}
