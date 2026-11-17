import type * as T from 'three';
import { bodyAt, nightness, sunlight } from '../cycle.ts';
import type { Kit } from '../kit.ts';
import { WALL_Z, WINDOW } from './shell.ts';

const CLOUDS = [
  [110, 150, 38],
  [150, 140, 48],
  [195, 155, 34],
  [330, 270, 30],
  [365, 260, 40],
  [405, 275, 28],
] as const;

export interface SkyWindow {
  readonly spot: T.Group;
  /** Draws the sky for a phase of the day (see cycle.ts). */
  setPhase(phase: number): void;
}

function mix(three: Kit['three'], from: string, to: string, amount: number): string {
  const color = new three.Color(from);
  return `#${color.lerp(new three.Color(to), Math.min(1, Math.max(0, amount))).getHexString()}`;
}

function frame(kit: Kit, spot: T.Group): void {
  const color = '#fffdf6';
  const middle = (WINDOW.x0 + WINDOW.x1) / 2;
  const width = WINDOW.x1 - WINDOW.x0;
  const height = WINDOW.y1 - WINDOW.y0;
  const z = WALL_Z + 0.04;
  kit.box(spot, [width + 0.16, 0.1, 0.18], color, [middle, WINDOW.y1 + 0.03, z]);
  kit.box(spot, [width + 0.16, 0.1, 0.18], color, [middle, WINDOW.y0 - 0.03, z]);
  kit.box(spot, [0.1, height, 0.18], color, [WINDOW.x0 - 0.03, 2.5, z]);
  kit.box(spot, [0.1, height, 0.18], color, [WINDOW.x1 + 0.03, 2.5, z]);
  kit.box(spot, [0.07, height, 0.1], color, [middle, 2.5, z - 0.01], { outline: false });
  kit.box(spot, [width, 0.07, 0.1], color, [middle, 2.5, z - 0.01], { outline: false });
  kit.box(spot, [width + 0.5, 0.08, 0.34], '#e9d9bd', [middle, WINDOW.y0 - 0.08, WALL_Z + 0.16]);
  kit.box(spot, [0.34, 1.9, 0.12], '#d9786c', [WINDOW.x0 - 0.25, 2.55, WALL_Z + 0.16]);
  kit.box(spot, [0.34, 1.9, 0.12], '#d9786c', [WINDOW.x1 + 0.25, 2.55, WALL_Z + 0.16]);
}

/** The window: its frame and curtains, and a sky behind the glass that goes round the clock. */
export function buildWindow(kit: Kit): SkyWindow {
  const { three } = kit;
  const middle = (WINDOW.x0 + WINDOW.x1) / 2;
  const spot = kit.spot('window', [middle, 2.5, -1.2]);
  frame(kit, spot);
  const sky = kit.paint(512, 400);
  const plane = new three.Mesh(
    new three.PlaneGeometry(3.2, 2.4),
    new three.MeshBasicMaterial({ map: sky.texture, toneMapped: false }),
  );
  plane.position.set(middle, 2.5, WALL_Z - 0.4);
  spot.add(plane);
  const glass = new three.Mesh(
    new three.PlaneGeometry(WINDOW.x1 - WINDOW.x0, WINDOW.y1 - WINDOW.y0),
    new three.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1 }),
  );
  glass.position.set(middle, 2.5, WALL_Z);
  glass.userData['flat'] = true;
  spot.add(glass);

  const { context, surface, texture } = sky;
  const { width, height } = surface;
  const m = (from: string, to: string, amount: number): string => mix(three, from, to, amount);
  return {
    spot,
    setPhase(phase) {
      const light = sunlight(phase);
      const night = nightness(phase);
      const top = light >= 0 ? m('#3b3f8f', '#5fb4f0', light * 1.4) : m('#3b3f8f', '#0d1230', -light * 2.4);
      const bottom = light >= 0 ? m('#ff9a5a', '#cdeaff', light * 2) : m('#ff9a5a', '#2b2f6a', -light * 3);
      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, top);
      gradient.addColorStop(1, bottom);
      context.globalAlpha = 1;
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      drawStars(context, width, height, Math.max(0, Math.min(1, (night - 0.55) / 0.35)));
      drawSun(context, phase, m('#ffd94a', '#ff7a3a', 1 - Math.min(1, Math.max(0, light * 2.2))));
      drawMoon(context, phase, m('#0d1230', '#2b2f6a', 0.6 + 0.4 * Math.min(1, Math.max(0, light + 1))));
      drawClouds(context, phase, night, m('#ffffff', '#ffd2b0', 1 - Math.abs(light)));
      context.globalAlpha = 1;
      context.fillStyle = m('#7cc47a', '#16193f', night * 1.1);
      context.beginPath();
      context.moveTo(0, height);
      context.quadraticCurveTo(140, height - 120, 300, height - 40);
      context.lineTo(300, height);
      context.fill();
      texture.needsUpdate = true;
    },
  };
}

function drawStars(context: CanvasRenderingContext2D, width: number, height: number, alpha: number): void {
  context.fillStyle = '#fff';
  for (let i = 0; i < 70; i += 1) {
    context.globalAlpha = alpha * (0.4 + (i % 5) * 0.12);
    const size = i % 7 === 0 ? 4 : 2;
    context.fillRect((i * 97) % width, (i * 53) % (height - 60), size, size);
  }
}

function drawSun(context: CanvasRenderingContext2D, phase: number, color: string): void {
  const sun = bodyAt(phase);
  if (!sun.visible) {
    return;
  }
  const x = sun.x * 512;
  const y = sun.y * 400;
  context.globalAlpha = 1;
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = 8;
  context.beginPath();
  context.arc(x, y, 46, 0, 7);
  context.fill();
  for (let i = 0; i < 12; i += 1) {
    const angle = (i * Math.PI) / 6 + phase * 2 * Math.PI * 14;
    context.beginPath();
    context.moveTo(x + Math.cos(angle) * 62, y + Math.sin(angle) * 62);
    context.lineTo(x + Math.cos(angle) * 82, y + Math.sin(angle) * 82);
    context.stroke();
  }
}

function drawMoon(context: CanvasRenderingContext2D, phase: number, shadow: string): void {
  const moon = bodyAt(phase, 0.5);
  if (!moon.visible) {
    return;
  }
  const x = moon.x * 512;
  const y = moon.y * 400;
  context.globalAlpha = 1;
  context.fillStyle = '#f4f0d0';
  context.beginPath();
  context.arc(x, y, 52, 0, 7);
  context.fill();
  context.fillStyle = shadow;
  context.beginPath();
  context.arc(x + 22, y - 14, 46, 0, 7);
  context.fill();
}

function drawClouds(context: CanvasRenderingContext2D, phase: number, night: number, color: string): void {
  context.globalAlpha = Math.max(0, 1 - night * 1.5);
  context.fillStyle = color;
  const drift = (phase * 80) % 512;
  for (const [x, y, radius] of CLOUDS) {
    for (const shift of [0, -512]) {
      context.beginPath();
      context.arc(x + drift + shift, y, radius, 0, 7);
      context.fill();
    }
  }
}
