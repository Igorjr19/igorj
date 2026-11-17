import type * as T from 'three';
import type { Kit } from '../kit.ts';

export interface Lamp {
  readonly group: T.Group;
  readonly bulb: T.Mesh;
  readonly shade: T.Mesh;
}

export function buildLamp(kit: Kit): Lamp {
  const { three } = kit;
  const group = new three.Group();
  kit.box(group, [0.3, 0.05, 0.3], '#3a3d50', [2.55, 0.53, -0.4]);
  kit.cylinder(group, 0.03, 0.03, 0.7, '#e9d9bd', [2.55, 0.9, -0.4]);
  const shade = kit.cylinder(group, 0.12, 0.28, 0.3, '#ffd45a', [2.5, 1.35, -0.4], { rotation: [0, 0, 0.25] });
  const bulb = new three.Mesh(
    new three.SphereGeometry(0.07, 12, 12),
    new three.MeshBasicMaterial({ color: '#fff3b0' }),
  );
  bulb.position.set(2.52, 1.24, -0.4);
  bulb.userData['flat'] = true;
  group.add(bulb);
  kit.shade(group);
  return { group, bulb, shade };
}
