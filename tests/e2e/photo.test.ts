/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { HOME_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

function readPhoto() {
  const photo = document.querySelector('.about__photo') as HTMLElement;
  const style = getComputedStyle(photo);
  const probe = document.createElement('span');
  probe.style.color = getComputedStyle(document.documentElement).getPropertyValue('--color-text');
  document.body.append(probe);
  const text = getComputedStyle(probe).color;
  probe.remove();
  const ink = (selector: string) => getComputedStyle(document.querySelector(selector) as Element).backgroundColor;
  const cell = (name: string) => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return {
    role: photo.getAttribute('role'),
    label: photo.getAttribute('aria-label'),
    onBright: ink('.about__ink--on-bright'),
    onDark: ink('.about__ink--on-dark'),
    text,
    width: Number.parseFloat(style.width) / cell('--cell-width'),
    height: Number.parseFloat(style.height) / cell('--cell-height'),
  };
}

Deno.test('the photo is two-color dithering inked with the theme text color', async (t) => {
  await using session = await Session.start();

  await t.step('it has a real text alternative and sits on the cell grid', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.evaluate(() => document.fonts.ready);
    const photo = await page.evaluate(readPhoto);
    assertEquals([photo.role, photo.label], ['img', 'Fixture photo']);
    assertEquals([Math.round(photo.width), Math.round(photo.height)], [16, 8]);
  });

  await t.step('on a dark theme the ink is where the photo is bright, on a light one where it is dark', async () => {
    for (const scheme of ['dark', 'light'] as const) {
      const page = await session.open(HOME_EN, { viewport: WIDE, colorScheme: scheme });
      const photo = await page.evaluate(readPhoto);
      const transparent = 'rgba(0, 0, 0, 0)';
      assertEquals(
        [photo.onBright, photo.onDark],
        scheme === 'dark' ? [photo.text, transparent] : [transparent, photo.text],
      );
    }
  });

  await t.step('both images are pure black and white, one the negative of the other', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const images = await page.evaluate(async () => {
      const photo = document.querySelector('.about__photo') as HTMLElement;
      const urls = ['--photo', '--photo-inverted'].map(
        (name) => photo.style.getPropertyValue(name).match(/url\('?([^')]+)'?\)/)?.[1] ?? '',
      );
      return await Promise.all(
        urls.map(async (url) => {
          const image = new Image();
          image.src = url;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d') as CanvasRenderingContext2D;
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          const colors = new Set<string>();
          let white = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`);
            white += pixels[index] === 255 ? 1 : 0;
          }
          return { colors: [...colors].sort(), white, total: pixels.length / 4 };
        }),
      );
    });
    const [normal, inverted] = images as [(typeof images)[number], (typeof images)[number]];
    assertEquals(normal.colors, ['0,0,0', '255,255,255']);
    assertEquals(inverted.colors, ['0,0,0', '255,255,255']);
    assertEquals(normal.white + inverted.white, normal.total);
  });
});
