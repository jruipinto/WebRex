export type ReplDocument = {
  codeTS: string;
  codeJS: string;
  /**
   * URL.pathname to match which can be expressed as string or string regular expression.
   */
  context: string;
  /** The interceptor name. Helps to convey the usefullness of the interceptor (the same way as a function name does) */
  name: string;
};
