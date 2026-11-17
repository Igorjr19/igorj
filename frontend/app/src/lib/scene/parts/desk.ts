import type * as T from 'three';
import type { Kit } from '../kit.ts';

/** The screen of the monitor, in world units: where the site is shown, and what the camera comes to rest in front of. */
export const SCREEN = { width: 1.6, height: 1, x: 0, y: 1.35, z: 0 } as const;

export interface Monitor {
  readonly spot: T.Group;
  /** The plane the site sits on; its corners tell where the window of the page goes. */
  readonly screen: T.Mesh;
}

/** The desk, on its legs with a chest of drawers. */
export function buildDesk(kit: Kit): T.Group {
  const desk = new kit.three.Group();
  kit.box(desk, [7.2, 0.12, 2.6], '#b07a50', [0, 0.44, 0.15]);
  for (const x of [-3.4, 3.4]) {
    for (const z of [-0.95, 1.2]) {
      kit.box(desk, [0.16, 1.14, 0.16], '#8f6040', [x, -0.13, z], { outline: false });
    }
  }
  kit.box(desk, [6.8, 0.5, 0.06], '#8f6040', [0, 0.1, -0.98], { outline: false });
  kit.box(desk, [0.06, 0.5, 2.1], '#8f6040', [-3.4, 0.1, 0.12], { outline: false });
  kit.box(desk, [0.06, 0.5, 2.1], '#8f6040', [3.4, 0.1, 0.12], { outline: false });
  kit.box(desk, [1.3, 0.62, 1.9], '#a06e48', [2.65, 0, 0.15]);
  for (const y of [0.18, -0.06, -0.3]) {
    kit.box(desk, [1.14, 0.17, 0.03], '#b98458', [2.65, y, 1.12]);
  }
  kit.shade(desk);
  return desk;
}

/** The monitor with its keyboard. The screen is a plain plane: the page itself is laid over it by the stylesheet. */
export function buildMonitor(kit: Kit): Monitor {
  const { three } = kit;
  const spot = kit.spot('monitor', [0, SCREEN.y, 0.05]);
  kit.box(spot, [1.9, 1.3, 0.16], '#3a3d50', [0, SCREEN.y, -0.1]);
  kit.box(spot, [0.2, 0.5, 0.12], '#3a3d50', [0, 0.78, -0.18]);
  kit.box(spot, [0.8, 0.05, 0.5], '#3a3d50', [0, 0.53, -0.1]);
  kit.box(spot, [1.2, 0.05, 0.4], '#555a72', [0, 0.54, 0.85]);
  const screen = new three.Mesh(
    new three.PlaneGeometry(SCREEN.width, SCREEN.height),
    new three.MeshBasicMaterial({ color: '#14161f', toneMapped: false }),
  );
  screen.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
  screen.userData['flat'] = true;
  spot.add(screen);
  kit.shade(spot);
  return { spot, screen };
}
