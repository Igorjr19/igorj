import { dirname } from '@std/path';
import { parse as parseToml } from '@std/toml';
import type { SiteModel } from '../../../../tools/model/types.ts';
import { removeIfExists, walkFiles } from '../../../../tools/shared/fs.ts';
import { colorGray, splitByRole } from '../image/color.ts';
import { defaultColors, type PictureColors } from '../image/colors.ts';
import { atkinson, floydSteinberg, invert } from '../image/dither.ts';
import { drawFavicon } from '../image/favicon.ts';
import { grayscale, toLinear } from '../image/filters.ts';
import { initialOf } from '../image/initial.ts';
import {
  type ColorEntry,
  FIGURE_MAX_WIDTH,
  HERO_PORTRAIT_SIZE,
  type ImagesManifest,
  isRaster,
  type MaskEntry,
  PLACEHOLDER_SIZE,
  withoutExtension,
} from '../image/manifest.ts';
import { treatPortrait } from '../image/portrait.ts';
import { colorImages } from '../image/references.ts';
import { parseThemesData } from '../image/schema.ts';
import { drawShare, SHARE_HEIGHT, SHARE_PORTRAIT, SHARE_WIDTH, type SharePicture } from '../image/share.ts';
import type { Gray } from '../image/types.ts';
import { drawingOf, maskPng, readRgba, registerFonts } from './canvas.ts';

/** The edition the build is for; its model and its media have their own folders. */
const EDITION = Deno.env.get('EDITION') ?? 'full';
const MEDIA_DIR = `generated/media/${EDITION}`;
// Kept apart from generated/static, which the Hugo site publishes as it is.
const SHARED_STATIC_DIR = 'generated/static';
const STATIC_DIR = 'generated/app-static';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://igorj.dev/';

async function write(path: string, data: Uint8Array | string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await (typeof data === 'string' ? Deno.writeTextFile(path, data) : Deno.writeFile(path, data));
}

/** A short fingerprint of the bytes, so a picture that changes gets a new address and no cache keeps the old one. */
async function fingerprint(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', Uint8Array.from(data));
  return [...new Uint8Array(digest)]
    .slice(0, 5)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function writeMask(
  kind: 'portrait' | 'figure' | 'thumb',
  media: string,
  bits: ReturnType<typeof atkinson>,
): Promise<MaskEntry> {
  const base = `img/${kind}/${withoutExtension(media)}`;
  const mask = maskPng(bits);
  const inverse = maskPng(invert(bits));
  const src = `${base}.${await fingerprint(mask)}.png`;
  const inverted = `${base}.inverted.${await fingerprint(inverse)}.png`;
  await write(`${STATIC_DIR}/${src}`, mask);
  await write(`${STATIC_DIR}/${inverted}`, inverse);
  return {
    src: `/${src}`,
    inverted: `/${inverted}`,
    width: bits.width,
    height: bits.height,
  };
}

async function portraitMask(media: string): Promise<MaskEntry> {
  const gray = treatPortrait(grayscale(await readRgba(`${MEDIA_DIR}/${media}`, { fit: HERO_PORTRAIT_SIZE })));
  return await writeMask('portrait', media, atkinson(toLinear(gray)));
}

async function figureMask(media: string): Promise<MaskEntry> {
  const probe = await readRgba(`${MEDIA_DIR}/${media}`, {
    width: FIGURE_MAX_WIDTH,
  });
  const thumb = await readRgba(`${MEDIA_DIR}/${media}`, {
    fit: PLACEHOLDER_SIZE,
  });
  return {
    ...(await writeMask('figure', media, floydSteinberg(toLinear(grayscale(probe))))),
    thumb: await writeMask('thumb', media, floydSteinberg(toLinear(grayscale(thumb)))),
  };
}

/** A picture in the theme's colors: the dither of its brightness, split by the role of the color each pixel had. */
async function colorMask(media: string): Promise<ColorEntry> {
  const image = await readRgba(`${MEDIA_DIR}/${media}`, { width: FIGURE_MAX_WIDTH });
  const bits = floydSteinberg(colorGray(image));
  const layers: ColorEntry['layers'][number][] = [];
  for (const { role, bright, dark } of splitByRole(image, bits)) {
    const base = `img/color/${withoutExtension(media)}.${role}`;
    const mask = maskPng(bright);
    const inverse = maskPng(dark);
    const src = `${base}.${await fingerprint(mask)}.png`;
    const inverted = `${base}.inverted.${await fingerprint(inverse)}.png`;
    await write(`${STATIC_DIR}/${src}`, mask);
    await write(`${STATIC_DIR}/${inverted}`, inverse);
    layers.push({ role, src: `/${src}`, inverted: `/${inverted}` });
  }
  return { width: image.width, height: image.height, layers };
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
    [
      'favicon-180',
      {
        size: 180,
        ink: colors.accent,
        background: colors.background,
      },
    ],
  ] as const) {
    const { context, png } = drawingOf(spec.size, spec.size);
    drawFavicon(context, { ...spec, letter: 'Í' });
    await write(`${STATIC_DIR}/icons/${name}.png`, png());
  }
}

