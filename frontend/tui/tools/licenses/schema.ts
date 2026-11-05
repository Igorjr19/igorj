import * as v from '@valibot/valibot';
import type { ThirdPartyEntry } from './types.ts';

const ThirdPartySchema = v.strictObject({
  entries: v.pipe(
    v.array(
      v.strictObject({
        name: v.pipe(v.string(), v.nonEmpty()),
        license: v.pipe(v.string(), v.nonEmpty()),
        homepage: v.pipe(v.string(), v.url()),
        text: v.union([
          v.strictObject({ package: v.pipe(v.string(), v.nonEmpty()), file: v.pipe(v.string(), v.nonEmpty()) }),
          v.strictObject({ url: v.pipe(v.string(), v.url()), sha256: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)) }),
        ]),
      }),
    ),
    v.nonEmpty(),
  ),
});

export function parseThirdPartyEntries(input: unknown): ThirdPartyEntry[] {
  const result = v.safeParse(ThirdPartySchema, input);
  if (!result.success) {
    throw new Error(`Third-party manifest:\n${v.summarize(result.issues)}`);
  }
  return result.output.entries;
}
