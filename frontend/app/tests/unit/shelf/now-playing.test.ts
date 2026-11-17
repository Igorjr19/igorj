// biome-ignore-all lint/style/useNamingConvention: the names of environment variables are capitals
import { assert, assertEquals } from '@std/assert';
import { nowPlayingResponse, parseNowPlaying, readAnswer, recentTrackUrl } from '../../../src/lib/shelf/now-playing.ts';

const TRACK = (extra: Record<string, unknown>) => ({
  recenttracks: {
    track: [
      {
        artist: { mbid: '', '#text': 'A Band' },
        name: 'A Song',
        url: 'https://www.last.fm/music/A+Band/_/A+Song',
        image: [{ size: 'small', '#text': '' }],
        ...extra,
      },
    ],
  },
});

Deno.test('the newest track marked as playing is the one playing now, with its title, artist and link', () => {
  assertEquals(parseNowPlaying(TRACK({ '@attr': { nowplaying: 'true' } })), {
    playing: true,
    title: 'A Song',
    artist: 'A Band',
    url: 'https://www.last.fm/music/A+Band/_/A+Song',
  });
});

Deno.test('a track with a date was played before and is not playing now, and the date is never passed on', () => {
  const parsed = parseNowPlaying(TRACK({ date: { uts: '1794831790', '#text': '16 Nov 2026, 12:23' } }));
  assertEquals(parsed, { playing: false });
  assert(!JSON.stringify(parsed).includes('2026'));
});

Deno.test('an answer that is not the expected shape, an error, or has no track is not playing, never a crash', () => {
  for (const data of [
    null,
    'x',
    {},
    { error: 10, message: 'Invalid API key' },
    { recenttracks: { track: [] } },
    { recenttracks: {} },
  ]) {
    assertEquals(parseNowPlaying(data), { playing: false });
  }
});

Deno.test('a link that does not point to Last.fm is dropped, and a track with no title or artist is not playing', () => {
  const playing = { '@attr': { nowplaying: 'true' } };
  assertEquals(parseNowPlaying(TRACK({ ...playing, url: 'https://evil.example/x' })), {
    playing: true,
    title: 'A Song',
    artist: 'A Band',
  });
  assertEquals(parseNowPlaying(TRACK({ ...playing, name: '' })), { playing: false });
});

Deno.test('the address asks for the single newest track as JSON', () => {
  const url = new URL(recentTrackUrl('someone', 'key'));
  assertEquals(url.searchParams.get('method'), 'user.getrecenttracks');
  assertEquals(url.searchParams.get('limit'), '1');
});

const environment = { LASTFM_API_KEY: 'SECRET-KEY', LASTFM_USER: 'someone' };
const respond =
  (data: unknown, ok = true) =>
  () =>
    Promise.resolve(new Response(JSON.stringify(data), { status: ok ? 200 : 500 }));

Deno.test('without the key or the user the endpoint says it is not configured, and asks nothing of Last.fm', async () => {
  let asked = false;
  const fetcher = () => {
    asked = true;
    return Promise.resolve(new Response('{}'));
  };
  assertEquals((await nowPlayingResponse({}, fetcher)).status, 503);
  assertEquals((await nowPlayingResponse({ LASTFM_USER: 'someone' }, fetcher)).status, 503);
  assertEquals(asked, false);
});

Deno.test('a playing track is answered with a short cache, and the key is never part of the answer', async () => {
  const result = await nowPlayingResponse(environment, respond(TRACK({ '@attr': { nowplaying: 'true' } })));
  assertEquals([result.status, result.maxAge, result.body.playing], [200, 20, true]);
  assert(!JSON.stringify(result).includes('SECRET-KEY'));
});

Deno.test('Last.fm failing, by status or by network, is "not playing" without a word of why', async () => {
  const byStatus = await nowPlayingResponse(environment, respond({ error: 8 }, false));
  assertEquals(byStatus.body, { playing: false });
  const byNetwork = await nowPlayingResponse(environment, () =>
    Promise.reject(new Error('https://ws.audioscrobbler.com/?api_key=SECRET-KEY unreachable')),
  );
  assertEquals(byNetwork.body, { playing: false });
  assert(!JSON.stringify(byNetwork).includes('SECRET-KEY'));
});

Deno.test('the answer of the endpoint counts as playing only with a title and an artist, so a broken one never shows half a line', () => {
  assertEquals(readAnswer({ playing: true, title: 'A Song', artist: 'A Band', url: 'https://x.example/a' }), {
    playing: true,
    title: 'A Song',
    artist: 'A Band',
    url: 'https://x.example/a',
  });
  assertEquals(readAnswer({ playing: true, title: 'Only a title' }), { playing: false });
  assertEquals(readAnswer({ playing: false, title: 'A Song', artist: 'A Band' }), { playing: false });
  assertEquals(readAnswer(null), { playing: false });
  assertEquals(readAnswer('playing'), { playing: false });
});
