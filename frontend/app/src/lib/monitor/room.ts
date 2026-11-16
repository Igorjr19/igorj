import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { ditherShader } from './dither-pass.ts';
import type { Palette } from './palette.ts';
import type { Three } from './three.ts';

/** The screen of the monitor, in world units, centered on `position`. */
export const SCREEN = { width: 1.6, height: 1, x: 0, y: 1.35, z: 0 } as const;

export interface Room {
  readonly scene: InstanceType<Three['Scene']>;
  readonly camera: InstanceType<Three['PerspectiveCamera']>;
  readonly screen: InstanceType<Three['Mesh']>;
  readonly element: HTMLCanvasElement;
  resize(width: number, height: number): void;
  render(): void;
  dispose(): void;
}

function box(three: Three, size: [number, number, number], at: [number, number, number], color: string) {
  const mesh = new three.Mesh(
    new three.BoxGeometry(...size),
    new three.MeshStandardMaterial({ color, roughness: 0.8 }),
  );
  mesh.position.set(...at);
  return mesh;
}

function furniture(three: Three, palette: Palette): InstanceType<Three['Group']> {
  const group = new three.Group();
  group.add(box(three, [7, 0.1, 3], [0, 0.45, 0.2], palette.surface));
  group.add(box(three, [1.9, 1.3, 0.16], [0, SCREEN.y, -0.1], palette.text));
  group.add(box(three, [0.18, 0.5, 0.12], [0, 0.78, -0.18], palette.text));
  group.add(box(three, [0.8, 0.04, 0.5], [0, 0.52, -0.1], palette.text));
  group.add(box(three, [1.2, 0.05, 0.4], [0, 0.52, 0.85], palette.text));
  group.add(box(three, [9, 5, 0.1], [0, 1.6, -1.4], palette.background));
  const mug = new three.Mesh(
    new three.CylinderGeometry(0.11, 0.1, 0.22, 20),
    new three.MeshStandardMaterial({ color: palette.accent, roughness: 0.6 }),
  );
  mug.position.set(1.35, 0.62, 0.6);
  group.add(mug);
  return group;
}

function lights(three: Three): InstanceType<Three['Group']> {
  const group = new three.Group();
  const glow = new three.PointLight('#ffffff', 1.2, 6);
  glow.position.set(0, SCREEN.y, 1.2);
  group.add(glow, new three.AmbientLight('#ffffff', 0.5));
  const lamp = new three.DirectionalLight('#ffffff', 1.1);
  lamp.position.set(-3, 4, 3);
  group.add(lamp);
  return group;
}

function composerOf(
  three: Three,
  renderer: InstanceType<Three['WebGLRenderer']>,
  scene: InstanceType<Three['Scene']>,
  camera: InstanceType<Three['PerspectiveCamera']>,
  palette: Palette,
) {
  // Plain 8-bit targets: the picture ends in four steps, and not every browser can draw into floating point ones.
  const target = new three.WebGLRenderTarget(1, 1, { type: three.UnsignedByteType });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass(ditherShader(three, palette.background, palette.text, 3)));
  composer.addPass(new OutputPass());
  return composer;
}

/** A desk with a monitor, built from primitives, drawn through a dither in the colors of the theme. Throws when WebGL is missing. */
export function createRoom(three: Three, container: HTMLElement, palette: Palette): Room {
  const renderer = new three.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(1);
  renderer.domElement.className = 'monitor__canvas';
  container.append(renderer.domElement);
  const scene = new three.Scene();
  scene.background = new three.Color(palette.background);
  const camera = new three.PerspectiveCamera(35, 1, 0.1, 50);
  scene.add(furniture(three, palette), lights(three));
  const screen = new three.Mesh(
    new three.PlaneGeometry(SCREEN.width, SCREEN.height),
    new three.MeshBasicMaterial({ color: palette.background }),
  );
  screen.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
  scene.add(screen);
  const composer = composerOf(three, renderer, scene, camera, palette);
  return {
    scene,
    camera,
    screen,
    element: renderer.domElement,
    resize(width, height) {
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render: () => composer.render(),
    dispose() {
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
