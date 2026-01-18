import { type } from 'arktype';
import { ReplDocument } from './repl-document';

export type ReplOutputDocument = typeof ReplOutputDocument.infer;
export const ReplOutputDocument = type({
  '...': ReplDocument,
  /**
   * The result of evaluating code in codeJS/codeTS
   */
  'result?': 'string',
});
