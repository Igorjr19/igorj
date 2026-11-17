import type * as T from 'three';
import type { Kit } from '../kit.ts';

export const WALL_Z = -1.3;
/** The opening of the window in the wall. */
export const WINDOW = { x0: -3.35, x1: -1.65, y0: 1.75, y1: 3.25 } as const;
export const FLOOR_Y = -0.7;

export interface Shell {
  readonly group: T.Group;
  readonly wall: T.MeshToonMaterial;
}

function floorTexture(kit: Kit): T.CanvasTexture {
  const { three } = kit;
  const { texture } = kit.paint(512, 512, (context, width, height) => {
    context.fillStyle = '#8f6040';
    context.fillRect(0, 0, width, height);
    const tones = ['#c99a6b', '#bd8b5c', '#d1a577'];
    for (let y = 0; y < height; y += 64) {
      for (let x = -128; x < width + 128; x += 128) {
        context.fillStyle = tones[Math.abs(Math.floor((x + y) / 64)) % 3] ?? '#c99a6b';
        context.fillRect(x - ((y / 64) % 2 ? 64 : 0), y, 126, 62);
      }
    }
  });
  texture.wrapS = three.RepeatWrapping;
  texture.wrapT = three.RepeatWrapping;
  texture.repeat.set(4, 3);
  return texture;
}

/** The floor, the wall with the opening of the window, the baseboard and the rug. */
export function buildShell(kit: Kit): Shell {
  const { three } = kit;
  const group = new three.Group();
  const floor = new three.Mesh(new three.PlaneGeometry(16, 10), new three.MeshToonMaterial({ map: floorTexture(kit) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_Y, 1.5);
  floor.receiveShadow = true;
  group.add(floor);

  const wall = kit.toon('#f4e4c8');
  const piece = (width: number, height: number, x: number, y: number): void => {
    const mesh = new three.Mesh(new three.BoxGeometry(width, height, 0.12), wall);
    mesh.position.set(x, y, WALL_Z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  const width = WINDOW.x1 - WINDOW.x0;
  const middle = (WINDOW.x0 + WINDOW.x1) / 2;
  piece(8, 9, WINDOW.x0 - 4, 3.3);
  piece(8, 9, WINDOW.x1 + 4, 3.3);
  piece(width, WINDOW.y0 + 0.7, middle, (WINDOW.y0 - 0.7) / 2);
  piece(width, 8 - WINDOW.y1, middle, WINDOW.y1 + (8 - WINDOW.y1) / 2);

  const baseboard = new three.Mesh(new three.BoxGeometry(16, 0.18, 0.14), kit.toon('#fff7e6'));
  baseboard.position.set(0, FLOOR_Y + 0.09, WALL_Z + 0.07);
  group.add(baseboard);

  const rug = new three.Mesh(new three.CylinderGeometry(2.6, 2.6, 0.02, 48), kit.toon('#d9786c'));
  rug.position.set(0, FLOOR_Y + 0.01, 1.8);
  rug.scale.z = 0.7;
  rug.receiveShadow = true;
  group.add(rug);
  return { group, wall };
}
