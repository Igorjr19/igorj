import * as v from '@valibot/valibot';

const Text = v.pipe(v.string(), v.nonEmpty());
const Slug = v.pipe(v.string(), v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a lowercase slug'));
const Url = v.pipe(v.string(), v.url());
const Email = v.pipe(v.string(), v.email());
const Month = v.pipe(v.string(), v.regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Expected a month as YYYY-MM'));
// YAML turns unquoted ISO dates into Date objects; Hugo also accepts them quoted.
const DAY_FORMAT = 'Expected a date as YYYY-MM-DD';
const Day = v.union([v.date(), v.pipe(v.string(), v.isoDate(DAY_FORMAT))], DAY_FORMAT);
const Example = v.optional(v.boolean());

const PostSchema = v.strictObject({
  example: Example,
  title: Text,
  summary: Text,
  date: Day,
  lastmod: v.optional(Day),
  categories: v.pipe(v.array(Slug), v.length(1, 'A post has exactly one category')),
  draft: v.optional(v.boolean()),
  slug: v.optional(Slug),
});

const ProjectSchema = v.strictObject({
  example: Example,
  title: Text,
  summary: Text,
  period: v.pipe(
    v.strictObject({ start: Month, end: v.optional(Month) }),
    v.check(({ start, end }) => end === undefined || end >= start, 'The period ends before it starts'),
  ),
  status: v.picklist(['completed', 'in-progress', 'paused', 'abandoned']),
  stack: v.array(Text),
  links: v.optional(v.strictObject({ repository: v.optional(Url), demo: v.optional(Url) })),
  featured: v.optional(v.boolean()),
  slug: v.optional(Slug),
});

const ResearchSchema = v.strictObject({
  example: Example,
  title: Text,
  kind: v.picklist(['article', 'thesis', 'presentation', 'poster']),
  year: v.pipe(v.number(), v.integer(), v.minValue(1900), v.maxValue(2100)),
  authors: v.pipe(v.array(Text), v.nonEmpty()),
  venue: Text,
  file: v.optional(Text),
  doi: v.optional(v.pipe(v.string(), v.regex(/^10\.\d{4,9}\/\S+$/, 'Expected a DOI such as 10.1000/xyz'))),
  slug: v.optional(Slug),
});

const AboutSchema = v.strictObject({
  example: Example,
  lines: v.pipe(v.array(Text), v.length(3, 'The about text has exactly three lines')),
  photoAlt: Text,
  location: Text,
  now: v.strictObject({ work: Text, masters: Text, studying: Text }),
  lastmod: Day,
});

const Profile = v.strictObject({ network: Text, url: Url });

// Keys follow JSON Resume so the CV can be exported to its tools.
const CvSchema = v.strictObject({
  example: Example,
  basics: v.strictObject({
    name: Text,
    label: Text,
    summary: Text,
    email: Email,
    url: Url,
    location: Text,
    profiles: v.array(Profile),
  }),
  work: v.array(
    v.strictObject({
      name: Text,
      position: Text,
      startDate: Month,
      endDate: v.optional(Month),
      location: v.optional(Text),
      summary: v.optional(Text),
      highlights: v.optional(v.array(Text)),
    }),
  ),
  education: v.array(
    v.strictObject({
      institution: Text,
      studyType: Text,
      area: Text,
      startDate: v.optional(Month),
      endDate: v.optional(Month),
    }),
  ),
  skills: v.array(v.strictObject({ name: Text, keywords: v.array(Text) })),
  languages: v.array(v.strictObject({ language: Text, fluency: Text })),
  publications: v.optional(v.array(v.strictObject({ research: Slug }))),
});

const ContactLink = v.strictObject({ network: Text, url: Url, note: v.optional(Text) });

const ContactSchema = v.strictObject({
  example: Example,
  email: v.strictObject({ pt: Email, en: Email }),
  professional: v.array(ContactLink),
  personal: v.array(ContactLink),
});

const ReadingSchema = v.strictObject({
  example: Example,
  items: v.array(
    v.strictObject({
      title: Text,
      authors: v.pipe(v.array(Text), v.nonEmpty()),
      kind: v.picklist(['book', 'paper']),
      url: v.optional(Url),
    }),
  ),
});

// Written by the daily job in the content repository; no field may say when something was played or watched.
const MusicSchema = v.strictObject({
  example: Example,
  updated: Day,
  period: v.picklist(['week', 'month']),
  artists: v.array(
    v.strictObject({ name: Text, plays: v.pipe(v.number(), v.integer(), v.minValue(1)), url: v.optional(Url) }),
  ),
});

const FilmsSchema = v.strictObject({
  example: Example,
  updated: Day,
  films: v.array(
    v.strictObject({
      title: Text,
      year: v.pipe(v.number(), v.integer()),
      rating: v.optional(v.pipe(v.number(), v.minValue(0.5), v.maxValue(5), v.multipleOf(0.5))),
      url: v.optional(Url),
    }),
  ),
});

type ContentSchema = v.GenericSchema<unknown>;

const LANGUAGE = '(?:pt|en)';

const SCHEMAS_BY_PATH: readonly (readonly [RegExp, ContentSchema])[] = [
  [new RegExp(`^posts/[^/]+/index\\.${LANGUAGE}\\.md$`), PostSchema],
  [new RegExp(`^projects/[^/]+/index\\.${LANGUAGE}\\.md$`), ProjectSchema],
  [new RegExp(`^research/[^/]+/index\\.${LANGUAGE}\\.md$`), ResearchSchema],
  [new RegExp(`^about/about\\.${LANGUAGE}\\.yaml$`), AboutSchema],
  [new RegExp(`^cv/cv\\.${LANGUAGE}\\.yaml$`), CvSchema],
  [/^contact\/contact\.yaml$/, ContactSchema],
  [/^reading\/reading\.yaml$/, ReadingSchema],
  [/^external\/music\.json$/, MusicSchema],
  [/^external\/films\.json$/, FilmsSchema],
];

/** Picks the schema from the path relative to the content root, so a misplaced or misnamed file is reported too. */
export function schemaForPath(path: string): ContentSchema | null {
  return SCHEMAS_BY_PATH.find(([pattern]) => pattern.test(path))?.[1] ?? null;
}

/** Returns a readable list of problems, or null when the data matches the schema. */
export function summarizeIssues(schema: ContentSchema, data: unknown): string | null {
  const result = v.safeParse(schema, data);
  return result.success ? null : v.summarize(result.issues);
}
