import { assertAlmostEquals, assertEquals } from '@std/assert';
import * as three from 'three';
import { fitDistance } from '../../../src/lib/lab/camera.ts';
import { screenRect } from '../../../src/lib/lab/screen-rect.ts';

const center = { x: 0, y: 1.35, z: 0 };
const size = { width: 1.6, height: 1 };

Deno.test('a screen seen straight on from the fit distance fills the asked share of the view, centered', () => {
  const view = { width: 1600, height: 1000 };
  const camera = new three.PerspectiveCamera(35, view.width / view.height, 0.1, 50);
  camera.position.set(0, center.y, fitDistance(35, view.width / view.height, size.width, size.height, 0.8));
  camera.lookAt(center.x, center.y, center.z);
  const rect = screenRect(three, camera, center, size, view);
  assertAlmostEquals(rect.height / view.height, 0.8, 0.01);
  assertAlmostEquals(rect.width / rect.height, 1.6, 0.01);
  assertEquals(rect.left * 2 + rect.width, view.width);
  assertEquals(rect.top * 2 + rect.height, view.height);
});
