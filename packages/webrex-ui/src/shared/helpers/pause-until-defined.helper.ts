export function pauseUntilDefined(
  cb: () => unknown,
  options = { timeout: 6000 }
): Promise<true> {
  return new Promise((resolve) => {
    const timeoutRef = setTimeout(() => {
      throw new Error('Timeout. Reference took too long to get defined.');
    }, options.timeout);

    const interval = setInterval(() => {
      const ref = cb();
      if (typeof ref === 'undefined' || ref === null) {
        return;
      }
      clearInterval(interval);
      clearTimeout(timeoutRef);
      resolve(true);
    }, 100);
  });
}
