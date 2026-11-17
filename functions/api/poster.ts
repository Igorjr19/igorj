import { posterResponse } from '../../frontend/app/src/lib/poster-proxy.ts';

/** A Letterboxd poster for the room to draw: see lib/poster-proxy.ts for what it fetches and why. */
export async function onRequestGet(context: { readonly request: Request }): Promise<Response> {
  const wanted = new URL(context.request.url).searchParams.get('u');
  return posterResponse(wanted, (address) => fetch(address));
}
