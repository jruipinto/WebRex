import { basename } from 'node:path';

export function isCompiledMode(): boolean {
  const COMPILED_APP_NAME = 'WebRex';
  return new RegExp(COMPILED_APP_NAME).test(basename(Deno.execPath()));
}
