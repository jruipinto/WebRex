export function recordFromHeaders(
  originalHeaders: Request['headers'],
): Record<string, string> {
  const obj = {} as Record<string, string>;
  originalHeaders.forEach((v, k) => {
    obj[k] = v;
  });

  return obj;
}
