import type * as T from 'three';
import { nightness } from '../cycle.ts';
import type { Kit } from '../kit.ts';
import type { Lamp } from './lamp.ts';
import type { Shell } from './shell.ts';

export interface Lights {
  readonly group: T.Group;
  /** The lights, the wall and the background for a phase of the day (see cycle.ts). */
  setPhase(phase: number): void;
  setShadows(on: boolean): void;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/** The sun that comes through the window, the fill, the lamp and the glow of the screen, all following the hours. */
export function buildLights(kit: Kit, shell: Shell, lamp: Lamp, scene: T.Scene): Lights {
  const { three } = kit;
  const group = new three.Group();
  const sun = new three.DirectionalLight('#ffffff', 2);
  sun.target.position.set(0, 0.3, 1.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 6, bottom: -2, near: 0.5, far: 22 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.03;
  const fill = new three.DirectionalLight('#ffffff', 1.1);
  fill.position.set(1.5, 4, 8);
  const hemisphere = new three.HemisphereLight('#ffffff', '#cdb89a', 1);
  const lampLight = new three.PointLight('#ffb060', 0, 7, 1.6);
  lampLight.position.set(2.5, 1.2, -0.3);
  const screenGlow = new three.PointLight('#bcd0ff', 0, 5, 1.8);
  screenGlow.position.set(0, 1.4, 0.8);
  group.add(sun, sun.target, fill, hemisphere, lampLight, screenGlow);

  const mix = (from: string, to: string, amount: number): string => {
    const color = new three.Color(from);
    return `#${color.lerp(new three.Color(to), clamp(amount)).getHexString()}`;
  };
  return {
    group,
    setShadows(on) {
      sun.castShadow = on;
    },
    setPhase(phase) {
      const k = nightness(phase);
      const warm = 1 - Math.abs(2 * k - 1);
      const night = clamp((k - 0.5) / 0.4);
      sun.color.set(mix(mix('#fff0c4', '#ff8a4a', warm * 0.9), '#9db4ff', night));
      sun.intensity = 2.3 - 1.4 * k - 0.5 * warm;
      sun.position.set(-2.4, 4.2 - 2.9 * warm, -4.5);
      fill.color.set(mix('#ffffff', '#7f8ccf', k));
      fill.intensity = 1.1 - 0.65 * k;
      hemisphere.color.set(mix('#cfe8ff', '#43508f', k));
      hemisphere.groundColor.set(mix('#d9c0a0', '#1e2140', k));
      hemisphere.intensity = 1 - 0.3 * k;
      lampLight.intensity = 3.2 * night;
      screenGlow.intensity = 1.4 * night;
      (lamp.bulb.material as T.MeshBasicMaterial).color.set(mix('#fff3b0', '#fff0a0', k));
      (lamp.shade.material as T.MeshToonMaterial).color.set(mix('#ffd45a', '#ffbf4a', k));
      shell.wall.color.set(mix('#f4e4c8', '#d9c4a8', k));
      scene.background = new three.Color(mix(mix('#bfe3ff', '#ff9a5a', Math.min(1, k * 2) * 0.6), '#0d1230', k));
    },
  };
}
