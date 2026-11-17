/**
 * The room draws posters on 3D surfaces, and the browser only allows that for pictures the service lets other
 * sites read. Letterboxd's do not, so the room asks for them through the site's own server, which fetches only
 * from the one host and the one folder the posters live in.
 */
const HOST = 'a.ltrbxd.com';
const FOLDER = '/resized/';
const LARGEST = 600_000;

/** The address a poster may be fetched from, or null for anything else. */
export function posterSource(raw: string | null): URL | null {
  if (!raw) {
    return null;
  }
  let address: URL;
  try {
    address = new URL(raw);
  } catch {
    return null;
  }
  return address.protocol === 'https:' && address.host === HOST && address.pathname.startsWith(FOLDER) ? address : null;
}

/** The answer for a poster: the picture and how long it may be kept, or a short refusal. */
export async function posterResponse(
  raw: string | null,
  fetcher: (address: URL) => Promise<Response>,
): Promise<Response> {
  const source = posterSource(raw);
  if (!source) {
    return new Response('Not a poster', { status: 400 });
  }
  let upstream: Response;
  try {
    upstream = await fetcher(source);
  } catch {
    return new Response('The poster could not be read', { status: 502 });
  }
  const type = upstream.headers.get('content-type') ?? '';
  const size = Number(upstream.headers.get('content-length') ?? 0);
  if (!(upstream.ok && type.startsWith('image/')) || size > LARGEST) {
    return new Response('The poster could not be read', { status: 502 });
  }
  return new Response(upstream.body, {
    headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' },
  });
}
