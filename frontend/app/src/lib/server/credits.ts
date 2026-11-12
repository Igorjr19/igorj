import { readFile } from 'node:fs/promises';
import { parse } from 'smol-toml';

const THIRD_PARTY = process.env['THIRD_PARTY_FILE'] ?? '../tui/data/third-party.toml';
const SOURCES = process.env['SOURCES_FILE'] ?? '../tui/data/sources.toml';

export interface CreditEntry {
  readonly name: string;
  readonly homepage: string;
  readonly note: string;
}

function entriesOf(table: Readonly<Record<string, unknown>>, key: string, note: string): CreditEntry[] {
  const list = table[key];
  if (!Array.isArray(list)) {
    throw new Error(`The credits file has no "${key}" list`);
  }
  return list.map((entry) => {
    const item = entry as Partial<Record<string, unknown>>;
    const { name, homepage } = item;
    if (typeof name !== 'string' || typeof homepage !== 'string' || typeof item[note] !== 'string') {
      throw new Error(`A credits entry needs a name, a homepage and a "${note}"`);
    }
    return { name, homepage, note: item[note] };
  });
}

export async function readCredits(): Promise<{
  material: CreditEntry[];
  sources: (CreditEntry & { model: string })[];
}> {
  const material = entriesOf(parse(await readFile(THIRD_PARTY, 'utf8')), 'entries', 'license');
  const sourcesTable = parse(await readFile(SOURCES, 'utf8'));
  const sources = entriesOf(sourcesTable, 'sources', 'what').map((source, index) => {
    const model = (sourcesTable['sources'] as { model: string }[])[index]?.model ?? '';
    return { ...source, model };
  });
  return { material, sources };
}
