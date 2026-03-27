import { type } from 'arktype';
import { ReplDocument } from './repl-document';

const ExportedDefaultAsyncFunctionSchema = type(
  '/^export\\s+default\\s+async\\s+function\\s*\\(/'
);

export type InterceptorDocument = typeof InterceptorDocument.infer;
export const InterceptorDocument = type({
  '...': ReplDocument,
  codeJS: ExportedDefaultAsyncFunctionSchema,
  context: 'string',
  /** Only response interceptors are supported, currently. Maybe in future it can be extended to request as well */
  type: "'http-request-interceptor' | 'http-response-interceptor'",
  enabled: 'boolean',
  /** The interceptor name. Helps to convey the usefullness of the interceptor (the same way as a function name does) */
  'name?': 'string',
});
