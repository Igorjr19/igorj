import { type EditionSettings, HOME_BOXES, SECTIONS, type Site } from './schema.ts';

/** The edition of a site that declares none. */
export const FULL = 'full';

export type HomeBox = (typeof HOME_BOXES)[number];
export type SectionKey = (typeof SECTIONS)[number];

/** An edition with everything it takes from the ones it extends already settled. */
export interface Edition {
  readonly name: string;
  /** Where it lives; null for the edition of a site that declares none. */
  readonly url: string | null;
  readonly index: boolean;
  readonly sections: Readonly<Record<SectionKey, boolean>>;
  /** The post categories it carries; null for all. */
  readonly categories: readonly string[] | null;
  readonly boxes: readonly HomeBox[];
  readonly personal: boolean;
}

export function editionNames(site: Site): string[] {
  return site.editions ? Object.keys(site.editions) : [FULL];
}

/** The edition and the ones it extends, the one extended first: the order their settings are laid over each other. */
export function lineage(site: Site, name: string): string[] {
  const chain: string[] = [];
  const walked: string[] = [];
  let at: string | undefined = name;
  while (at !== undefined) {
    if (walked.includes(at)) {
      throw new Error(`Editions extend each other in a circle: ${[...walked, at].join(' > ')}`);
    }
    walked.push(at);
    if (!(site.editions?.[at] || (at === FULL && !site.editions))) {
      throw new Error(`Edition "${at}" is not declared in site/site.yaml`);
    }
    chain.unshift(at);
    at = site.editions?.[at]?.extends;
  }
  return chain;
}

/** The settings of an edition, laid over those of the ones it extends and over the site's own switches for sections. */
export function resolveEdition(site: Site, name: string): Edition {
  const settings: EditionSettings[] = lineage(site, name).flatMap((member) => {
    const own = site.editions?.[member];
    return own ? [own] : [];
  });
  const last = <K extends keyof EditionSettings>(key: K): EditionSettings[K] | undefined =>
    settings.map((setting) => setting[key]).findLast((value) => value !== undefined);
  const switches = { ...site.sections, ...Object.assign({}, ...settings.map((setting) => setting.sections ?? {})) };
  return {
    name,
    url: last('url') ?? null,
    index: last('index') ?? true,
    sections: Object.fromEntries(SECTIONS.map((key) => [key, switches[key] !== false])) as Record<SectionKey, boolean>,
    categories: last('categories') ?? null,
    boxes: last('boxes') ?? HOME_BOXES,
    personal: last('personal') ?? true,
  };
}

/** What is wrong with the way the editions are declared, in words the author can act on. */
export function editionProblems(site: Site): string[] {
  const problems: string[] = [];
  if (site.editions && !site.editions[FULL]) {
    problems.push(`A site that declares editions declares "${FULL}" too, which is the one the build makes by default`);
  }
  for (const name of editionNames(site)) {
    try {
      lineage(site, name);
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
    }
  }
  return [...new Set(problems)];
}

/** An item names editions the site does not declare. */
export function undeclaredEditions(
  items: readonly { readonly path: string; readonly editions: readonly string[] | undefined }[],
  declared: ReadonlySet<string>,
): string[] {
  return items.flatMap(({ path, editions }) =>
    (editions ?? [])
      .filter((name) => !declared.has(name))
      .map((name) => `${path}: edition "${name}" is not declared in site/site.yaml`),
  );
}

/** Whether an item is in an edition: it says nothing, or it names the edition. */
export function inEdition(item: { readonly editions?: readonly string[] | undefined }, edition: string): boolean {
  return item.editions === undefined || item.editions.includes(edition);
}

/** A file name with the edition in it, `about.pro.pt.yaml`, belongs to that edition and lays over `about.pt.yaml`. */
export function splitEdition(path: string, names: ReadonlySet<string>): { base: string; edition: string | null } {
  const slash = path.lastIndexOf('/') + 1;
  const parts = path.slice(slash).split('.');
  const edition = parts[1];
  if (parts.length >= 3 && edition !== undefined && names.has(edition)) {
    return { base: `${path.slice(0, slash)}${[parts[0], ...parts.slice(2)].join('.')}`, edition };
  }
  return { base: path, edition: null };
}

/**
 * Which file to read for each path of the content when it is built as `chain`, the edition and those it extends:
 * the file of the last edition that has one, else the plain file. Files of other editions are left out.
 */
export function sourcesFor(
  paths: readonly string[],
  names: ReadonlySet<string>,
  chain: readonly string[],
): Map<string, string> {
  const sources = new Map<string, string>();
  const rank = new Map(chain.map((name, at) => [name, at + 1]));
  const ranked = new Map<string, number>();
  for (const path of paths) {
    const { base, edition } = splitEdition(path, names);
    const weight = edition === null ? 0 : (rank.get(edition) ?? -1);
    if (weight >= 0 && weight >= (ranked.get(base) ?? -1)) {
      sources.set(base, path);
      ranked.set(base, weight);
    }
  }
  return sources;
}
