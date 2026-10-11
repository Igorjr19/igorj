import { parse } from '@std/toml';
import { renderNotices } from '../licenses/render.ts';
import { parseThirdPartyEntries } from '../licenses/schema.ts';
import type { Notice, ThirdPartyEntry } from '../licenses/types.ts';
import { fetchVerified } from '../shared/download.ts';

const MANIFEST_PATH = 'data/third-party.toml';
const CACHE_DIR = '.cache/licenses';
const OUTPUT_DIR = 'generated/static';
const OUTPUT_PATH = `${OUTPUT_DIR}/third-party-licenses.txt`;

async function readLicenseText({ text }: ThirdPartyEntry): Promise<string> {
  if ('package' in text) {
    return await Deno.readTextFile(`node_modules/${text.package}/${text.file}`);
  }
  const data = await fetchVerified({ ...text, cachePath: `${CACHE_DIR}/${text.sha256}.txt` });
  return new TextDecoder().decode(data);
}

const entries = parseThirdPartyEntries(parse(await Deno.readTextFile(MANIFEST_PATH)));
const notices: Notice[] = [];
for (const entry of entries) {
  notices.push({ ...entry, text: await readLicenseText(entry) });
}

await Deno.mkdir(OUTPUT_DIR, { recursive: true });
await Deno.writeTextFile(OUTPUT_PATH, renderNotices(notices));
console.log(`Wrote ${OUTPUT_PATH} (${notices.length} entries).`);
