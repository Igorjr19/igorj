import type * as T from 'three';
import type { Level } from './budget.ts';
import type { SceneInput } from './input.ts';
import { createKit, type Kit, type Spot, type SpotName, spotInfo } from './kit.ts';
import type { Anchor } from './neighbour.ts';
import type { Mark } from './overlay.ts';
import { buildBooks } from './parts/books.ts';
import type { Objects } from './parts/context.ts';
import { buildCorkboard } from './parts/corkboard.ts';
import { buildDesk, buildMonitor, SCREEN } from './parts/desk.ts';
import { buildIpod, type Ipod } from './parts/ipod.ts';
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
  /** The iPod, when the room has music to show. */
  readonly ipod: Ipod | null;
  /** Where each object is on the screen now: the marks for the overlay, and the anchors the arrow keys go by. */
  marks(): Mark[];
  anchors(): Record<string, Anchor>;
  /** The object of the room at a point of the screen, from -1 to 1 across and up. */
  spotAt(x: number, y: number): SpotName | null;
  setPhase(phase: number): void;
  setLevel(level: Level): void;
  resize(width: number, height: number): void;
  render(): void;
  dispose(): void;
}

/** What the room is given besides what it shows: how to fetch a picture, and the call to make when something changed. */
export interface Hooks {
  load(sources: readonly string[]): Promise<HTMLImageElement | null>;
  changed(): void;
}

/** The things on the desk and the wall that show what the visitor listens to, reads and watches. */
function shelves(objects: Objects, input: SceneInput): { ipod: Ipod | null; pieces: T.Group[] } {
  const ipod = input.music ? buildIpod(objects, input.music) : null;
  const books = input.books.length > 0 ? buildBooks(objects, input.books) : null;
  const board = input.films.length > 0 ? buildCorkboard(objects, input.films) : null;
  return { ipod, pieces: [ipod?.spot, books, board].filter((piece): piece is T.Group => Boolean(piece)) };
}

/** Where each object's mark falls on the screen, as a share of its width and height. */
function marksOf(three: Three, camera: T.PerspectiveCamera, spots: readonly Spot[]): Mark[] {
  camera.updateMatrixWorld();
  return spots.map((spot) => {
    const at = spot.group.localToWorld(new three.Vector3(...spot.anchor)).project(camera);
    return { name: spot.name, x: (at.x + 1) / 2, y: (1 - at.y) / 2, visible: at.z < 1 };
  });
}

function rendererOf(three: Three, container: HTMLElement): T.WebGLRenderer {
  const renderer = new three.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = three.PCFSoftShadowMap;
  renderer.domElement.className = 'scene__canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.append(renderer.domElement);
  return renderer;
}

/** Turns the room's cost up or down: soft shadows and outlines and a sharp picture, or none of them. */
function setLevel(room: Room, kit: Kit, renderer: T.WebGLRenderer, level: Level, shadows: (on: boolean) => void): void {
  const full = level === 'full';
  renderer.shadowMap.enabled = full;
  shadows(full);
  kit.setOutlines(full);
  renderer.setPixelRatio(full ? Math.min(devicePixelRatio || 1, 2) : 1);
  room.scene.traverse((node) => {
    const material = (node as T.Mesh).material as T.Material | undefined;
    if (material) {
      material.needsUpdate = true;
    }
  });
}

/** The whole room: the desk with its monitor and what is on it, the window, the lamp and the plant. Throws when WebGL is missing. */
export function createRoom(three: Three, container: HTMLElement, input: SceneInput, hooks: Hooks): Room {
  const renderer = rendererOf(three, container);
  const kit = createKit(three);
  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(35, 1, 0.1, 80);
  const shell = buildShell(kit);
  const sky = buildWindow(kit);
  const monitor = buildMonitor(kit);
  const lamp = buildLamp(kit);
  const plant = buildPlant(kit);
  const lights = buildLights(kit, shell, lamp, scene);
  const { ipod, pieces } = shelves({ kit, strings: input.strings, load: hooks.load, changed: hooks.changed }, input);
  scene.add(shell.group, sky.spot, buildDesk(kit), monitor.spot, lamp.group, plant.spot, lights.group, ...pieces);

  const spots = [monitor.spot, sky.spot, plant.spot, ...pieces].map(spotInfo);
  const raycaster = new three.Raycaster();
  const room: Room = {
    scene,
    camera,
    element: renderer.domElement,
    screen: monitor.screen,
    spots,
    plant,
    ipod,
    marks: () => marksOf(three, camera, spots),
    anchors: () =>
      Object.fromEntries(
        marksOf(three, camera, spots).map((mark) => [mark.name, { x: mark.x * 2 - 1, y: 1 - mark.y * 2 }]),
      ),
    spotAt(x, y) {
      raycaster.setFromCamera(new three.Vector2(x, y), camera);
      let node: T.Object3D | null =
        raycaster.intersectObjects(
          spots.map((spot) => spot.group),
          true,
        )[0]?.object ?? null;
      while (node && !node.userData['spot']) {
        node = node.parent;
      }
      return node ? (node.name as SpotName) : null;
    },
    setPhase(phase) {
      lights.setPhase(phase);
      sky.setPhase(phase);
    },
    setLevel: (level) => setLevel(room, kit, renderer, level, lights.setShadows),
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render: () => renderer.render(scene, camera),
    dispose() {
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  return room;
}