async function readModel(language: string): Promise<SiteModel> {
  return JSON.parse(await Deno.readTextFile(`generated/model/${EDITION}/${language}.json`)) as SiteModel;
}

async function sectionLabels(language: string): Promise<Record<string, string>> {
  return parseToml(await Deno.readTextFile(`frontend/app/i18n/${language}.toml`)) as Record<string, string>;
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

/** The initial, large, over a faint texture: what an item with no picture shows in a list. */
function initialGray(title: string): Gray {
  const { width, height } = PLACEHOLDER_SIZE;
  const { context } = drawingOf(width, height);
  const texture = context.createLinearGradient(0, 0, width, height);
  texture.addColorStop(0, '#0d0d0d');
  texture.addColorStop(1, '#3a3a3a');
  context.fillStyle = texture;
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#ffffff';
  context.font = `bold ${Math.round(height * 0.78)}px "Fira Code"`;
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  const letter = initialOf(title);
  const { actualBoundingBoxAscent: ascent, actualBoundingBoxDescent: descent } = context.measureText(letter);
  context.fillText(letter, width / 2, height / 2 + (ascent - descent) / 2);
  return grayscale({
    width,
    height,
    data: context.getImageData(0, 0, width, height).data,
  });
}

/** An item with no picture gets its initial, the same on every build. */
async function placeholderMasks(model: SiteModel, into: Record<string, MaskEntry>): Promise<void> {
  for (const section of ['posts', 'projects', 'research'] as const) {
    for (const item of model[section]) {
      const key = `${section}:${item.id}`;
      if (!(key in into || item.media.some(isRaster))) {
        into[key] = await writeMask(
          'thumb',
          `placeholder/${section}/${item.id}`,
          atkinson(toLinear(initialGray(item.title))),
        );
      }
    }
  }
}

/** Every file an item refers to is served as it is under /media/: the originals of the pictures, which open from the page, and the files to download. */
async function copyMedia(languages: readonly string[]): Promise<void> {
  const seen = new Set<string>();
  for (const language of languages) {
    const model = await readModel(language);
    for (const media of [...model.posts, ...model.projects, ...model.research].flatMap((item) => item.media)) {
      if (!seen.has(media)) {
        seen.add(media);
        await write(`${STATIC_DIR}/media/${media}`, await Deno.readFile(`${MEDIA_DIR}/${media}`));
      }
    }
  }
}

/** Starts from the files both frontends serve as they are (the fonts, the license texts), then the pictures go beside them. */
async function startStatic(): Promise<void> {
  await removeIfExists(STATIC_DIR);
  for await (const path of walkFiles(SHARED_STATIC_DIR)) {
    await write(`${STATIC_DIR}/${path.slice(SHARED_STATIC_DIR.length + 1)}`, await Deno.readFile(path));
  }
}

await startStatic();
await write(`${STATIC_DIR}/_headers`, await Deno.readFile('frontend/app/static/_headers'));
registerFonts('generated/share/fonts');
const colors = defaultColors(parseThemesData(JSON.parse(await Deno.readTextFile('generated/data/themes.json'))));
const languages = (await Array.fromAsync(Deno.readDir(`generated/model/${EDITION}`)))
  .filter((entry) => entry.name.endsWith('.json'))
  .map((entry) => entry.name.slice(0, -'.json'.length));

const placeholders: Record<string, MaskEntry> = {};
const portraits: Record<string, MaskEntry> = {};
const figures: Record<string, MaskEntry> = {};
const colorFigures: Record<string, ColorEntry> = {};
let shared = 0;
for (const language of languages) {
  const model = await readModel(language);
  const photo = model.profile?.photo;
  if (photo && isRaster(photo)) {
    portraits[photo] = await portraitMask(photo);
  }
  const items = [
    ...model.posts.map((item) => ['posts', item] as const),
    ...model.projects.map((item) => ['projects', item] as const),
    ...model.research.map((item) => ['research', item] as const),
  ];
  for (const [section, item] of items) {
    const wanted = colorImages(item.body, `${section}/${item.id}`);
    for (const media of item.media.filter(isRaster)) {
      if (!(media in figures)) {
        figures[media] = await figureMask(media);
      }
      if (wanted.has(media) && !(media in colorFigures)) {
        colorFigures[media] = await colorMask(media);
      }
    }
  }
  await placeholderMasks(model, placeholders);
  shared += await sharePictures(language, colors);
}
await favicons(colors);
await copyMedia(languages);
const manifest: ImagesManifest = { portraits, figures, colorFigures, placeholders };
await write('generated/data/images.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Wrote ${Object.keys(portraits).length} portraits, ${
    Object.keys(figures).length
  } figures, ${shared} share images and the favicons.`,
);
