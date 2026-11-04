import { assertEquals, assertThrows } from '@std/assert';
import { parseTopArtists, topArtistsUrl } from '../../../tools/external/lastfm.ts';

const RESPONSE = {
  topartists: {
    artist: [
      {
        name: 'First Artist',
        playcount: '42',
        url: 'https://www.last.fm/music/First+Artist',
        mbid: '',
        '@attr': { rank: '1' },
      },
      { name: 'Second Artist', playcount: '7', url: 'https://www.last.fm/music/Second+Artist' },
      { name: 'Silent Artist', playcount: '0', url: 'https://www.last.fm/music/Silent+Artist' },
    ],
    '@attr': { user: 'someone', page: '1', perPage: '5', totalPages: '1', total: '3' },
  },
};

Deno.test('topArtistsUrl asks for the top artists of the last seven days as JSON', () => {
  const url = new URL(topArtistsUrl('someone', 'key', 3));
  assertEquals(
    [...url.searchParams],
    [
      ['method', 'user.gettopartists'],
      ['user', 'someone'],
      ['period', '7day'],
      ['limit', '3'],
      ['api_key', 'key'],
      ['format', 'json'],
    ],
  );
});

Deno.test('parseTopArtists keeps name, plays and link, and drops artists without plays', () => {
  assertEquals(parseTopArtists(RESPONSE, '2026-11-04'), {
    updated: '2026-11-04',
    period: 'week',
    artists: [
      { name: 'First Artist', plays: 42, url: 'https://www.last.fm/music/First+Artist' },
      { name: 'Second Artist', plays: 7, url: 'https://www.last.fm/music/Second+Artist' },
    ],
  });
});

Deno.test('parseTopArtists rejects an error response, so the last valid summary is kept', () => {
  assertThrows(() => parseTopArtists({ error: 10, message: 'Invalid API key' }, '2026-11-04'));
});
