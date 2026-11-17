import type { SpotName } from './kit.ts';

const ORDER: readonly SpotName[] = ['monitor', 'window', 'posters', 'music', 'books', 'plant'];

/** A point on the screen, as a share of its width and height, and whether it is in front of the camera. */
export interface Mark {
  readonly name: SpotName;
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export interface Overlay {
  /** Shows the marks of the objects where they are, or hides them. */
  marks(marks: readonly Mark[], shown: boolean): void;
  /** Names the object pointed at, over it, or none. */
  hover(mark: Mark | null): void;
  /** Says what the object chosen is, or nothing. */
  caption(name: SpotName | null): void;
  /** The objects can be reached by keyboard only while the room is in view. */
  reachable(reachable: boolean): void;
  dispose(): void;
}

const capital = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1);
const nameKey = (name: SpotName): string => `scene${capital(name)}Name`;
const textKey = (name: SpotName): string => `scene${capital(name)}Text`;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const made = document.createElement(tag);
  made.className = className;
  return made;
}

function index(strings: Readonly<Record<string, string>>, pick: (name: SpotName) => void): HTMLElement {
  const nav = element('nav', 'scene__index');
  nav.setAttribute('aria-label', strings['sceneIndex'] ?? '');
  const list = element('ul', 'scene__list');
  for (const name of ORDER) {
    const item = element('li', 'scene__item');
    const button = element('button', 'scene__pick');
    button.type = 'button';
    button.textContent = strings[nameKey(name)] ?? name;
    button.addEventListener('click', () => pick(name));
    item.append(button);
    list.append(item);
  }
  nav.append(list);
  nav.inert = true;
  return nav;
}

/**
 * What goes over the room: a small mark on each object, the name of the one pointed at, a caption of the one chosen,
 * and the objects as buttons for the keyboard and for readers of the screen.
 */
export function createOverlay(
  host: HTMLElement,
  strings: Readonly<Record<string, string>>,
  pick: (name: SpotName) => void,
): Overlay {
  const dots = new Map<SpotName, HTMLElement>(ORDER.map((name) => [name, element('span', 'scene__dot')]));
  const label = element('span', 'scene__label');
  const caption = element('p', 'scene__caption');
  caption.setAttribute('aria-live', 'polite');
  const nav = index(strings, pick);
  label.hidden = true;
  caption.hidden = true;
  host.append(...dots.values(), label, caption, nav);
  return {
    marks(marks, shown) {
      for (const mark of marks) {
        const dot = dots.get(mark.name);
        if (dot) {
          dot.style.left = `${mark.x * 100}%`;
          dot.style.top = `${mark.y * 100}%`;
          dot.dataset['shown'] = shown && mark.visible ? '' : 'no';
        }
      }
    },
    hover(mark) {
      label.hidden = mark === null;
      if (mark) {
        label.textContent = strings[nameKey(mark.name)] ?? mark.name;
        label.style.left = `${mark.x * 100}%`;
        label.style.top = `${mark.y * 100}%`;
      }
    },
    caption(name) {
      caption.hidden = name === null;
      if (name) {
        const title = document.createElement('b');
        title.textContent = strings[nameKey(name)] ?? name;
        const text = document.createElement('span');
        text.textContent = strings[textKey(name)] ?? '';
        caption.replaceChildren(title, text);
      }
    },
    reachable(reachable) {
      nav.inert = !reachable;
    },
    dispose() {
      for (const node of [...dots.values(), label, caption, nav]) {
        node.remove();
      }
    },
  };
}
