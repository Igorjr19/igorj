import * as v from '@valibot/valibot';
import type { FontPackage, FontsManifest } from './types.ts';

const FontStyleSchema = v.picklist(['normal', 'italic']);

const FontsManifestSchema = v.strictObject({
  subsets: v.pipe(v.array(v.string()), v.nonEmpty()),
  families: v.array(
    v.strictObject({
      name: v.pipe(v.string(), v.nonEmpty()),
      package: v.pipe(v.string(), v.startsWith('@fontsource/')),
      weights: v.pipe(v.array(v.pipe(v.number(), v.integer())), v.nonEmpty()),
      styles: v.pipe(v.array(FontStyleSchema), v.nonEmpty()),
    }),
  ),
  preload: v.optional(
    v.array(
      v.strictObject({
        family: v.pipe(v.string(), v.nonEmpty()),
        weight: v.pipe(v.number(), v.integer()),
        style: FontStyleSchema,
        subset: v.pipe(v.string(), v.nonEmpty()),
      }),
    ),
    [],
  ),
});

export function parseFontsManifest(input: unknown): FontsManifest {
  const result = v.safeParse(FontsManifestSchema, input);
  if (!result.success) {
    throw new Error(`Fonts manifest:\n${v.summarize(result.issues)}`);
  }
  return result.output;
}

export function parseFontPackage(metadata: unknown, unicode: unknown, context: string): FontPackage {
  const id = v.safeParse(v.object({ id: v.pipe(v.string(), v.nonEmpty()) }), metadata);
  const ranges = v.safeParse(v.record(v.string(), v.string()), unicode);
  if (!(id.success && ranges.success)) {
    throw new Error(`${context}: unexpected metadata.json or unicode.json format`);
  }
  return { id: id.output.id, unicodeRanges: ranges.output };
}
