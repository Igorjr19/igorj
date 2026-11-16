import { fitDistance } from './camera.ts';
import { animate } from './loop.ts';
import { readPalette } from './palette.ts';
import { createRoom, type Room, SCREEN } from './room.ts';
import type { Three } from './three.ts';

const PAGE = { width: 1280, height: 800 };
const FOV = 35;

type Css = typeof import('three/addons/renderers/CSS3DRenderer.js');

function screenElement(): HTMLDivElement {
  const frame = document.createElement('div');
  frame.className = 'lab__screen';
  const page = document.createElement('iframe');
  page.src = '/en/';
  page.title = 'igorj.dev';
  page.width = String(PAGE.width);
  page.height = String(PAGE.height);
  const glass = document.createElement('div');
  glass.className = 'lab__glass';
  frame.append(page, glass);
  return frame;
}

function cssLayer(three: Three, css: Css, host: HTMLElement) {
  const renderer = new css.CSS3DRenderer();
  renderer.domElement.className = 'lab__css';
  host.append(renderer.domElement);
  const scene = new three.Scene();
  const object = new css.CSS3DObject(screenElement());
  object.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
  object.scale.setScalar(SCREEN.width / PAGE.width);
  scene.add(object);
  return { renderer, scene };
}

/** Eases the pointer toward where it is, so the camera drifts instead of jumping. */
function pointerDrift() {
  const state = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  const onMove = (event: PointerEvent): void => {
    state.x = (event.clientX / innerWidth) * 2 - 1;
    state.y = (event.clientY / innerHeight) * 2 - 1;
  };
  addEventListener('pointermove', onMove);
  return {
    next(): { yaw: number; pitch: number } {
      state.smoothX += (state.x - state.smoothX) * 0.06;
      state.smoothY += (state.y - state.smoothY) * 0.06;
      return { yaw: state.smoothX * 0.22, pitch: state.smoothY * 0.08 };
    },
    stop: () => removeEventListener('pointermove', onMove),
  };
}

function place(room: Room, distance: number, drift: { yaw: number; pitch: number }): void {
  room.camera.position.set(
    Math.sin(drift.yaw) * distance,
    SCREEN.y + 0.12 + drift.pitch * distance,
    Math.cos(drift.yaw) * distance,
  );
  room.camera.lookAt(SCREEN.x, SCREEN.y, SCREEN.z);
}

/** The real page on a monitor in a 3D room. Resolves to a function that tears it down, or null when WebGL is missing. */
export async function startMonitor(host: HTMLElement): Promise<(() => void) | null> {
  const [three, css] = await Promise.all([import('three'), import('three/addons/renderers/CSS3DRenderer.js')]);
  let room: Room;
  try {
    room = createRoom(three, host, readPalette());
  } catch {
    return null;
  }
  const layer = cssLayer(three, css, host);
  const drift = pointerDrift();
  let distance = 5;
  const fit = (): void => {
    const { clientWidth: width, clientHeight: height } = host;
    room.resize(width, height);
    layer.renderer.setSize(width, height);
    distance = fitDistance(FOV, width / height, SCREEN.width, SCREEN.height, 0.66);
  };
  const observer = new ResizeObserver(fit);
  observer.observe(host);
  fit();
  const stop = animate(() => {
    place(room, distance, drift.next());
    room.render();
    layer.renderer.render(layer.scene, room.camera);
  });
  return () => {
    stop();
    drift.stop();
    observer.disconnect();
    layer.renderer.domElement.remove();
    room.dispose();
  };
}
