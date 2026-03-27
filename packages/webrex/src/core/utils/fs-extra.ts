import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Equivalent to Deno2 ensureDir */
export const ensureDir = (path: string) => mkdir(path, { recursive: true });

/** Equivalent to Deno2 ensureFile */
export const ensureFile = async (path: string) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, '', { flag: 'a' }); // 'a' ensures no overwrite if exists
};
