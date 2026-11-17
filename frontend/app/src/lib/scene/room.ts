import type * as T from 'three';
import type { Level } from './budget.ts';
import { createKit, type Spot, spotInfo } from './kit.ts';
import { buildDesk, buildMonitor, SCREEN } from './parts/desk.ts';
import { buildLamp } from './parts/lamp.ts';
import { buildLights } from './parts/lights.ts';
import { buildPlant, type Plant } from './parts/plant.ts';
import { buildShell } from './parts/shell.ts';
import { buildWindow } from './parts/window.ts';
import type { Three } from './three.ts';

export { SCREEN };

export interface Room {
  readonly scene: T.Scene;
  readonly camera: T.PerspectiveCamera;
  readonly element: HTMLCanvasElement;
  /** The plane of the screen of the monitor, which the window of the page is laid over. */
  readonly screen: T.Mesh;
  readonly spots: readonly Spot[];
  readonly plant: Plant;
  setPhase(phase: number): void;
  setLevel(level: Level): void;
  resize(width: number, height: number): void;
  render(): void;
  dispose(): void;
}

/** The whole room: the desk with its monitor, the window, the lamp and the plant. Throws when WebGL is missing. */
export function createRoom(three: Three, container: HTMLElement): Room {
  const renderer = new three.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = three.PCFSoftShadowMap;
  renderer.domElement.className = 'scene__canvas';
  container.append(renderer.domElement);

  const kit = createKit(three);
  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(35, 1, 0.1, 80);
  const shell = buildShell(kit);
  const sky = buildWindow(kit);
  const monitor = buildMonitor(kit);
  const lamp = buildLamp(kit);
  const plant = buildPlant(kit);
  const lights = buildLights(kit, shell, lamp, scene);
  scene.add(shell.group, sky.spot, buildDesk(kit), monitor.spot, lamp.group, plant.spot, lights.group);

  let pixelRatio = Math.min(devicePixelRatio || 1, 2);
  let size = { width: 1, height: 1 };
  const fit = (): void => {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(size.width, size.height, false);
  };
  return {
    scene,
    camera,
    element: renderer.domElement,
    screen: monitor.screen,
    spots: [monitor.spot, sky.spot, plant.spot].map(spotInfo),
    plant,
    setPhase(phase) {
      lights.setPhase(phase);
      sky.setPhase(phase);
    },
    setLevel(level) {
      const full = level === 'full';
      renderer.shadowMap.enabled = full;
      lights.setShadows(full);
      kit.setOutlines(full);
      pixelRatio = full ? Math.min(devicePixelRatio || 1, 2) : 1;
      fit();
      scene.traverse((node) => {
        const material = (node as T.Mesh).material as T.Material | undefined;
        if (material) {
          material.needsUpdate = true;
        }
      });
    },
    resize(width, height) {
      size = { width, height };
      fit();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render: () => renderer.render(scene, camera),
    dispose() {
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
