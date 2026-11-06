import * as v from '@valibot/valibot';

const ShareFontSchema = v.strictObject({
  file: v.pipe(v.string(), v.regex(/^[A-Za-z0-9-]+\.ttf$/)),
  url: v.pipe(v.string(), v.url(), v.startsWith('https://')),
  sha256: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
});

const ShareManifestSchema = v.strictObject({
  fonts: v.pipe(v.array(ShareFontSchema), v.nonEmpty()),
});

export type ShareManifest = v.InferOutput<typeof ShareManifestSchema>;

/** The fonts the share images need, each pinned to its checksum. */
export function parseShareManifest(data: unknown): ShareManifest {
  return v.parse(ShareManifestSchema, data);
}
