import { dirname } from '@std/path';
import { parse as parseToml } from '@std/toml';
import type { SiteModel } from '../../../../tools/model/types.ts';
import { defaultColors, type PictureColors } from '../image/colors.ts';
import { atkinson, floydSteinberg, invert } from '../image/dither.ts';
import { drawFavicon } from '../image/favicon.ts';
import { grayscale } from '../image/filters.ts';
import {
  FIGURE_MAX_WIDTH,
  HERO_PORTRAIT_SIZE,
  type ImagesManifest,
  isRaster,
  type MaskEntry,
  withoutExtension,
} from '../image/manifest.ts';
import { treatPortrait } from '../image/portrait.ts';
import { parseThemesData } from '../image/schema.ts';
import { drawShare, SHARE_HEIGHT, SHARE_PORTRAIT, SHARE_WIDTH, type SharePicture } from '../image/share.ts';
import { drawingOf, maskPng, readRgba, registerFonts } from './canvas.ts';

const MEDIA_DIR = 'generated/media';
const STATIC_DIR = 'generated/static';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://igorj.dev/';

async function write(path: string, data: Uint8Array | string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await (typeof data === 'string' ? Deno.writeTextFile(path, data) : Deno.writeFile(path, data));
}

async function writeMask(
  kind: 'portrait' | 'figure',
  media: string,
  bits: ReturnType<typeof atkinson>,
): Promise<MaskEntry> {
  const base = `img/${kind}/${withoutExtension(media)}`;
  await write(`${STATIC_DIR}/${base}.png`, maskPng(bits));
  await write(`${STATIC_DIR}/${base}.inverted.png`, maskPng(invert(bits)));
  return { src: `/${base}.png`, inverted: `/${base}.inverted.png`, width: bits.width, height: bits.height };
}

async function portraitMask(media: string): Promise<MaskEntry> {
  const size = { width: HERO_PORTRAIT_SIZE, height: HERO_PORTRAIT_SIZE };
  const gray = treatPortrait(grayscale(await readRgba(`${MEDIA_DIR}/${media}`, { fit: size })));
  return await writeMask('portrait', media, atkinson(gray));
}

async function figureMask(media: string): Promise<MaskEntry> {
  const probe = await readRgba(`${MEDIA_DIR}/${media}`, { width: FIGURE_MAX_WIDTH });
  return await writeMask('figure', media, floydSteinberg(grayscale(probe)));
}

async function shareJpeg(path: string, colors: PictureColors, picture: SharePicture): Promise<void> {
  const { context, jpeg } = drawingOf(SHARE_WIDTH, SHARE_HEIGHT);
  drawShare(context, colors, picture);
  await write(`${STATIC_DIR}/${path}`, jpeg(90));
}

async function favicons(colors: PictureColors): Promise<void> {
  for (const [name, spec] of [
    ['favicon-light', { size: 64, ink: colors.text, background: null }],
    ['favicon-dark', { size: 64, ink: colors.background, background: null }],
    ['favicon-180', { size: 180, ink: colors.accent, background: colors.background }],
  ] as const) {
    const { context, png } = drawingOf(spec.size, spec.size);
    drawFavicon(context, { ...spec, letter: 'Í' });
    await write(`${STATIC_DIR}/icons/${name}.png`, png());
  }
}

async function readModel(language: string): Promise<SiteModel> {
  return JSON.parse(await Deno.readTextFile(`generated/model/${language}.json`)) as SiteModel;
}

async function sectionLabels(language: string): Promise<Record<string, string>> {
  return parseToml(await Deno.readTextFile(`frontend/tui/i18n/${language}.toml`)) as Record<string, string>;
}

async function sharePictures(language: string, colors: PictureColors): Promise<number> {
  const model = await readModel(language);
  const labels = await sectionLabels(language);
  const host = new URL(SITE_URL).host;
  const photoPath = model.profile?.photo;
  const photo = photoPath
    ? treatPortrait(grayscale(await readRgba(`${MEDIA_DIR}/${photoPath}`, { fit: SHARE_PORTRAIT })))
    : null;
  const author = model.profile?.author ?? '';
  await shareJpeg(`share/${language}/default.jpg`, colors, {
    label: host,
    title: author,
    footer: model.profile?.role ?? '',
    photo,
  });
  const items = [
    ...model.posts.map((item) => ['posts', item] as const),
    ...model.projects.map((item) => ['projects', item] as const),
    ...model.research.map((item) => ['research', item] as const),
  ];
  for (const [section, item] of items) {
    const label = labels[`section${section.charAt(0).toUpperCase()}${section.slice(1)}`] ?? section;
    await shareJpeg(`share/${language}/${section}/${item.slug}.jpg`, colors, {
      label: `${host} · ${label}`,
      title: item.title,
      footer: author,
      photo,
    });
  }
  return items.length + 1;
}

registerFonts('generated/share/fonts');
const colors = defaultColors(parseThemesData(JSON.parse(await Deno.readTextFile('generated/data/themes.json'))));
const languages = (await Array.fromAsync(Deno.readDir('generated/model')))
  .filter((entry) => entry.name.endsWith('.json'))
  .map((entry) => entry.name.slice(0, -'.json'.length));

const portraits: Record<string, MaskEntry> = {};
const figures: Record<string, MaskEntry> = {};
let shared = 0;
for (const language of languages) {
  const model = await readModel(language);
  const photo = model.profile?.photo;
  if (photo && isRaster(photo)) {
    portraits[photo] = await portraitMask(photo);
  }
  for (const media of [...model.posts, ...model.projects, ...model.research].flatMap((item) => item.media)) {
    if (isRaster(media) && !(media in figures)) {
      figures[media] = await figureMask(media);
    }
  }
  shared += await sharePictures(language, colors);
}
await favicons(colors);
const manifest: ImagesManifest = { portraits, figures };
await write('generated/data/images.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Wrote ${Object.keys(portraits).length} portraits, ${Object.keys(figures).length} figures, ${shared} share images and the favicons.`,
);
