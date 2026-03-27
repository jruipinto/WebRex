import http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';
// import { URL } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Buffer } from 'node:buffer';

/**
 * A function that tries to be compatible with regular fecth but which keeps headers keys casing (regular fetch lowercases all headers).
 * This function is only meant to be used with http1.1 because http2 demands lowercase headers.
 * This function is mostly useful for http1.1 signed requests that still have upercase headers
 */
export async function legacyFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  console.log('Inout headers:', init?.headers)
  const url = new URL(input instanceof Request ? input.url : input.toString());
  const protocol = url.protocol === 'https:' ? https : http;
  const body = init?.body || (input instanceof Request ? input.body : null);

  return new Promise((resolve, reject) => {
    const req = protocol.request(
      url as any,
      {
        method:
          init?.method ?? (input instanceof Request ? input.method : 'GET'),
        headers: init?.headers as Record<string, string>,
      },
      (res) => {
        const chunks: Uint8Array[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () =>
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode,
              headers: res.headers as HeadersInit,
            }),
          ),
        );
      },
    );

    req.on('error', reject);

    if (body instanceof ReadableStream) {
      pipeline(Readable.fromWeb(body as any), req).catch(reject);
    } else {
      req.end(body || null);
    }
  });
}
