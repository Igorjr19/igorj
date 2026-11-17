import { assertEquals } from '@std/assert';
import { colorGray, colorRole, splitByRole } from '../../../tools/image/color.ts';

Deno.test('grays, near black and near white take the text color, whatever their tint', () => {
  assertEquals(
    [colorRole(128, 128, 128), colorRole(10, 10, 12), colorRole(250, 250, 250), colorRole(140, 128, 128)],
    ['text', 'text', 'text', 'text'],
  );
});

Deno.test('saturated colors take the theme role of their hue: red, yellow, green, blue and purple', () => {
  assertEquals(
    [
      colorRole(220, 40, 40),
      colorRole(230, 190, 40),
      colorRole(40, 180, 70),
      colorRole(40, 110, 220),
      colorRole(150, 60, 210),
    ],
    ['error', 'warning', 'success', 'link', 'accent'],
  );
});

Deno.test('a hue at the wrap-around of the circle stays red on both sides of it', () => {
  assertEquals([colorRole(255, 0, 40), colorRole(255, 40, 0)], ['error', 'error']);
});

Deno.test('a picture splits into one layer per role it uses, each pixel in exactly one of the bright or dark halves of its role', () => {
  const data = new Uint8ClampedArray([220, 40, 40, 255, 40, 110, 220, 255, 220, 40, 40, 255, 40, 110, 220, 255]);
  const layers = splitByRole(
    { width: 2, height: 2, data },
    { width: 2, height: 2, data: new Uint8Array([1, 0, 0, 1]) },
  );
  assertEquals(
    layers.map((layer) => layer.role),
    ['link', 'error'],
  );
  const red = layers.find((layer) => layer.role === 'error');
  assertEquals([...(red?.bright.data ?? [])], [1, 0, 0, 0]);
  assertEquals([...(red?.dark.data ?? [])], [0, 0, 1, 0]);
  const blue = layers.find((layer) => layer.role === 'link');
  assertEquals([...(blue?.bright.data ?? [])], [0, 0, 0, 1]);
  assertEquals([...(blue?.dark.data ?? [])], [0, 1, 0, 0]);
});

Deno.test('a colored pixel gets a middling ink value whatever its brightness, and a neutral one keeps its own', () => {
  const data = new Uint8ClampedArray([40, 110, 220, 255, 230, 190, 40, 255, 255, 255, 255, 255, 0, 0, 0, 255]);
  const { data: gray } = colorGray({ width: 4, height: 1, data });
  assertEquals(
    [gray[0] ?? 0, gray[1] ?? 0].map((value) => value >= 0.4 && value <= 0.75),
    [true, true],
  );
  assertEquals([Math.round((gray[2] ?? 0) * 100), Math.round((gray[3] ?? 1) * 100)], [100, 0]);
});
