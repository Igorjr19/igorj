import type * as T from 'three';
import type { Three } from './three.ts';

export type Vec3 = readonly [number, number, number];
export type SpotName = 'monitor' | 'window' | 'plant' | 'music' | 'books' | 'posters';

/** An object of the room the visitor can point at: where its mark and its name stand, and the outlines that light up. */
export interface Spot {
  readonly name: SpotName;
  /** Where the mark sits, in the local space of `group`. */
  readonly anchor: Vec3;
  readonly group: T.Group;
  readonly outlines: T.MeshBasicMaterial[];
}

export interface PieceOptions {
  readonly outline?: boolean;
  readonly rotation?: Vec3;
  readonly thickness?: number;
}

export interface Painting {
  readonly texture: T.CanvasTexture;
  readonly context: CanvasRenderingContext2D;
  readonly surface: HTMLCanvasElement;
}

export const INK = '#2d2433';
export const GLOW = '#fff6e0';

/** The things the room is made of: flat-shaded colors with an inked outline, and pictures drawn on canvases. */
export interface Kit {
  readonly three: Three;
  toon(color: string): T.MeshToonMaterial;
  box(owner: T.Object3D, size: Vec3, color: string, at: Vec3, options?: PieceOptions): T.Mesh;
  cylinder(
    owner: T.Object3D,
    top: number,
    bottom: number,
    height: number,
    color: string,
    at: Vec3,
    options?: PieceOptions,
  ): T.Mesh;
  flat(owner: T.Object3D, width: number, height: number, texture: T.Texture, at: Vec3, rotation?: Vec3): T.Mesh;
  spot(name: SpotName, anchor: Vec3): T.Group;
  shade(group: T.Object3D): void;
  paint(
    width: number,
    height: number,
    draw?: (context: CanvasRenderingContext2D, width: number, height: number) => void,
  ): Painting;
  setOutlines(visible: boolean): void;
}

function spotOf(node: T.Object3D | null): Spot | null {
  let at = node;
  while (at) {
    const spot = at.userData['spot'] as Spot | undefined;
    if (spot) {
      return spot;
    }
    at = at.parent;
  }
  return null;
}

/** The scale that grows a shape by `thickness` all round, which the outline is a back-facing copy at. */
function grown(geometry: T.BufferGeometry, thickness: number): Vec3 {
  const parameters = (geometry as T.BoxGeometry).parameters as Record<string, number | undefined>;
  const { width, height, depth } = parameters;
  if (width && height && depth) {
    return [(width + thickness * 2) / width, (height + thickness * 2) / height, (depth + thickness * 2) / depth];
  }
  const radius = Math.max(parameters['radius'] ?? parameters['radiusTop'] ?? 0.2, 0.05);
  const factor = 1 + thickness / radius;
  return [factor, factor, factor];
}

function toonSteps(three: Three): T.DataTexture {
  const steps = new three.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, three.RedFormat);
  steps.minFilter = three.NearestFilter;
  steps.magFilter = three.NearestFilter;
  steps.needsUpdate = true;
  return steps;
}

/** Draws an inked outline around `mesh`: a copy of it turned inside out and a little larger. */
function ink(three: Three, outlines: T.Mesh[], mesh: T.Mesh, owner: T.Object3D, thickness: number): void {
  const line = new three.Mesh(mesh.geometry, new three.MeshBasicMaterial({ color: INK, side: three.BackSide }));
  line.scale.set(...grown(mesh.geometry, thickness));
  line.userData['outline'] = true;
  mesh.add(line);
  outlines.push(line);
  spotOf(owner)?.outlines.push(line.material);
}

function place(
  three: Three,
  outlines: T.Mesh[],
  mesh: T.Mesh,
  owner: T.Object3D,
  at: Vec3,
  options: PieceOptions,
): T.Mesh {
  mesh.position.set(...at);
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  if (options.outline !== false) {
    ink(three, outlines, mesh, owner, options.thickness ?? 0.014);
  }
  owner.add(mesh);
  return mesh;
}

function painter(three: Three): Kit['paint'] {
  return (width, height, draw) => {
    const surface = document.createElement('canvas');
    surface.width = width;
    surface.height = height;
    const context = surface.getContext('2d');
    if (!context) {
      throw new Error('A 2D canvas is needed to draw the room');
    }
    draw?.(context, width, height);
    const texture = new three.CanvasTexture(surface);
    texture.colorSpace = three.SRGBColorSpace;
    texture.anisotropy = 4;
    return { texture, context, surface };
  };
}

function shade(group: T.Object3D): void {
  group.traverse((node) => {
    if ((node as T.Mesh).isMesh && !node.userData['flat'] && !node.userData['outline']) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
}

export function createKit(three: Three): Kit {
  const steps = toonSteps(three);
  const outlines: T.Mesh[] = [];
  const toon = (color: string): T.MeshToonMaterial => new three.MeshToonMaterial({ color, gradientMap: steps });
  const put = (mesh: T.Mesh, owner: T.Object3D, at: Vec3, options: PieceOptions): T.Mesh =>
    place(three, outlines, mesh, owner, at, options);
  return {
    three,
    toon,
    box: (owner, size, color, at, options = {}) =>
      put(new three.Mesh(new three.BoxGeometry(...size), toon(color)), owner, at, options),
    cylinder: (owner, top, bottom, height, color, at, options = {}) =>
      put(new three.Mesh(new three.CylinderGeometry(top, bottom, height, 32), toon(color)), owner, at, options),
    flat(owner, width, height, texture, at, rotation) {
      const mesh = new three.Mesh(
        new three.PlaneGeometry(width, height),
        new three.MeshBasicMaterial({ map: texture, toneMapped: false }),
      );
      mesh.position.set(...at);
      if (rotation) {
        mesh.rotation.set(...rotation);
      }
      mesh.userData['flat'] = true;
      owner.add(mesh);
      return mesh;
    },
    spot(name, anchor) {
      const group = new three.Group();
      group.name = name;
      group.userData['spot'] = { name, anchor, group, outlines: [] } satisfies Spot;
      return group;
    },
    shade,
    paint: painter(three),
    setOutlines(visible) {
      for (const line of outlines) {
        line.visible = visible;
      }
    },
  };
}

export function spotInfo(group: T.Object3D): Spot {
  const spot = spotOf(group);
  if (!spot) {
    throw new Error(`${group.name} is not a spot of the room`);
  }
  return spot;
}
