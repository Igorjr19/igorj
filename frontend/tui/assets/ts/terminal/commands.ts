/** What the terminal knows: the page language's model as plain text, from `terminal.json`. */
export interface TerminalItem {
  readonly name: string;
  readonly title: string;
  readonly facts: string;
  readonly summary: string;
  readonly url: string;
  readonly text: string;
}

export interface TerminalData {
  readonly profile: {
    readonly author: string;
    readonly role: string;
    readonly lines: readonly string[];
    readonly location: string;
    readonly now?: { readonly work?: string; readonly masters?: string; readonly studying?: string };
  };
  readonly contact: {
    readonly email?: string;
    readonly professional?: readonly { readonly network: string; readonly url: string }[];
    readonly personal?: readonly { readonly network: string; readonly url: string }[];
  };
  readonly items: Readonly<Record<string, readonly TerminalItem[]>>;
  readonly music: { readonly artists?: readonly { readonly name: string; readonly plays: number }[] };
  readonly films: {
    readonly films?: readonly { readonly title: string; readonly year: number; readonly rating?: number }[];
  };
  readonly reading: readonly { readonly title: string; readonly authors?: readonly string[]; readonly kind: string }[];
  readonly panes: readonly { readonly key: string; readonly label: string; readonly url: string }[];
  readonly themes: readonly { readonly id: string; readonly name: string; readonly family: string }[];
  readonly accents: readonly string[];
  readonly build: { readonly commit: string; readonly date: string };
  readonly host: string;
  readonly strings: Readonly<Record<string, string>>;
}

export type Tone = 'plain' | 'dir' | 'dim' | 'accent' | 'error' | 'ok';
export type Segment = readonly [Tone, string];
export type Line = readonly Segment[];

/** What a command prints and what it asks the page to do. */
export interface Result {
  readonly lines: readonly Line[];
  readonly cwd?: string;
  readonly open?: string;
  readonly theme?: { readonly id: string; readonly accent?: string };
  readonly clear?: boolean;
  readonly exit?: boolean;
}

export const COMMANDS = [
  'help',
  'ls',
  'cd',
  'cat',
  'open',
  'tree',
  'fetch',
  'theme',
  'man',
  'whoami',
  'history',
  'clear',
  'exit',
] as const;

export const FOLDERS = ['projects', 'posts', 'research'] as const;

const line = (...segments: Segment[]): Line => segments;
const plain = (text: string): Line => [['plain', text]];
const error = (text: string): Result => ({ lines: [[['error', text]]] });

/** Fills each `%s` of a translated string in turn. */
export function format(template: string | undefined, ...values: readonly (string | number)[]): string {
  let index = 0;
  return (template ?? '').replaceAll('%s', () => String(values[index++] ?? ''));
}

function stars(rating: number | undefined): string {
  if (rating === undefined) {
    return '';
  }
  return '★'.repeat(Math.floor(rating)) + (rating % 1 ? '½' : '');
}

/** The files at the root of the site, each a short text drawn from the model. */
export function rootFiles(data: TerminalData): Record<string, () => Line[]> {
  const { profile, contact, strings } = data;
  const links = [...(contact.professional ?? []), ...(contact.personal ?? [])];
  return {
    'about.txt': () => [profile.author, profile.role, '', ...profile.lines, '', profile.location].map(plain),
    'now.txt': () =>
      (['nowWork', 'nowMasters', 'nowStudying'] as const)
        .map((key, i) => [key, [profile.now?.work, profile.now?.masters, profile.now?.studying][i]] as const)
        .filter(([, value]) => value)
        .map(([key, value]) => line(['accent', `${strings[key]}`.padEnd(12)], ['plain', value ?? ''])),
    'contact.txt': () => [
      ...(contact.email ? [line(['accent', 'e-mail'.padEnd(12)], ['plain', contact.email])] : []),
      ...links.map((link) => line(['accent', link.network.padEnd(12)], ['plain', link.url])),
    ],
    'listening.txt': () =>
      (data.music.artists ?? []).map((artist, i) =>
        line(['plain', `${i + 1}. ${artist.name} `], ['dim', format(strings['termPlays'], artist.plays)]),
      ),
    'watched.txt': () =>
      (data.films.films ?? []).map((film) =>
        line(['plain', `${film.title} `], ['dim', `(${film.year}) `], ['accent', stars(film.rating)]),
      ),
    'reading.txt': () =>
      data.reading.map((entry) =>
        line(['plain', `${entry.title} `], ['dim', [entry.kind, ...(entry.authors ?? [])].join(' · ')]),
      ),
  };
}

