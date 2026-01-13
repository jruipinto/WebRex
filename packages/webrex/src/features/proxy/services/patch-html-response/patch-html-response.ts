// import * as esbuild from 'esbuild';
// Below is the version of esbuild that works in deno compiled mode. Others break in compiled mode
import * as esbuild from 'https://deno.land/x/esbuild@v0.27.1/mod.js'
import _patch from './patch.ts' with { type: 'text' };

/**
 * Patches all html responses from API so that the proxied apps
 * are ready and have all needed patches to work in this proxy correctly
 */
export async function patchHtmlResponses(
  resp: Response,
  isMF = false
): Promise<Response> {
  const contentType = resp.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') || resp.status !== 200) {
    return resp;
  }

  const text = await resp.text();

  const transformedPatch = await esbuild.transform(_patch, {
    target: 'es6',
    loader: 'ts',
  });

  await esbuild.stop()

  let modified = text
    .replace(
      '<head>',
      `<head>\n        <script>${transformedPatch.code}</script>\n`
    )
    .replace(
      'top.location = self.location;',
      '// top.location = self.location;'
    )
    .replace('self === top', 'true');

  if (isMF) {
    // prefix base href with "/mf" so that iframes can be proxied without conflicts, as well
    modified = modified.replace(/href="/, 'href="/mf');
  }

  return new Response(modified, {
    status: resp.status,
    headers: resp.headers,
  });
}
