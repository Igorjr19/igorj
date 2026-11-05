import { serveDir, serveFile } from '@std/http/file-server';
import { dirname, join } from '@std/path';

export interface StaticServer extends AsyncDisposable {
  readonly url: string;
}

/** Cloudflare Pages answers an unknown path with the closest 404.html, walking up to the root. */
async function nearestNotFound(root: string, pathname: string): Promise<string | null> {
  for (let dir = dirname(pathname.endsWith('/') ? `${pathname}x` : pathname); ; dir = dirname(dir)) {
    const candidate = join(root, dir, '404.html');
    try {
      await Deno.stat(candidate);
      return candidate;
    } catch {
      if (dir === '/') {
        return null;
      }
    }
  }
}

/** Serves the fixture build on a random local port. */
export function serveSite(root = 'generated/fixture-site'): StaticServer {
  const server = Deno.serve({ port: 0, hostname: '127.0.0.1', onListen: () => undefined }, async (request) => {
    const response = await serveDir(request, { fsRoot: root, quiet: true });
    if (response.status !== 404) {
      return response;
    }
    const page = await nearestNotFound(root, new URL(request.url).pathname);
    if (!page) {
      return response;
    }
    const notFound = await serveFile(request, page);
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  });
  return {
    url: `http://127.0.0.1:${server.addr.port}`,
    [Symbol.asyncDispose]: () => server.shutdown(),
  };
}
