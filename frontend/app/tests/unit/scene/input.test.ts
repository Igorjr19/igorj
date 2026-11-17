import { assertEquals } from '@std/assert';
import { buildSceneInput, LIMITS, posterAt, type SceneSource } from '../../../src/lib/scene/input.ts';

const source: SceneSource = {
  music: {
    artists: Array.from({ length: 7 }, (_, index) => ({ name: `Artist ${index}`, plays: 30 - index })),
    album: { title: 'Album', artist: 'Artist 0', cover: 'https://lastfm-img.freetls.fastly.net/cover.png' },
  },
  films: {
    films: Array.from({ length: 6 }, (_, index) => ({ title: `Film ${index}`, year: 2020 + index, rating: 4 })),
  },
  reading: Array.from({ length: 5 }, (_, index) => ({ title: `Book ${index}`, authors: ['An Author'] })),
};

Deno.test('the room takes no more than it can hold: five artists, four posters and three books', () => {
  const input = buildSceneInput(source);
  assertEquals(input.music?.artists.length, LIMITS.artists);
  assertEquals(input.films.length, LIMITS.films);
  assertEquals(input.books.length, LIMITS.books);
  assertEquals(input.films[0]?.title, 'Film 0');
});

Deno.test('a film with no rating or poster says so with null, so the room draws a card and no stars', () => {
  const input = buildSceneInput({ ...source, films: { films: [{ title: 'Bare', year: 1990 }] } });
  assertEquals(input.films, [{ title: 'Bare', year: 1990, rating: null, poster: null }]);
});

Deno.test('with no music, no films and no reading the room has nothing on its shelves instead of failing', () => {
  assertEquals(buildSceneInput({ music: null, films: null, reading: [] }), { music: null, films: [], books: [] });
  assertEquals(buildSceneInput({ music: { artists: [] }, films: null, reading: [] }).music, null);
});

Deno.test('the album carries its cover when there is one, and null when the service gave none', () => {
  assertEquals(buildSceneInput(source).music?.album?.cover, 'https://lastfm-img.freetls.fastly.net/cover.png');
  assertEquals(
    buildSceneInput({ ...source, music: { artists: source.music?.artists ?? [], album: { title: 'A', artist: 'B' } } })
      .music?.album?.cover,
    null,
  );
});

Deno.test('a poster is asked at the size of the texture, and an address that does not name a size is left as it is', () => {
  const poster = 'https://a.ltrbxd.com/resized/film-poster/1/2/3/1-verity-0-230-0-345-crop.jpg?v=9';
  assertEquals(
    posterAt(poster, 460),
    'https://a.ltrbxd.com/resized/film-poster/1/2/3/1-verity-0-460-0-690-crop.jpg?v=9',
  );
  assertEquals(posterAt(poster, 230), poster);
  assertEquals(posterAt('https://a.ltrbxd.com/plain.jpg', 460), 'https://a.ltrbxd.com/plain.jpg');
});
