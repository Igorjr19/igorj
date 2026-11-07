import { type FuzzyMatch, fold, fuzzyMatch } from './fuzzy.ts';

/** What the box reads from `site.json`. */
export interface PickIndex {
  readonly panes: readonly { readonly key: string; readonly label: string; readonly url: string }[];
  readonly items: Readonly<
    Record<string, readonly { readonly title: string; readonly facts: string; readonly url: string }[]>
  >;
  readonly categories: readonly {
    readonly slug: string;
    readonly name: string;
    readonly url: string;
    readonly count: number;
  }[];
  readonly tags: readonly {
    readonly slug: string;
    readonly name: string;
    readonly names: readonly string[];
    readonly count: number;
    readonly url: string;
  }[];
  readonly postsUrl: string;
  readonly accents: readonly string[];
  readonly themeIndex: ThemeIndex;
  readonly strings: Readonly<Record<string, string>>;
}

export interface ThemeIndex {
  readonly defaultFamily: string;
  readonly families: readonly {
    readonly name: string;
    readonly label: string;
    readonly system: { readonly light: string; readonly dark: string };
    readonly themes: readonly {
      readonly id: string;
      readonly name: string;
      readonly variant: 'light' | 'dark';
      readonly swatch: readonly string[];
    }[];
  }[];
  readonly accents: {
    readonly family: string;
    readonly default: string;
    readonly options: readonly { readonly name: string; readonly colors: Readonly<Record<string, string>> }[];
  } | null;
}

export type Command =
  | 'theme'
  | 'accent'
  | 'language'
  | 'side'
  | 'view'
  | 'terminal'
  | 'help'
  | 'shortcuts'
  | 'motion'
  | 'copy-link'
  | 'filter';

export type Action =
  | { readonly type: 'go'; readonly url: string }
  | { readonly type: 'command'; readonly command: Command; readonly argument?: string }
  | { readonly type: 'theme'; readonly choice: string };

export interface Entry {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
  readonly hint?: string;
  readonly action: Action;
  /** A color for the kind, as a CSS value. */
  readonly color?: string;
  /** For themes: the colors to show beside the name. */
  readonly swatch?: readonly string[];
  readonly current?: boolean;
  /** Other names that find the entry too, such as a tag's name in the other language. */
  readonly keywords?: readonly string[];
}

export interface Ranked {
  readonly entry: Entry;
  readonly match: FuzzyMatch;
}

const KIND_OF_SECTION: Readonly<Record<string, string>> = {
  posts: 'pickKindPost',
  projects: 'pickKindProject',
  research: 'pickKindResearch',
};

/** Everything the palette can open: panes, posts, projects, research and categories. */
export function placeEntries(index: PickIndex): Entry[] {
  const s = index.strings;
  const panes = index.panes.map(
    (pane, i): Entry => ({
      id: `pane:${pane.key}`,
      label: `${i + 1} ${pane.label}`,
      kind: s['pickKindPane'] ?? '',
      action: { type: 'go', url: pane.url },
    }),
  );
  const items = Object.entries(index.items).flatMap(([section, list]) =>
    list.map(
      (item): Entry => ({
        id: `item:${item.url}`,
        label: item.title,
        kind: s[KIND_OF_SECTION[section] ?? ''] ?? section,
        hint: item.facts,
        action: { type: 'go', url: item.url },
      }),
    ),
  );
  return [...panes, ...items, ...categoryEntries(index, ''), ...tagEntries(index, '')];
}

/** Each tag with its count; it is found by its name in any language. */
export function tagEntries(index: PickIndex, currentUrl: string): Entry[] {
  return index.tags.map(
    (tag): Entry => ({
      id: `tag:${tag.slug}`,
      label: tag.name,
      kind: index.strings['pickKindTag'] ?? '',
      hint: String(tag.count),
      keywords: tag.names.filter((name) => name !== tag.name),
      action: { type: 'go', url: tag.url },
      current: currentUrl === tag.url,
    }),
  );
}

