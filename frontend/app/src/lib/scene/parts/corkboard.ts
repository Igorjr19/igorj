import type * as T from 'three';
import { cardColors, wrapText } from '../art.ts';
import { posterSources } from '../images.ts';
import type { SceneFilm } from '../input.ts';
import { posterAt } from '../input.ts';
import type { Objects } from './context.ts';
import { WALL_Z } from './shell.ts';

const PINS = ['#e0483c', '#3c8fe0', '#e0c63c', '#4cc276'] as const;
const TILT = [0.05, -0.06, 0.04, -0.03] as const;
const Z = WALL_Z + 0.08;

/** The stars of a rating, with a half where there is one. */
export function stars(rating: number): string {
  return '★'.repeat(Math.floor(rating)) + (rating % 1 ? '½' : '');
}

function card(objects: Objects, film: SceneFilm): T.CanvasTexture {
  const [top, bottom] = cardColors(film.title);
  return objects.kit.paint(256, 384, (context, width, height) => {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#fff';
    context.font = 'bold 34px sans-serif';
    context.textAlign = 'center';
    wrapText(context, film.title.toUpperCase(), width / 2, height - 90, width - 50, 38);
  }).texture;
}

function stub(objects: Objects, film: SceneFilm): T.CanvasTexture {
  return objects.kit.paint(256, 80, (context, width, height) => {
    context.fillStyle = '#fff4dc';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#e0a93a';
    context.fillRect(0, 0, 22, height);
    context.fillStyle = '#2d2433';
    context.font = 'bold 22px monospace';
    context.fillText(String(film.year), 36, 34);
    if (film.rating !== null) {
      context.fillStyle = '#d28a1d';
      context.font = 'bold 26px monospace';
      context.fillText(stars(film.rating), 118, 34);
    }
  }).texture;
}

/** Puts the picture of the poster on its surface when it arrives; until then, and if it never does, the card stays. */
function arrive(objects: Objects, film: SceneFilm, surface: T.Mesh): void {
  if (!film.poster) {
    return;
  }
  void objects.load(posterSources(posterAt(film.poster, 460))).then((image) => {
    if (!image) {
      return;
    }
    const texture = new objects.kit.three.CanvasTexture(image);
    texture.colorSpace = objects.kit.three.SRGBColorSpace;
    (surface.material as T.MeshBasicMaterial).map = texture;
    (surface.material as T.MeshBasicMaterial).needsUpdate = true;
    objects.changed();
  });
}

/** The cork board with the last films watched: the poster, a pin, and a ticket stub with the year and the stars. */
export function buildCorkboard(objects: Objects, films: readonly SceneFilm[]): T.Group {
  const { kit } = objects;
  const spot = kit.spot('posters', [1.8, 2.7, WALL_Z + 0.3]);
  kit.box(spot, [3.1, 1.7, 0.06], '#b07a50', [1.8, 2.8, Z - 0.03]);
  const cork = kit.paint(256, 140, (context) => {
    context.fillStyle = '#d4a574';
    context.fillRect(0, 0, 256, 140);
    for (let n = 0; n < 500; n += 1) {
      context.fillStyle = n % 3 ? '#c08e5a' : '#e2b98a';
      context.fillRect((n * 61) % 256, (n * 37) % 140, 3, 3);
    }
  });
  kit.flat(spot, 2.95, 1.6, cork.texture, [1.8, 2.8, Z + 0.004]);
  films.forEach((film, i) => {
    const x = 0.7 + i * 0.68;
    const tilt = TILT[i % 4] ?? 0;
    const lift = (i % 2) * 0.08;
    const frame = kit.box(spot, [0.5, 0.75, 0.02], '#ffffff', [x, 3.0 - lift, Z + 0.02], {
      rotation: [0, 0, tilt],
      outline: false,
    });
    const surface = kit.flat(frame, 0.5, 0.75, card(objects, film), [0, 0, 0.012]);
    arrive(objects, film, surface);
    const pin = new kit.three.Mesh(
      new kit.three.SphereGeometry(0.035, 10, 10),
      new kit.three.MeshBasicMaterial({ color: PINS[i % 4] ?? '#e0483c' }),
    );
    pin.position.set(x, 3.36 - lift, Z + 0.05);
    spot.add(pin);
    const note = kit.box(spot, [0.46, 0.14, 0.01], '#fff4dc', [x + 0.05, 2.38 + (i % 2) * 0.06, Z + 0.02], {
      outline: false,
      rotation: [0, 0, -tilt * 2],
    });
    kit.flat(note, 0.46, 0.145, stub(objects, film), [0, 0, 0.007]);
  });
  kit.shade(spot);
  return spot;
}
