export type InterceptorDocument = {
  /**
   * This is the TS representation of the configuration object.
   * For safety reasons, this is not evaluated on server side.
   * Consume is responsible to managing code, evaluating it and send the code & codeResultPair
   */
  codeTS: string;
  /**
   * This is the actual configuration being used
   * (basically the evaluation result of code, which server ignores for security reasons)
   */
  codeJS: string;
  type: 'http-request-interceptor' | 'http-response-interceptor';
  enabled: boolean;
  /**
   * URL.pathname to match which can be expressed as string or string regular expression.
   */
  context: string;
  /** You may group many related interceptors, together, in a folder, to improve UX */
  folder: string;
  /** The interceptor name. Helps to convey the usefullness of the interceptor (the same way as a function name does) */
  name: string;
};
