import { join } from '@std/path';
import { Session } from '../e2e/support/session.ts';
import { steps } from './steps/index.ts';
import { parseFeature } from './support/gherkin.ts';
import { matchStep } from './support/steps.ts';
import type { World } from './support/world.ts';

const SPECS_DIR = 'specs';
const PENDING_TAG = '@wip';

async function* featureFiles(dir: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    const path = join(dir, entry.name);
    if (entry.isDirectory) {
      yield* featureFiles(path);
    } else if (entry.name.endsWith('.feature')) {
      yield path;
    }
  }
}

for await (const path of featureFiles(SPECS_DIR)) {
  const feature = parseFeature(await Deno.readTextFile(path), path);

  Deno.test(`${feature.name} (${path})`, async (t) => {
    await using session = await Session.start();
    for (const scenario of feature.scenarios) {
      await t.step({
        name: scenario.name,
        // Pending scenarios document agreed behavior that is not built yet; they show up as ignored.
        ignore: scenario.tags.includes(PENDING_TAG),
        fn: async () => {
          const world: World = { session, pageOptions: {} };
          for (const text of scenario.steps) {
            const { handler, args } = matchStep(steps, text);
            await handler(world, ...args);
          }
        },
      });
    }
  });
}