/** Where a path points from the current folder: a folder, a file inside one, or a file at the root. */
export function resolve(cwd: string, path: string): { dir: string; file: string | null; valid: boolean } {
  let dir = path.startsWith('~') || path.startsWith('/') ? '' : cwd;
  const parts = path
    .replace(/^~?\/?/, '')
    .split('/')
    .filter(Boolean);
  for (const [index, part] of parts.entries()) {
    if (part === '..') {
      dir = '';
    } else if (part !== '.' && !dir && (FOLDERS as readonly string[]).includes(part)) {
      dir = part;
    } else if (part !== '.') {
      return { dir, file: part, valid: index === parts.length - 1 };
    }
  }
  return { dir, file: null, valid: true };
}

function findItem(data: TerminalData, dir: string, file: string): TerminalItem | undefined {
  return data.items[dir]?.find((item) => item.name === file || item.name === `${file}.md`);
}

function help(data: TerminalData): Result {
  const s = data.strings;
  const rows: [string, string | undefined][] = [
    ['ls [folder]', s['termHelpLs']],
    ['cd <folder>', s['termHelpCd']],
    ['cat <file>', s['termHelpCat']],
    ['open <file|folder>', s['termHelpOpen']],
    ['tree', s['termHelpTree']],
    ['fetch', s['termHelpFetch']],
    ['theme [name] [accent]', s['termHelpTheme']],
    ['man igor', s['termHelpMan']],
    ['whoami · history · clear · exit', s['termHelpRest']],
  ];
  return { lines: rows.map(([command, text]) => line(['accent', command.padEnd(34)], ['dim', text ?? ''])) };
}

function list(data: TerminalData, cwd: string, path: string): Result {
  const { dir, file } = resolve(cwd, path);
  if (file) {
    return error(format(data.strings['termNotDir'], path));
  }
  if (!dir) {
    const folders = FOLDERS.map((folder): Segment => ['dir', `${folder}/   `]);
    const files = Object.keys(rootFiles(data)).map((name): Segment => ['plain', `${name}   `]);
    return { lines: [[...folders, ...files]] };
  }
  return {
    lines: (data.items[dir] ?? []).map((item) => line(['plain', item.name.padEnd(34)], ['dim', item.facts])),
  };
}

function changeDirectory(data: TerminalData, cwd: string, path: string): Result {
  const { dir, file } = resolve(cwd, path || '~');
  return file ? error(format(data.strings['termNotDir'], path)) : { lines: [], cwd: dir };
}

function show(data: TerminalData, cwd: string, path: string): Result {
  const { dir, file, valid } = resolve(cwd, path);
  if (!(file && valid)) {
    return error(format(data.strings['termNeedFile'], path || '?'));
  }
  const root = rootFiles(data)[file];
  if (!dir && root) {
    return { lines: root() };
  }
  const item = dir ? findItem(data, dir, file) : undefined;
  if (!item) {
    return error(format(data.strings['termNotFound'], path));
  }
  const body = item.text.trim() || item.summary;
  return {
    lines: [line(['accent', `# ${item.title}`]), line(['dim', item.facts]), plain(''), ...body.split('\n').map(plain)],
  };
}

function open(data: TerminalData, cwd: string, path: string): Result {
  const { dir, file, valid } = resolve(cwd, path || '.');
  const ok = (url: string, name: string): Result => ({
    lines: [[['ok', format(data.strings['termOpening'], name)]]],
    open: url,
  });
  if (!file) {
    const pane = data.panes.find((candidate) => candidate.key === (dir || 'home'));
    return pane ? ok(pane.url, dir ? `${dir}/` : '~') : error(format(data.strings['termNotFound'], path));
  }
  const item = dir && valid ? findItem(data, dir, file) : undefined;
  return item ? ok(item.url, `${dir}/${item.name}`) : error(format(data.strings['termNotFound'], path));
}

