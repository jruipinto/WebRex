import { type } from 'arktype';
import { CodeDocument } from './code-document';

export type ReplDocument = typeof ReplDocument.infer;
export const ReplDocument = type({
  '...': CodeDocument,
  /**
   * The full path of the snippet. ie: "/favorites/a/my-snippet.ts"
   */
  'context?': 'string',
});
