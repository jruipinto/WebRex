import { type } from 'arktype';

export type AppInfoDocument = typeof AppInfoDocument.infer;
export const AppInfoDocument = type({
  installedVersion: 'string',
  installDate: 'string',
});
