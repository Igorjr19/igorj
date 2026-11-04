import { assertEquals } from '@std/assert';
import { diaryFeedUrl, parseDiaryFeed } from '../../../tools/external/letterboxd.ts';

const FEED = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:letterboxd="https://letterboxd.com">
  <channel>
    <title>Letterboxd - Someone</title>
    <item>
      <title>Film &amp; Sons, 2024 - ★★★★½</title>
      <link>https://letterboxd.com/someone/film/film-and-sons/</link>
      <letterboxd:watchedDate>2026-11-02</letterboxd:watchedDate>
      <letterboxd:rewatch>No</letterboxd:rewatch>
      <letterboxd:filmTitle>Film &amp; Sons</letterboxd:filmTitle>
      <letterboxd:filmYear>2024</letterboxd:filmYear>
      <letterboxd:memberRating>4.5</letterboxd:memberRating>
      <description><![CDATA[<p>A review that never reaches the site.</p>]]></description>
    </item>
    <item>
      <title>A list</title>
      <link>https://letterboxd.com/someone/list/a-list/</link>
      <description><![CDATA[<p>Lists have no film title.</p>]]></description>
    </item>
    <item>
      <title>Unrated, 1999</title>
      <link>https://letterboxd.com/someone/film/unrated/</link>
      <letterboxd:watchedDate>2026-11-01</letterboxd:watchedDate>
      <letterboxd:filmTitle>Unrated</letterboxd:filmTitle>
      <letterboxd:filmYear>1999</letterboxd:filmYear>
    </item>
    <item>
      <title>Film &amp; Sons, 2024</title>
      <link>https://letterboxd.com/someone/film/film-and-sons/1/</link>
      <letterboxd:watchedDate>2026-10-20</letterboxd:watchedDate>
      <letterboxd:filmTitle>Film &amp; Sons</letterboxd:filmTitle>
      <letterboxd:filmYear>2024</letterboxd:filmYear>
    </item>
  </channel>
</rss>`;

Deno.test('diaryFeedUrl points at the public RSS feed of the member', () => {
  assertEquals(diaryFeedUrl('Someone'), 'https://letterboxd.com/Someone/rss/');
});

Deno.test('parseDiaryFeed keeps title, year, rating and link, never the watch date or the review', () => {
  assertEquals(parseDiaryFeed(FEED, '2026-11-04'), {
    updated: '2026-11-04',
    films: [
      { title: 'Film & Sons', year: 2024, rating: 4.5, url: 'https://letterboxd.com/someone/film/film-and-sons/' },
      { title: 'Unrated', year: 1999, url: 'https://letterboxd.com/someone/film/unrated/' },
    ],
  });
});

Deno.test('parseDiaryFeed lists a rewatched film once and stops at the limit', () => {
  assertEquals(
    parseDiaryFeed(FEED, '2026-11-04', 1).films.map((film) => film.title),
    ['Film & Sons'],
  );
});