/** The filter's choices: all posts, then each category with its count; the one open is marked. */
export function categoryEntries(index: PickIndex, currentUrl: string, withAll = false): Entry[] {
  const s = index.strings;
  const all: Entry[] = withAll
    ? [
        {
          id: 'category:all',
          label: s['pickAll'] ?? '',
          kind: s['pickKindCategory'] ?? '',
          action: { type: 'go', url: index.postsUrl },
          current: currentUrl === index.postsUrl,
        },
      ]
    : [];
  return [
    ...all,
    ...index.categories.map(
      (category): Entry => ({
        id: `category:${category.slug}`,
        label: category.name,
        kind: s['pickKindCategory'] ?? '',
        hint: String(category.count),
        color: `var(--color-category-${category.slug})`,
        action: { type: 'go', url: category.url },
        current: currentUrl === category.url,
      }),
    ),
  ];
}

export interface CommandContext {
  readonly hasList: boolean;
  readonly isBlog: boolean;
  readonly language: string | null;
}

/** The commands after `>`, with only those that make sense on this page. */
export function commandEntries(index: PickIndex, context: CommandContext): Entry[] {
  const s = index.strings;
  const kind = s['pickKindCommand'] ?? '';
  const command = (name: Command, label: string | undefined, argument?: string): Entry => ({
    id: `command:${name}${argument ? `:${argument}` : ''}`,
    label: label ?? name,
    kind,
    action: { type: 'command', command: name, ...(argument && { argument }) },
  });
  return [
    command('theme', s['cmdTheme']),
    ...(context.language ? [command('language', `${s['cmdLanguage']} ${context.language}`)] : []),
    command('side', s['cmdSide']),
    ...(context.hasList ? [command('view', s['cmdView'])] : []),
    ...(context.isBlog ? [command('filter', s['cmdFilter'])] : []),
    command('terminal', s['cmdTerminal']),
    command('help', s['cmdHelp']),
    command('shortcuts', s['cmdShortcuts']),
    command('motion', s['cmdMotion']),
    command('copy-link', s['cmdCopyLink']),
    // The accents come last: there are many, and the theme box shows them all at once.
    ...index.accents.map((accent) => command('accent', `${s['cmdAccent'] ?? 'accent'}: ${accent}`, accent)),
  ];
}

/** Each family as "follows the system" and then its themes; the choice in effect is marked. */
export function themeEntries(index: ThemeIndex, followLabel: string, current: string): Entry[] {
  return index.families.flatMap(({ name, label, system, themes }) => {
    const variant = themes.find((theme) => theme.id === system.dark) ?? themes[0];
    return [
      {
        id: `family:${name}`,
        label: `${label} · ${followLabel}`,
        kind: label,
        action: { type: 'theme', choice: `family:${name}` },
        swatch: variant?.swatch ?? [],
        current: current === `family:${name}`,
      },
      ...themes.map(
        (theme): Entry => ({
          id: `theme:${theme.id}`,
          label: theme.name,
          kind: label,
          action: { type: 'theme', choice: `theme:${theme.id}` },
          swatch: theme.swatch,
          current: current === `theme:${theme.id}`,
        }),
      ),
    ];
  });
}

/** A match on another name still counts, a little lower, and highlights nothing in the label shown. */
function keywordMatch(query: string, keywords: readonly string[]): FuzzyMatch | null {
  const scores = keywords.map((keyword) => fuzzyMatch(query, keyword)?.score ?? Number.NEGATIVE_INFINITY);
  const best = Math.max(...scores);
  return Number.isFinite(best) ? { score: best - 1, positions: [] } : null;
}

/** Entries that fit the query, best first; an empty query keeps the given order. */
export function rank(entries: readonly Entry[], query: string, limit = 60): Ranked[] {
  const ranked: Ranked[] = [];
  for (const entry of entries) {
    const match = fuzzyMatch(query, entry.label) ?? keywordMatch(query, entry.keywords ?? []);
    if (match) {
      ranked.push({ entry, match });
    }
  }
  if (query.trim()) {
    ranked.sort((a, b) => b.match.score - a.match.score);
  }
  return ranked.slice(0, limit);
}

/** The rest of the best entry when the query is its beginning, shown after the cursor and taken with Tab. */
export function completion(query: string, best: Entry | undefined): string {
  if (!(best && query)) {
    return '';
  }
  return fold(best.label).startsWith(fold(query)) ? best.label.slice(query.length) : '';
}

/** A query starting with `>` lists commands; the rest is what to look for among them. */
export function parseQuery(raw: string): { commands: boolean; text: string } {
  return raw.startsWith('>') ? { commands: true, text: raw.slice(1).trimStart() } : { commands: false, text: raw };
}
