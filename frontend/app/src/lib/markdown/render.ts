import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import type { ColorEntry, MaskEntry } from '../../../tools/image/manifest.ts';
import { COLOR_MARK, isExternal, mediaPath } from '../../../tools/image/references.ts';

export interface Heading {
  readonly id: string;
  readonly text: string;
  readonly level: number;
}

export interface Rendered {
  readonly html: string;
  readonly headings: readonly Heading[];
}

export interface RenderContext {
  /** The media folder of the item, such as `posts/some-post`, which relative image paths start from. */
  readonly mediaBase: string;
  /** The dithered figures the build tools made, by media path. */
  readonly figures: Readonly<Record<string, MaskEntry>>;
  /** The figures asked for in color with `#color`, by media path. */
  readonly colorFigures: Readonly<Record<string, ColorEntry>>;
  /** The screen-sized copies of the pictures that are larger than that, by media path. */
  readonly webCopies?: Readonly<Record<string, string>>;
  readonly copyLabel: string;
  /** What a screen reader adds to the description of a picture: that it opens the original. */
  readonly openLabel: string;
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function highlight(code: string, language: string): string {
  const known = hljs.getLanguage(language);
  return known ? hljs.highlight(code, { language, ignoreIllegals: true }).value : escapeHtml(code);
}

const FIGURE_STYLE = (entry: { width: number; height: number }): string =>
  `aspect-ratio: ${entry.width} / ${entry.height}; max-inline-size: ${entry.width}px`;

function figure(entry: MaskEntry): string {
  const style = `--dither: url('${entry.src}'); --dither-inverted: url('${entry.inverted}'); ${FIGURE_STYLE(entry)}`;
  return `<span class="dither dither--figure" aria-hidden="true" style="${style}"><span class="dither__ink dither__ink--on-bright"></span><span class="dither__ink dither__ink--on-dark"></span></span>`;
}

/** A picture in color: for each role it uses, the layer for a dark theme and the one for a light theme, inked with the role's color. */
function colorFigure(entry: ColorEntry): string {
  const layers = entry.layers
    .map(({ role, src, inverted }) => {
      const ink = `--dither-ink: var(--color-${role})`;
      return `<span class="dither__ink dither__ink--on-bright" style="--dither: url('${src}'); ${ink}"></span><span class="dither__ink dither__ink--on-dark" style="--dither-inverted: url('${inverted}'); ${ink}"></span>`;
    })
    .join('');
  return `<span class="dither dither--figure" aria-hidden="true" style="${FIGURE_STYLE(entry)}">${layers}</span>`;
}

/** A picture of the item, as a button that opens its original: dithered where the build made it so, as it is otherwise. */
function picture(source: string, alt: string, context: RenderContext): string {
  const color = source.endsWith(COLOR_MARK);
  const clean = color ? source.slice(0, -COLOR_MARK.length) : source;
  if (isExternal(clean)) {
    return `<img src="${escapeHtml(clean)}" alt="${escapeHtml(alt)}">`;
  }
  const path = mediaPath(context.mediaBase, clean);
  const entry = context.figures[path];
  const colored = color ? context.colorFigures[path] : undefined;
  const inner = colored
    ? colorFigure(colored)
    : entry
      ? figure(entry)
      : `<img src="/media/${escapeHtml(path)}" alt="" loading="lazy">`;
  const label = `${escapeHtml(alt)} (${escapeHtml(context.openLabel)})`;
  const original = `/media/${escapeHtml(path)}`;
  const shown = context.webCopies?.[path] ?? original;
  const full = shown === original ? '' : ` data-full="${original}"`;
  return `<button type="button" class="figure" data-original="${escapeHtml(shown)}"${full} data-alt="${escapeHtml(alt)}" aria-label="${label}">${inner}</button>`;
}

/** CommonMark to HTML at build time: code highlighted with classes the theme colors, images dithered, headings with addresses. */
export function renderMarkdown(source: string, context: RenderContext): Rendered {
  const headings: Heading[] = [];
  const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });

  markdown.renderer.rules['fence'] = (tokens, index) => {
    const token = tokens[index];
    const language = token?.info.trim().split(/\s+/)[0] ?? '';
    const body = highlight(token?.content ?? '', language);
    return `<div class="code-block"><pre><code class="hljs${language ? ` language-${escapeHtml(language)}` : ''}">${body}</code></pre><button type="button" class="code-block__copy" data-copy>${escapeHtml(context.copyLabel)}</button></div>\n`;
  };

  markdown.renderer.rules['image'] = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const alt = self.renderInlineAsText(token?.children ?? [], options, env);
    return picture(String(token?.attrGet('src') ?? ''), alt, context);
  };

  markdown.renderer.rules['heading_open'] = (tokens, index, options, _env, self) => {
    const token = tokens[index];
    const text = tokens[index + 1]?.content ?? '';
    const id = slugify(text);
    if (token && id) {
      token.attrSet('id', id);
      headings.push({ id, text, level: Number(token.tag.slice(1)) });
    }
    return self.renderToken(tokens, index, options);
  };

  // A link to another site opens in a new tab, already in the HTML, so it does not wait for a script.
  markdown.renderer.rules['link_open'] = (tokens, index, options, _env, self) => {
    const token = tokens[index];
    const href = String(token?.attrGet('href') ?? '');
    if (token && /^https?:\/\//i.test(href)) {
      token.attrSet('target', '_blank');
      token.attrSet('rel', 'noopener noreferrer');
    }
    return self.renderToken(tokens, index, options);
  };

  const html = markdown.render(source);
  return { html, headings };
}

const ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

/** The text of a Markdown source with no markup at all, one paragraph per line, for places that only show text. */
export function plainText(source: string): string {
  const { html } = renderMarkdown(source, {
    mediaBase: '',
    figures: {},
    colorFigures: {},
    copyLabel: '',
    openLabel: '',
  });
  return html
    .replace(/<button[^>]*>.*?<\/button>/g, '')
    .replace(/<\/(?:p|h[1-6]|li|pre|blockquote|div)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
