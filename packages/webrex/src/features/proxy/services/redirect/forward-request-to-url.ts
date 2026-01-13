/**
 * Forwards the provided request to the provided URL
 * and returns a tupple with Response and Error (if any)
 */
export async function forwardRequestToUrl(
  req: Request,
  proxyUrl: URL
): Promise<readonly [Response, null | Error]> {
  const _req = req.clone();
  const headers = new Headers(_req.headers);
  headers.set('Host', proxyUrl.hostname);
  headers.set('Origin', proxyUrl.origin);
  headers.set('Access-Control-Allow-Origin', proxyUrl.origin);
  headers.set('Referer', proxyUrl.origin);
  // headers.has('Referer')
  //   ? headers.set(
  //       'Referer',
  //       headers
  //         .get('Referer')!
  //         .replace(_req.headers.get('Origin')!, proxyUrl.origin)
  //     )
  //   : null;
  // headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  // headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  // headers.set('Access-Control-Allow-Credentials', 'true');
  headers.delete('content-security-policy');
  headers.delete('X-Origin');

  const fetchParams = {
    headers,
    redirect: 'manual',
    body: _req.body,
    method: _req.method,
  } satisfies RequestInit;

  const acceptableContentTypes = _req.headers
    .get('Accept')
    ?.split(',')
    .map((type) => type.replace('*', '.*'))
    .map((type) => new RegExp(type));

  try {
    const response = await fetch(proxyUrl, fetchParams);
    const responseContentType = response.headers.get('Content-Type');
    if (
      responseContentType &&
      acceptableContentTypes &&
      !acceptableContentTypes.some((type) => type.test(responseContentType))
    ) {
      return [new Response(null, { status: 404 }), null] as const;
    }

    return [response, null] as const;
  } catch (error) {
    return [
      new Response(null, {
        status: 500,
        statusText: 'WebRex forwardRequestToUrl threw exception',
      }),
      error as Error,
    ] as const;
  }
}
