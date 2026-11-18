import { getContext, setContext } from 'svelte';
import type { ItemsView } from './items/view.ts';
import { otherView } from './items/view.ts';
import { slideSide } from './motion/side.ts';
import { transition } from './motion/transition.ts';
import type { SavedTheme } from './theme/storage.ts';

/** What the window shows that the visitor can change: the side column, the list or grid view and the help. */
export class Ui {
  /** The visitor's own choice for this page; none follows the page, which hides the side column when it is read. */
  #side = $state<boolean | null>(null);
  view = $state<ItemsView>('list');
  helpOpen = $state(false);
  terminalOpen = $state(false);
  /** The share of the content column the terminal takes, kept between visits. */
  terminalHeight = $state(0.45);
  /** While the visitor drags the terminal's edge, the height follows the pointer at once. */
  resizing = $state(false);
  /** True while a page change runs, so nothing else animates under its transition. */
  navigating = $state(false);
  /** The page the visitor came from within the site, so a back button can return to it, wherever it was. */
  cameFrom = $state<string | null>(null);
  /** What the visitor chose for the theme, for the status line; not known until the saved choice is read, none when there is none. */
  theme = $state<SavedTheme | null | undefined>(undefined);
  /** The quick-pick box that is open, if any: the palette, the filter of the blog or the themes. */
  pick = $state<'palette' | 'filter' | 'theme' | null>(null);

  /** Whether the side column is hidden, given what the page itself asks for. */
  sideHidden(pageHides: boolean): boolean {
    return this.#side ?? pageHides;
  }

  /** The page is laid out once, in its final shape, and the column and the page slide into it by moving. */
  toggleSide(pageHides: boolean): void {
    const hidden = !this.sideHidden(pageHides);
    slideSide(() => {
      this.#side = hidden;
    });
  }

  /** A new page starts from what the page asks for. */
  newPage(): void {
    this.#side = null;
  }

  /** The switch between list and grid crossfades in place where the browser can. */
  setView(view: ItemsView): void {
    transition(() => {
      this.view = view;
    }, 'view');
  }

  toggleView(): void {
    this.setView(otherView(this.view));
  }
}

const KEY = Symbol('ui');

export function provideUi(): Ui {
  const ui = new Ui();
  setContext(KEY, ui);
  return ui;
}

export function useUi(): Ui {
  return getContext<Ui>(KEY);
}
