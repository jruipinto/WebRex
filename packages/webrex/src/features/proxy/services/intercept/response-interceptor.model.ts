export type ResponseInterceptor = (
  originalResponse: Response
) => Promise<Response>;
