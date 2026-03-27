// deno-lint-ignore-file no-explicit-any
import { CompareValuesWithDetailedDifferences } from 'object-deep-compare';

export function logDifferences(
  obj1: Record<string, any>,
  obj2: Record<string, any>
): void {
  const isJson = (str: any) => {
    try {
      if (!/^(\{|\[)/.exec(str)) {
        throw new Error();
      }
      const obj = JSON.parse(str) as Record<string, any>;
      return obj;
    } catch (_) {
      return new Error('Not JSON parseable');
    }
  };

  const diffs = CompareValuesWithDetailedDifferences(obj1, obj2)
    .map((diff) => {
      const newValue = isJson(diff.newValue);
      const oldValue = isJson(diff.oldValue);
      if (
        newValue instanceof Error ||
        oldValue instanceof Error ||
        !oldValue ||
        !newValue
      ) {
        return diff;
      }
      return CompareValuesWithDetailedDifferences(oldValue, newValue).map(
        (subdiff) => ({
          ...subdiff,
          path: `${diff.path}.json().${subdiff.path}`,
        })
      );
    })
    .flat();

  console.log('Diffs:\n', diffs);
}
