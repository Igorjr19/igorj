import type { Three } from './three.ts';

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Where a flat screen of `width` by `height`, centered on `center`, lands in a view of `viewWidth` by `viewHeight` pixels. */
export function screenRect(
  three: Three,
  camera: InstanceType<Three['PerspectiveCamera']>,
  center: { readonly x: number; readonly y: number; readonly z: number },
  size: { readonly width: number; readonly height: number },
  view: { readonly width: number; readonly height: number },
): Rect {
  camera.updateMatrixWorld();
  const corner = (dx: number, dy: number): { x: number; y: number } => {
    const point = new three.Vector3(center.x + dx * size.width, center.y + dy * size.height, center.z).project(camera);
    return { x: ((point.x + 1) / 2) * view.width, y: ((1 - point.y) / 2) * view.height };
  };
  const topLeft = corner(-0.5, 0.5);
  const bottomRight = corner(0.5, -0.5);
  return {
    left: Math.round(topLeft.x),
    top: Math.round(topLeft.y),
    width: Math.round(bottomRight.x - topLeft.x),
    height: Math.round(bottomRight.y - topLeft.y),
  };
}
