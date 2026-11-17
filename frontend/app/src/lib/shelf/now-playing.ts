// biome-ignore-all lint/style/useNamingConvention: the names of environment variables are capitals
/** What the page learns about the track being played now: never when anything was played, only what is playing. */
export type NowPlaying =
  | { readonly playing: false }
  | {
      readonly playing: true;
      readonly title: string;
      readonly artist: string;
      readonly url?: string;
    };

const API = 'https://ws.audioscrobbler.com/2.0/';

export function recentTrackUrl(user: string, apiKey: string): string {
  const query = new URLSearchParams([
    ['method', 'user.getrecenttracks'],
    ['user', user],
    ['limit', '1'],
    ['api_key', apiKey],
    ['format', 'json'],
  ]);
  return `${API}?${query}`;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asText = (value: unknown): string | null => (typeof value === 'string' && value.length > 0 ? value : null);

/** The newest track of Last.fm's answer, if it is marked as playing now. Anything else, including an error answer, is "not playing". */
export function parseNowPlaying(data: unknown): NowPlaying {
  const tracks = asRecord(asRecord(data)?.['recenttracks'])?.['track'];
  const first = asRecord(Array.isArray(tracks) ? tracks[0] : tracks);
  const marker = asRecord(first?.['@attr'])?.['nowplaying'];
  const title = asText(first?.['name']);
  const artist = asText(asRecord(first?.['artist'])?.['#text']);
  if (marker !== 'true' || !title || !artist) {
    return { playing: false };
  }
  const url = asText(first?.['url']);
  return { playing: true, title, artist, ...(url?.startsWith('https://www.last.fm/') && { url }) };
}

export interface NowPlayingEnvironment {
  readonly LASTFM_API_KEY?: string | undefined;
  readonly LASTFM_USER?: string | undefined;
}

export interface NowPlayingResponse {
  readonly status: number;
  readonly body: NowPlaying;
  /** Seconds the answer may be kept: short, so it feels live, and so many visitors cost one request. */
  readonly maxAge: number;
}

/** The answer of the endpoint. The key stays on the server; a failure is "not playing", never an error that names anything. */
export async function nowPlayingResponse(
  environment: NowPlayingEnvironment,
  fetcher: (address: string) => Promise<Response>,
): Promise<NowPlayingResponse> {
  const { LASTFM_API_KEY: key, LASTFM_USER: user } = environment;
  if (!(key && user)) {
    return { status: 503, body: { playing: false }, maxAge: 60 };
  }
  try {
    const answer = await fetcher(recentTrackUrl(user, key));
    return { status: 200, body: answer.ok ? parseNowPlaying(await answer.json()) : { playing: false }, maxAge: 20 };
  } catch {
    return { status: 200, body: { playing: false }, maxAge: 20 };
  }
}
