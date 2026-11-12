import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import type { MaskEntry } from '../../../tools/image/manifest.ts';

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
  readonly copyLabel: string;
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

/** Resolves an image path the way the content writes it, relative to the item's folder. */
function mediaPath(base: string, source: string): string {
  const parts = `${base}/${source}`.split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.') {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

function figure(entry: MaskEntry, alt: string): string {
  const style = `--dither: url('${entry.src}'); --dither-inverted: url('${entry.inverted}'); aspect-ratio: ${entry.width} / ${entry.height}; max-inline-size: ${entry.width}px`;
  return `<span class="dither dither--figure" role="img" aria-label="${escapeHtml(alt)}" style="${style}"><span class="dither__ink dither__ink--on-bright"></span><span class="dither__ink dither__ink--on-dark"></span></span>`;
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
    const source = String(token?.attrGet('src') ?? '');
    const entry = /^[a-z]+:|^\//.test(source) ? undefined : context.figures[mediaPath(context.mediaBase, source)];
    return entry ? figure(entry, alt) : `<img src="${escapeHtml(source)}" alt="${escapeHtml(alt)}">`;
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

  const html = markdown.render(source);
  return { html, headings };
}
