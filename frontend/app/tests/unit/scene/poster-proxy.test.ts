import { assertEquals } from '@std/assert';
import { posterResponse, posterSource } from '../../../src/lib/poster-proxy.ts';

const POSTER = 'https://a.ltrbxd.com/resized/film-poster/1/2/3/1-verity-0-460-0-690-crop.jpg?v=9';

Deno.test('only a picture from the poster folder of Letterboxd, over https, may be fetched', () => {
  assertEquals(posterSource(POSTER)?.host, 'a.ltrbxd.com');
  assertEquals(posterSource('http://a.ltrbxd.com/resized/x.jpg'), null);
  assertEquals(posterSource('https://a.ltrbxd.com/avatar/x.jpg'), null);
  assertEquals(posterSource('https://evil.example/resized/x.jpg'), null);
  assertEquals(posterSource('https://a.ltrbxd.com.evil.example/resized/x.jpg'), null);
  assertEquals(posterSource('not an address'), null);
  assertEquals(posterSource(null), null);
});

Deno.test('a poster is passed on with its type and kept for a day', async () => {
  const response = await posterResponse(POSTER, () =>
    Promise.resolve(new Response('bytes', { headers: { 'content-type': 'image/jpeg' } })),
  );
  assertEquals(response.status, 200);
  assertEquals(response.headers.get('content-type'), 'image/jpeg');
  assertEquals(response.headers.get('cache-control'), 'public, max-age=86400');
});

Deno.test('what is not a poster, is not a picture, is too big or cannot be reached is refused without fetching what it should not', async () => {
  let fetched = 0;
  const fetcher = (answer: Response) => () => {
    fetched += 1;
    return Promise.resolve(answer);
  };
  assertEquals((await posterResponse('https://evil.example/resized/x.jpg', fetcher(new Response('x')))).status, 400);
  assertEquals(fetched, 0);
  const html = new Response('<html>', { headers: { 'content-type': 'text/html' } });
  assertEquals((await posterResponse(POSTER, fetcher(html))).status, 502);
  const big = new Response('x', { headers: { 'content-type': 'image/jpeg', 'content-length': '900000' } });
  assertEquals((await posterResponse(POSTER, fetcher(big))).status, 502);
  assertEquals((await posterResponse(POSTER, () => Promise.reject(new Error('down')))).status, 502);
});
