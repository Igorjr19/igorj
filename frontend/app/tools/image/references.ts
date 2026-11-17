/** Resolves an image path the way the content writes it, relative to the item's folder. */
export function mediaPath(base: string, source: string): string {
  const resolved: string[] = [];
  for (const part of `${base}/${source}`.split('/')) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.') {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

/** Whether an address leads off the media folder: another site, or an absolute path of the site. */
export function isExternal(source: string): boolean {
  return /^[a-z]+:|^\//.test(source);
}

/** The marker that asks for a picture in the colors of the theme. It sits in the fragment, which other Markdown readers ignore. */
export const COLOR_MARK = '#color';

const IMAGE = /!\[[^\]]*\]\(\s*([^)\s]+)\s*(?:"[^"]*")?\s*\)/g;

/** The media paths a Markdown body asks to be drawn in color with `#color`, resolved from the item's folder. */
export function colorImages(markdown: string, base: string): Set<string> {
  const wanted = new Set<string>();
  for (const [, source = ''] of markdown.matchAll(IMAGE)) {
    if (source.endsWith(COLOR_MARK) && !isExternal(source)) {
      wanted.add(mediaPath(base, source.slice(0, -COLOR_MARK.length)));
    }
  }
  return wanted;
}