/** The site as folders and files; the branches are drawn by this script, never by the page's HTML. */
function tree(data: TerminalData): Result {
  const lines: Line[] = [line(['dir', '~'])];
  for (const folder of FOLDERS) {
    lines.push(line(['plain', '├── '], ['dir', `${folder}/`]));
    const items = data.items[folder] ?? [];
    items.forEach((item, index) => {
      lines.push(line(['dim', `│   ${index === items.length - 1 ? '└' : '├'}── ${item.name}`]));
    });
  }
  const files = Object.keys(rootFiles(data));
  files.forEach((name, index) => {
    lines.push(line(['plain', `${index === files.length - 1 ? '└' : '├'}── ${name}`]));
  });
  return { lines };
}

function fetchSummary(data: TerminalData, themeName: string): Result {
  const s = data.strings;
  const artist = data.music.artists?.[0];
  const film = data.films.films?.[0];
  const rows: [string | undefined, string][] = [
    [s['termRole'], data.profile.role],
    [s['termLocation'], data.profile.location],
    [s['termContent'], s['contentSummary'] ?? ''],
    ...(artist ? [[s['termListening'], `${artist.name} (${artist.plays})`] as [string | undefined, string]] : []),
    ...(film ? [[s['termWatched'], `${film.title} ${stars(film.rating)}`] as [string | undefined, string]] : []),
    [s['termThemeLabel'], themeName],
    [s['termBuild'], `${data.build.commit} · ${data.build.date}`],
    [s['termShell'], s['termShellValue'] ?? ''],
  ];
  return {
    lines: [
      line(['accent', 'igor'], ['plain', '@'], ['accent', data.host]),
      line(['dim', '─'.repeat(data.host.length + 5)]),
      ...rows.map(([key, value]) => line(['accent', `${key ?? ''}`.padEnd(12)], ['plain', value])),
    ],
  };
}

function theme(data: TerminalData, args: readonly string[]): Result {
  const [name, accent] = args;
  if (!name) {
    return {
      lines: [
        ...data.themes.map((entry) => line(['accent', entry.id.padEnd(24)], ['dim', entry.name])),
        line(['dim', `${data.strings['termAccents']}: ${data.accents.join(' ')}`]),
      ],
    };
  }
  const found = data.themes.find((entry) => entry.id === name || entry.id === `catppuccin-${name}`);
  if (!found) {
    return error(format(data.strings['termThemeUnknown'], name));
  }
  const chosen = accent && data.accents.includes(accent) ? accent : undefined;
  return {
    lines: [[['ok', format(data.strings['termThemeSet'], `${found.name}${chosen ? ` · ${chosen}` : ''}`)]]],
    theme: { id: found.id, ...(chosen && { accent: chosen }) },
  };
}

function manual(data: TerminalData, topic: string): Result {
  if (topic !== 'igor') {
    return error(format(data.strings['termNoManual'], topic || '?'));
  }
  const s = data.strings;
  const { profile, contact } = data;
  const section = (title: string | undefined, ...body: string[]): Line[] => [
    line(['accent', title ?? '']),
    ...body.map((text) => plain(`       ${text}`)),
    plain(''),
  ];
  const links = [...(contact.professional ?? []), ...(contact.personal ?? [])];
  return {
    lines: [
      line(['accent', `IGOR(1)${data.host.padStart(30)}${'IGOR(1)'.padStart(30)}`]),
      plain(''),
      ...section(s['termName'], `igor - ${profile.author}, ${profile.role}`),
      ...section(s['termSynopsis'], `igor [${FOLDERS.join('] [')}]`),
      ...section(s['termDescription'], ...profile.lines),
      ...section(s['termNow'], ...[profile.now?.work, profile.now?.studying].filter((text): text is string => !!text)),
      ...section(s['termSeeAlso'], links.map((link) => `${link.network.toLowerCase()}(1)`).join(', ')),
      ...section(s['termContact'], contact.email ?? ''),
    ],
  };
}

