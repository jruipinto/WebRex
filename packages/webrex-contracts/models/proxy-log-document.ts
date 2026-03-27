import { type } from 'arktype';

const RequestSchema = type({
  method:
    "'GET'|'POST'|'PUT'|'DELETE'|'PATCH'|'HEAD'|'OPTIONS'|'CONNECT'|'TRACE'",
  url: 'string',
  headers: type({
    '[string]': 'string',
  }),
  body: 'string',
});

const ResponseSchema = type({
  url: 'string',
  headers: type({
    '[string]': 'string',
  }),
  body: 'string',
  status: 'number',
  statusText: 'string',
  ok: 'boolean',
});

export type ProxyLogDocument = typeof ProxyLogDocument.infer;
export const ProxyLogDocument = type({
  correlationId: 'string',
  request: RequestSchema,
  responses: ResponseSchema.array(),
});
