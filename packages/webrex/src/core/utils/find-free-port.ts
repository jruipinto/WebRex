import { createServer } from 'node:net';

const MAX_TRIES = 100;

export async function findFreePort({
  basePort,
}: {
  basePort: number;
}): Promise<number> {
  const checkPort = (port: number): Promise<boolean> =>
    new Promise((resolve) => {
      const server = createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });

  for (let i = 0; i < MAX_TRIES; i++) {
    const port = basePort + i;
    if (await checkPort(port)) return port;
  }

  throw new Error(
    `No free port found in range ${basePort} to ${basePort + MAX_TRIES - 1}`
  );
}
