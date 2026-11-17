import type * as T from 'three';
import type { Kit } from '../kit.ts';
import { FLOOR_Y } from './shell.ts';

export interface Plant {
  readonly spot: T.Group;
  /** Sways the leaves; `stir` from 0 to 1 is how much the pointer has stirred them. */
  sway(seconds: number, stir: number): void;
}

const LEAVES = 9;

export function buildPlant(kit: Kit): Plant {
  const { three } = kit;
  const spot = kit.spot('plant', [0, 1.2, 0]);
  spot.position.set(4, FLOOR_Y, 0.7);
  kit.cylinder(spot, 0.34, 0.24, 0.5, '#d2734a', [0, 0.26, 0]);
  kit.cylinder(spot, 0.36, 0.36, 0.06, '#a84f2c', [0, 0.52, 0]);
  kit.cylinder(spot, 0.3, 0.3, 0.02, '#5a3d2c', [0, 0.55, 0], { outline: false });
  const greens = ['#3f9a52', '#56b56a', '#2f8248'];
  const pivots: T.Group[] = [];
  for (let i = 0; i < LEAVES; i += 1) {
    const height = 0.6 + (i % 3) * 0.28;
    const pivot = new three.Group();
    pivot.position.set(0, 0.55, 0);
    pivot.rotation.y = (i / LEAVES) * Math.PI * 2;
    spot.add(pivot);
    const stem = new three.Mesh(new three.CylinderGeometry(0.015, 0.02, height, 6), kit.toon('#4f9a52'));
    stem.position.set(0.12, height / 2, 0);
    stem.rotation.z = -0.18 - (i % 3) * 0.1;
    pivot.add(stem);
    const leaf = new three.Mesh(new three.SphereGeometry(1, 16, 12), kit.toon(greens[i % 3] ?? '#3f9a52'));
    leaf.scale.set(0.34, 0.03, 0.17);
    leaf.position.set(0.2 + (i % 3) * 0.05, height + 0.04, 0);
    leaf.rotation.z = 0.5 + (i % 3) * 0.12;
    pivot.add(leaf);
    pivots.push(pivot);
  }
  kit.shade(spot);
  return {
    spot,
    sway(seconds, stir) {
      pivots.forEach((pivot, i) => {
        pivot.rotation.z = Math.sin(seconds * 1.3 + i) * (0.02 + stir * 0.1);
        pivot.rotation.x = Math.cos(seconds * 1.1 + i) * (0.015 + stir * 0.08);
      });
    },
  };
}
