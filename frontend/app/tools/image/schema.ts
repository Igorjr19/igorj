import * as v from '@valibot/valibot';

const ThemesDataSchema = v.object({
  defaultFamily: v.string(),
  families: v.array(
    v.object({
      name: v.string(),
      system: v.object({ light: v.string(), dark: v.string() }),
      themes: v.array(v.object({ id: v.string(), swatch: v.array(v.string()) })),
    }),
  ),
  accents: v.object({
    default: v.string(),
    options: v.array(v.object({ name: v.string(), colors: v.record(v.string(), v.string()) })),
  }),
});

export type ThemesData = v.InferOutput<typeof ThemesDataSchema>;

/** The part of the generated themes manifest the pictures made at build time need. */
export function parseThemesData(data: unknown): ThemesData {
  return v.parse(ThemesDataSchema, data);
}
