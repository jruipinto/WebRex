import { WebRexConfiguration } from '@models/configuration.ts';

export async function mockFromHAR({
  req,
  conf,
}: {
  req: Request;
  conf: WebRexConfiguration;
}): Promise<readonly [Response, URL] | undefined> {
  const reqUrl = new URL(req.url);
  if (
    conf.mockFromHAR?.disabled ||
    !conf.mockFromHAR?.context ||
    !conf.mockFromHAR?.target ||
    !new RegExp(conf.mockFromHAR.context, 'i').test(reqUrl.pathname)
  ) {
    return;
  }

  const harPath = new URL(
    import.meta.resolve(conf.mockFromHAR.target.replace('\\', '/'))
  );
  const har = await Deno.readTextFile(harPath)
    .then((harString) => JSON.parse(harString) as HAR)
    .catch((error) => {
      console.log(`Error loading HAR file ${harPath.href}`, error);
      return null;
    });

  const response = har?.log?.entries
    .reverse()
    .find(
      (e) =>
        reqUrl.pathname === new URL(e.request.url).pathname &&
        req.method === e.request.method &&
        e.response.content.mimeType === 'application/json'
    )?.response?.content?.text;

  if (!response) {
    return;
  }

  return [
    new Response(response),
    new URL(req.url.replace('http', 'har')),
  ] as const;
}

type HAR = {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    pages: {
      startedDateTime: string;
      id: string;
      pageTimings: {
        onContentLoad: number;
        onLoad: number;
      };
    }[];
    entries: {
      request: {
        method: 'GET' | 'POST' | 'PATCH' | 'UPDATE' | 'DELETE';
        url: string;
        headers: {
          name: string;
          value: string;
        }[];
      };
      response: {
        status: number;
        statusText: string;
        headers: {
          name: string;
          value: string;
        }[];
        content: {
          size: number;
          mimeType:
            | 'text/html'
            | 'application/javascript'
            | 'text/css'
            | 'font/woff2'
            | 'application/json';
          compression: number;
          text: string;
        };
      };
    }[];
  };
};
