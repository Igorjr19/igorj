import { schemaForPath, summarizeIssues } from '../content/schema.ts';
import { parseTopArtists, topArtistsUrl } from '../external/lastfm.ts';
import { diaryFeedUrl, parseDiaryFeed } from '../external/letterboxd.ts';
import { fetchBytes } from '../shared/download.ts';

const OUTPUT_DIR = 'content/external';
const today = new Date().toISOString().slice(0, 10);
const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

interface Source {
  readonly file: string;
  readonly load: () => Promise<unknown>;
}

const lastfmUser = Deno.env.get('LASTFM_USER');
const apiKey = Deno.env.get('LASTFM_API_KEY');
const letterboxdUser = Deno.env.get('LETTERBOXD_USER');

const sources: Source[] = [
  ...(lastfmUser && apiKey
    ? [
        {
          file: 'music.json',
          load: async () =>
            parseTopArtists(JSON.parse(text(await fetchBytes(topArtistsUrl(lastfmUser, apiKey)))), today),
        },
      ]
    : []),
  ...(letterboxdUser
    ? [
        {
          file: 'films.json',
          load: async () => parseDiaryFeed(text(await fetchBytes(diaryFeedUrl(letterboxdUser))), today),
        },
      ]
    : []),
];

if (sources.length === 0) {
  console.log('No source configured; set LASTFM_USER and LASTFM_API_KEY, or LETTERBOXD_USER.');
}

await Deno.mkdir(OUTPUT_DIR, { recursive: true });
for (const { file, load } of sources) {
  try {
    const summary = await load();
    const schema = schemaForPath(`external/${file}`);
    const issues = schema && summarizeIssues(schema, summary);
    if (issues) {
      throw new Error(`invalid data:\n${issues}`);
    }
    await Deno.writeTextFile(`${OUTPUT_DIR}/${file}`, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(`Wrote ${OUTPUT_DIR}/${file}.`);
  } catch (error) {
    // A failed source never breaks the site: the last valid file stays as it is.
    const message = String(error instanceof Error ? error.message : error).replaceAll(apiKey ?? '\0', '***');
    console.log(`::warning::${file} was not refreshed: ${message}`);
  }
}
