export type Entry = string | { readonly one: string; readonly other: string };
export type Dictionary = Readonly<Record<string, Entry>>;
export type Argument = string | number | Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{\{\s*\.(\w*)\s*\}\}/g;

function fill(template: string, argument: Argument | undefined): string {
  return template.replace(PLACEHOLDER, (_, name: string) => {
    if (argument === undefined) {
      return '';
    }
    if (typeof argument === 'object') {
      return String(argument[name] ?? '');
    }
    return String(argument);
  });
}

/** Interface text by key, in the placeholder style of the strings files: `{{ . }}` for a value, `{{ .Name }}` for a named one, and `{one, other}` entries for counts. */
export function translate(dictionary: Dictionary, locale: string, key: string, argument?: Argument): string {
  const entry = dictionary[key];
  if (entry === undefined) {
    return key;
  }
  if (typeof entry === 'string') {
    return fill(entry, argument);
  }
  const count = typeof argument === 'number' ? argument : Number(typeof argument === 'object' ? argument['Count'] : 0);
  const form = new Intl.PluralRules(locale).select(count) === 'one' ? entry.one : entry.other;
  // biome-ignore lint/style/useNamingConvention: the strings files name the placeholder Count
  return fill(form, { Count: count });
}
