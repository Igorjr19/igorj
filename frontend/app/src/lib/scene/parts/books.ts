import type * as T from 'three';
import { wrapText } from '../art.ts';
import type { SceneBook } from '../input.ts';
import type { Kit } from '../kit.ts';
import type { Objects } from './context.ts';

const COLORS = ['#7a5fd0', '#d9783c', '#3f9a78'] as const;
const TURN = [0.22, -0.16, 0.08] as const;
const SHIFT = [0.05, -0.07, 0.03] as const;

function cover(kit: Kit, title: string, color: string): T.CanvasTexture {
  return kit.paint(256, 180, (context, width) => {
    context.fillStyle = color;
    context.fillRect(0, 0, width, 180);
    context.fillStyle = 'rgba(255,255,255,.92)';
    context.font = 'bold 26px sans-serif';
    context.textAlign = 'center';
    wrapText(context, title, width / 2, 70, width - 30, 32);
  }).texture;
}

function spine(kit: Kit, title: string, color: string): T.CanvasTexture {
  return kit.paint(512, 64, (context, width, height) => {
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgba(255,255,255,.95)';
    context.font = 'bold 34px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(title, width / 2, height / 2 + 2, width - 30);
  }).texture;
}

/** One closed book lying down, with its spine to the room and its title on the cover. */
function book(
  kit: Kit,
  owner: T.Object3D,
  title: string,
  color: string,
  size: readonly [number, number, number],
  at: readonly [number, number, number],
  turn: number,
): void {
  const [width, height, depth] = size;
  const group = new kit.three.Group();
  group.position.set(...at);
  group.rotation.y = turn;
  owner.add(group);
  const thin = { thickness: 0.008 };
  kit.box(group, [width, height * 0.2, depth], color, [0, height * 0.1, 0], thin);
  kit.box(group, [width, height * 0.2, depth], color, [0, height * 0.9, 0], thin);
  kit.box(group, [width, height, depth * 0.06], color, [0, height / 2, depth / 2 - depth * 0.03], thin);
  kit.box(group, [width * 0.97, height * 0.6, depth * 0.92], '#fff4dc', [0, height / 2, -depth * 0.03], {
    thickness: 0.006,
  });
  kit.flat(group, width * 0.9, depth * 0.9, cover(kit, title, color), [0, height + 0.002, 0], [-Math.PI / 2, 0, 0]);
  kit.flat(group, width * 0.96, height * 0.9, spine(kit, title, color), [0, height / 2, depth / 2 + 0.003]);
}

/** The books being read, stacked on the desk with the top one closed and the titles of the others on their spines. */
export function buildBooks(objects: Objects, books: readonly SceneBook[]): T.Group {
  const { kit } = objects;
  const spot = kit.spot('books', [1.95, 0.9, 0.5]);
  let y = 0.5;
  books.forEach(({ title }, index) => {
    const height = 0.11 + (index % 2) * 0.03;
    book(
      kit,
      spot,
      title,
      COLORS[index % 3] ?? '#7a5fd0',
      [0.74 - index * 0.04, height, 0.5],
      [1.95 + (SHIFT[index % 3] ?? 0), y, 0.55],
      TURN[index % 3] ?? 0,
    );
    y += height;
  });
  kit.shade(spot);
  return spot;
}
