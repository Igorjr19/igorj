import { getContext, setContext } from 'svelte';
import type { ItemsView } from './items/view.ts';
import { otherView } from './items/view.ts';

/** What the window shows that the visitor can change: the side column, the list or grid view and the help. */
export class Ui {
  /** The visitor's own choice for this page; none follows the page, which hides the side column when it is read. */
  #side = $state<boolean | null>(null);
  view = $state<ItemsView>('list');
  helpOpen = $state(false);
  /** The quick-pick box that is open, if any: the palette, the filter of the blog or the themes. */
  pick = $state<'palette' | 'filter' | 'theme' | null>(null);

  /** Whether the side column is hidden, given what the page itself asks for. */
  sideHidden(pageHides: boolean): boolean {
    return this.#side ?? pageHides;
  }

  toggleSide(pageHides: boolean): void {
    this.#side = !this.sideHidden(pageHides);
  }

  /** A new page starts from what the page asks for. */
  newPage(): void {
    this.#side = null;
  }

  toggleView(): void {
    this.view = otherView(this.view);
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