/** A cow saying the text, drawn by the script like the tree. */
export function cowsay(text: string): Line[] {
  const said = text.trim() || 'moo';
  const rule = '-'.repeat(said.length + 2);
  return [
    ` ${'_'.repeat(said.length + 2)}`,
    `< ${said} >`,
    ` ${rule}`,
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ].map(plain);
}

/** Commands that help does not list and tab does not complete, left for the curious. */
function secret(command: string, argument: string, data: TerminalData): Result | null {
  const s = data.strings;
  if (command === 'sudo') {
    return error(format(s['termSudo'], 'igor'));
  }
  if (command === 'rm') {
    return { lines: [[['ok', s['termRm'] ?? '']]] };
  }
  if (command === 'cowsay') {
    return { lines: cowsay(argument) };
  }
  return null;
}

export interface Context {
  readonly data: TerminalData;
  readonly cwd: string;
  readonly history: readonly string[];
  readonly themeName: string;
}

/** Runs one command line; unknown commands say so and suggest help. */
export function run(input: string, { data, cwd, history, themeName }: Context): Result {
  const [command = '', ...args] = input.trim().split(/\s+/);
  const arg = args.join(' ');
  const hidden = secret(command, arg, data);
  if (hidden) {
    return hidden;
  }
  switch (command) {
    case '':
      return { lines: [] };
    case 'help':
      return help(data);
    case 'ls':
      return list(data, cwd, arg);
    case 'cd':
      return changeDirectory(data, cwd, arg);
    case 'cat':
      return show(data, cwd, arg);
    case 'open':
      return open(data, cwd, arg);
    case 'tree':
      return tree(data);
    case 'fetch':
      return fetchSummary(data, themeName);
    case 'theme':
      return theme(data, args);
    case 'man':
      return manual(data, arg);
    case 'whoami':
      return { lines: [plain(`${data.profile.author}, ${data.profile.role}, ${data.profile.location}`)] };
    case 'history':
      return { lines: history.map((entry, index) => line(['dim', `${String(index + 1).padStart(3)}  ${entry}`])) };
    case 'clear':
      return { lines: [], clear: true };
    case 'exit':
      return { lines: [], exit: true };
    default:
      return error(format(data.strings['termUnknown'], command));
  }
}

function names(data: TerminalData, dir: string, foldersOnly: boolean): string[] {
  if (dir) {
    return (data.items[dir] ?? []).map((item) => item.name);
  }
  const folders = FOLDERS.map((folder) => `${folder}/`);
  return foldersOnly ? folders : [...folders, ...Object.keys(rootFiles(data))];
}

/** What the last word could become: commands first, then theme names, then folders and files. */
export function complete(value: string, cwd: string, data: TerminalData): string[] {
  const words = value.split(/\s+/);
  const last = words.at(-1) ?? '';
  if (words.length <= 1) {
    return COMMANDS.filter((command) => command.startsWith(last));
  }
  if (words[0] === 'theme') {
    const themes = data.themes.map((entry) => entry.id.replace(/^catppuccin-/, ''));
    return (words.length === 2 ? themes : data.accents).filter((name) => name.startsWith(last));
  }
  const slash = last.lastIndexOf('/');
  const base = slash >= 0 ? last.slice(0, slash + 1) : '';
  const { dir } = resolve(cwd, base);
  return names(data, dir, words[0] === 'cd')
    .filter((name) => name.startsWith(last.slice(base.length)))
    .map((name) => base + name);
}

/** The longest start every candidate shares, which tab fills in when several remain. */
export function commonPrefix(candidates: readonly string[]): string {
  const [first = '', ...rest] = candidates;
  let length = first.length;
  for (const candidate of rest) {
    while (!candidate.startsWith(first.slice(0, length))) {
      length--;
    }
  }
  return first.slice(0, length);
}
