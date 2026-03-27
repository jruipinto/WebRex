/**
 * Forwards the provided request to the provided URL
 * and returns a tupple with Response and Error (if any)
 */
export async function forwardRequestToUrl(
  req: Request,
  proxyUrl: URL,
): Promise<readonly [Response, null | Error]> {
  const _req = req.clone();
  const headers = new Headers(_req.headers);
  headers.has('Host') && headers.set('Host', proxyUrl.hostname);
  headers.has('Origin') && headers.set('Origin', proxyUrl.origin);
  headers.has('Access-Control-Allow-Origin') &&
    headers.set('Access-Control-Allow-Origin', proxyUrl.origin);
  headers.has('Referer') && headers.set('Referer', proxyUrl.origin);

  //   headers.has('host') && headers.set('host', proxyUrl.hostname);
  // headers.has('origin') && headers.set('origin', proxyUrl.origin);
  // headers.has('access-control-allow-origin') &&
  //   headers.set('access-control-allow-origin', proxyUrl.origin);
  // headers.has('referer') && headers.set('referer', proxyUrl.origin);

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

  // headers.delete('content-security-policy');
  headers.delete('X-Origin');
  headers.delete('ngrok-skip-browser-warning');
  headers.delete('x-forwarded-for');
  headers.delete('x-forwarded-host');
  headers.delete('x-forwarded-proto');

  const fetchParams = {
    headers,
    // redirect: 'manual',
    body: _req.body,
    method: _req.method,
  } satisfies RequestInit;

  const acceptableContentTypes = _req.headers
    .get('Accept')
    ?.split(',')
    .map((type) => type.replace('*', '.*'))
    .map((type) => new RegExp(type));

  try {
    // console.log(
    //   `[${new Date().toISOString()}]  Trying ... ${req.method.padEnd(
    //     6,
    //     ' '
    //   )} ${proxyUrl.toString()}`
    // );

    const response = await fetch(proxyUrl, fetchParams);

    if (response.status === 403) {
      console.log('proxyUrl', proxyUrl);
      console.log('fetchParams', fetchParams);
    }

    // console.log(
    //   `[${new Date().toISOString()}]  ...... ${
    //     response.status
    //   } ${req.method.padEnd(6, ' ')} ${proxyUrl.toString()}`
    // );

    const responseContentType = response.headers.get('Content-Type');
    if (
      /2\d\d/.test(String(response.status)) &&
      responseContentType &&
      acceptableContentTypes &&
      !acceptableContentTypes.some((type) => type.test(responseContentType))
    ) {
      return [
        Response.json({ status: 'Not found' }, { status: 404 }),
        null,
      ] as const;
    }

    const responseHeaders = new Headers(response.headers);
    // ---- Disable service workers to avoid conflict with this proxy
    // responseHeaders.delete('Content-Security-Policy');
    // responseHeaders.set('Content-Security-Policy', "worker-src 'none';");
    // responseHeaders.set('Service-Worker-Allowed', '/');
    // -----

    return [
      new Response(response.body, {
        headers: responseHeaders,
        status: response.status,
        statusText: response.statusText,
      }),
      null,
    ] as const;
  } catch (error) {
    return [
      Response.json(
        { status: 'WebRex forwardRequestToUrl threw exception' },
        {
          status: 500,
          statusText: 'WebRex forwardRequestToUrl threw exception',
        },
      ),
      error as Error,
    ] as const;
  }
}
