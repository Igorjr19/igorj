import { type NowPlayingEnvironment, nowPlayingResponse } from '../../frontend/app/src/lib/shelf/now-playing.ts';

/**
 * The track being played now, read from Last.fm with a key that never leaves the server. Set LASTFM_API_KEY as a
 * secret and LASTFM_USER as a variable in the Pages project; without them the answer is "not playing".
 */
export async function onRequestGet(context: { readonly env: NowPlayingEnvironment; readonly request: Request }): Promise<Response> {
  const { status, body, maxAge } = await nowPlayingResponse(context.env, (address) => fetch(address));
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${maxAge}` },
  });
}
