export function tryToParse<T = any>(i: string): T | string {
  try {
    const result = JSON.parse(i);
    return result;
  } catch (_) {
    return String(i);
  }
}
