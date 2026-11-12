import { assertEquals } from '@std/assert';
import { defaultColors } from '../../../tools/image/colors.ts';
import { drawFavicon, type GlyphSurface } from '../../../tools/image/favicon.ts';
import { parseThemesData } from '../../../tools/image/schema.ts';
import { drawShare, SHARE_HEIGHT, SHARE_WIDTH, type Surface } from '../../../tools/image/share.ts';
import { wrapLines } from '../../../tools/image/text.ts';

const colors = { background: '#111111', text: '#eeeeee', accent: '#aa88ff' };

function recorder() {
  const calls: { op: string; args: (string | number)[]; style: unknown }[] = [];
  const surface: GlyphSurface & Surface = {
    fillStyle: '',
    font: '',
    textBaseline: '',
    textAlign: '',
    fillRect(x, y, width, height) {
      calls.push({ op: 'rect', args: [x, y, width, height], style: this.fillStyle });
    },
    fillText(text, x, y) {
      calls.push({ op: 'text', args: [text, x, y], style: this.fillStyle });
    },
    measureText: (text) => ({ width: text.length * 10, actualBoundingBoxAscent: 40, actualBoundingBoxDescent: 0 }),
  };
  return { calls, surface };
}

Deno.test('lines break at spaces so none is wider than the room, and a word wider than the room stands alone', () => {
  const measure = (line: string) => line.length * 10;
  assertEquals(wrapLines('one two three four', 90, measure), ['one two', 'three', 'four']);
  assertEquals(wrapLines('extraordinarily short', 50, measure), ['extraordinarily', 'short']);
  assertEquals(wrapLines('', 50, measure), []);
});

Deno.test('the share picture fills the background first, then writes the label, the title and the footer', () => {
  const { calls, surface } = recorder();
  drawShare(surface, colors, { label: 'igorj.dev', title: 'A title', footer: 'Author', photo: null });
  assertEquals(calls[0], { op: 'rect', args: [0, 0, SHARE_WIDTH, SHARE_HEIGHT], style: colors.background });
  assertEquals(
    calls.filter((call) => call.op === 'text').map((call) => call.args[0]),
    ['igorj.dev', 'A title', 'Author'],
  );
});

Deno.test('a long title wraps inside the room beside the photo and the lines that do not fit are left out', () => {
  const { calls, surface } = recorder();
  const title = Array.from({ length: 30 }, (_, index) => `word${index}`).join(' ');
  drawShare(surface, colors, { label: 'l', title, footer: 'f', photo: null });
  const lines = calls.filter(
    (call) => call.op === 'text' && call.args[1] === 72 && Number(call.args[2]) >= 150 && Number(call.args[2]) < 500,
  );
  assertEquals(lines.length <= 5, true);
  assertEquals(
    lines.every((call) => String(call.args[0]).length * 10 <= 680),
    true,
  );
});

Deno.test('the photo is drawn in the accent where the image is bright and the background where it is dark, against the right margin', () => {
  const { calls, surface } = recorder();
  const photo = { width: 4, height: 1, data: Float32Array.from([1, 1, 0, 0]) };
  drawShare(surface, colors, { label: 'l', title: 't', footer: 'f', photo });
  const dots = calls.filter((call) => call.op === 'rect' && call.args[3] === 1);
  assertEquals(
    dots.map((call) => [call.style, call.args[0], call.args[2]]),
    [
      [colors.background, SHARE_WIDTH - 72 - 4 + 2, 2],
      [colors.accent, SHARE_WIDTH - 72 - 4, 2],
    ],
  );
});

Deno.test('a transparent favicon draws only the letter, centred by its ink', () => {
  const { calls, surface } = recorder();
  drawFavicon(surface, { size: 64, letter: 'Í', ink: '#fff', background: null });
  assertEquals(
    calls.map((call) => call.op),
    ['text'],
  );
  assertEquals(calls[0]?.args, ['Í', 32, 32 + 20]);
});

Deno.test('a favicon with a background fills it before the letter', () => {
  const { calls, surface } = recorder();
  drawFavicon(surface, { size: 180, letter: 'Í', ink: '#fff', background: '#000' });
  assertEquals(calls[0], { op: 'rect', args: [0, 0, 180, 180], style: '#000' });
});

Deno.test('the picture colors are the dark theme of the default family with the default accent', () => {
  const themes = parseThemesData({
    defaultFamily: 'f',
    families: [
      {
        name: 'f',
        system: { light: 'f-light', dark: 'f-dark' },
        themes: [
          { id: 'f-light', swatch: ['#fff', '#000'] },
          { id: 'f-dark', swatch: ['#111', '#eee'] },
        ],
      },
    ],
    accents: { default: 'mauve', options: [{ name: 'mauve', colors: { 'f-dark': '#a8f', 'f-light': '#80f' } }] },
  });
  assertEquals(defaultColors(themes), { background: '#111', text: '#eee', accent: '#a8f' });
});
