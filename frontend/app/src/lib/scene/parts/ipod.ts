import type * as T from 'three';
import type { SceneInput } from '../input.ts';
import type { Objects } from './context.ts';

/** The track being played now, as the page learns it. */
export interface Track {
  readonly title: string;
  readonly artist: string;
}

export interface Ipod {
  readonly spot: T.Group;
  /** Tells what is playing now (null for nothing) and redraws the screen when it changed. */
  setNow(track: Track | null): void;
  /** Moves the selection down the list; call as time goes by. */
  tick(seconds: number): void;
}

type Music = NonNullable<SceneInput['music']>;

const WIDTH = 320;
const HEIGHT = 240;
const ROW = 27;
const BLUE = '#3a76d8';

interface Screen {
  context: CanvasRenderingContext2D;
  texture: T.CanvasTexture;
  cover: HTMLImageElement | null;
}

function list(screen: Screen, music: Music, selected: number, top: string): void {
  const { context } = screen;
  context.fillStyle = '#d7e6f2';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = '#6f8fb3';
  context.fillRect(0, 0, WIDTH, 28);
  context.fillStyle = '#fff';
  context.font = 'bold 17px sans-serif';
  context.fillText(top, 10, 20);
  music.artists.forEach(({ name, plays }, row) => {
    const y = 32 + row * ROW;
    if (row === selected) {
      context.fillStyle = BLUE;
      context.fillRect(0, y, WIDTH, ROW);
    }
    context.fillStyle = row === selected ? '#fff' : '#223';
    context.font = '16px sans-serif';
    context.fillText(name.length > 24 ? `${name.slice(0, 23)}…` : name, 10, y + 19);
    context.textAlign = 'right';
    context.fillText(String(plays), 310, y + 19);
    context.textAlign = 'left';
  });
}

const shorten = (text: string, most: number): string => (text.length > most ? `${text.slice(0, most - 1)}…` : text);

function footer(screen: Screen, music: Music, now: Track | null, strings: Objects['strings']): void {
  const { context } = screen;
  context.fillStyle = '#f2f6fa';
  context.fillRect(0, 174, WIDTH, 66);
  if (screen.cover) {
    context.drawImage(screen.cover, 8, 180, 54, 54);
  } else {
    context.fillStyle = BLUE;
    context.fillRect(8, 180, 54, 54);
  }
  const shown = now ?? music.album;
  context.fillStyle = BLUE;
  context.font = '13px sans-serif';
  context.fillText(`▶ ${strings[now ? 'sceneNow' : 'sceneAlbum'] ?? ''}`, 72, 194);
  context.fillStyle = '#223';
  context.font = 'bold 16px sans-serif';
  context.fillText(shorten(shown?.title ?? '', 24), 72, 214);
  context.font = '14px sans-serif';
  context.fillText(shorten(shown?.artist ?? '', 26), 72, 232);
}

/** The iPod on the desk: the most listened artists of the week in a list, and below it what is playing now. */
export function buildIpod(objects: Objects, music: Music): Ipod {
  const { kit } = objects;
  const { three } = kit;
  const spot = kit.spot('music', [-2.2, 1.0, 0.5]);
  const body = kit.box(spot, [0.46, 0.74, 0.07], '#f4f4f6', [-2.2, 0.93, 0.5], {
    rotation: [-0.28, 0.18, 0.04],
    thickness: 0.014,
  });
  const painting = kit.paint(WIDTH, HEIGHT);
  const screen: Screen = { context: painting.context, texture: painting.texture, cover: null };
  const face = new three.Mesh(
    new three.PlaneGeometry(0.37, 0.278),
    new three.MeshBasicMaterial({ map: painting.texture, toneMapped: false }),
  );
  face.position.set(0, 0.19, 0.037);
  face.userData['flat'] = true;
  body.add(face);
  kit.cylinder(body, 0.15, 0.15, 0.014, '#e1e2ea', [0, -0.165, 0.036], {
    rotation: [Math.PI / 2, 0, 0],
    outline: false,
  });
  kit.cylinder(body, 0.05, 0.05, 0.018, '#c9cbd8', [0, -0.165, 0.04], {
    rotation: [Math.PI / 2, 0, 0],
    outline: false,
  });
  kit.box(spot, [0.34, 0.04, 0.22], '#d4d6e2', [-2.2, 0.52, 0.55], { rotation: [0, 0.18, 0] });
  kit.shade(spot);

  let now: Track | null = null;
  let selected = -1;
  const redraw = (): void => {
    list(screen, music, Math.max(selected, 0), objects.strings['sceneTop'] ?? '');
    footer(screen, music, now, objects.strings);
    painting.texture.needsUpdate = true;
    objects.changed();
  };
  redraw();
  if (music.album?.cover) {
    void objects.load([music.album.cover]).then((cover) => {
      screen.cover = cover;
      redraw();
    });
  }
  return {
    spot,
    setNow(track) {
      if (track?.title !== now?.title || track?.artist !== now?.artist) {
        now = track;
        redraw();
      }
    },
    tick(seconds) {
      const next = Math.floor(seconds / 3) % Math.max(1, music.artists.length);
      if (next !== selected) {
        selected = next;
        redraw();
      }
    },
  };
}
