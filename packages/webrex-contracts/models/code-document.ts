import { type } from 'arktype';

export type CodeDocument = typeof CodeDocument.infer;
export const CodeDocument = type({
  /**
   * This is the TS representation of the configuration object.
   * For safety reasons, this is not evaluated on server side.
   * Consume is responsible to managing code, evaluating it and send the code & codeResultPair
   */
  codeTS: 'string',
  /**
   * This is the actual configuration being used
   * (basically the evaluation result of code, which server ignores for security reasons)
   */
  codeJS: 'string',
});
