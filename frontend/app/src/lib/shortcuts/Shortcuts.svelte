<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { isReadingPage } from '../layout.ts';
  import { useShell } from '../shell.svelte.ts';
  import { useUi } from '../ui.svelte.ts';
  import { actionForKey, isShortcutCandidate, type NavigationTarget, type ShortcutAction, stepIndex } from './rules.ts';

  const shell = useShell();
  const ui = useUi();

  const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
  /** The rows j and k move through: list items on list pages, the recent rows on the home. */
  const ITEMS = '.item__link, .recent__row';

  const items = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>(ITEMS)].filter((item) => item.checkVisibility());

  function openPane(index: number): void {
    const pane = shell.panes[index];
    if (!pane) {
      return;
    }
    if (page.url.pathname === pane.href) {
      (items()[0] ?? document.getElementById('pane'))?.focus();
    } else {
      void goto(pane.href);
    }
  }

  function move(step: 1 | -1): boolean {
    const all = items();
    const target = all[stepIndex(all.indexOf(document.activeElement as HTMLElement), step, all.length)];
    target?.focus();
    target?.scrollIntoView({ block: 'nearest' });
    return target !== undefined;
  }

  /** Follows the page's own link for that direction; pages without one leave the key alone. */
  function navigate(target: NavigationTarget): boolean {
    const link = document.querySelector<HTMLAnchorElement>(`[data-nav="${target}"]`);
    link?.click();
    return link !== null;
  }

  function perform(action: ShortcutAction): boolean {
    switch (action.kind) {
      case 'pane':
        openPane(action.index);
        return true;
      case 'move':
        return move(action.step);
      case 'navigate':
        return navigate(action.target);
      case 'view':
        ui.toggleView();
        return document.querySelector('[data-items]') !== null;
      case 'zoom':
        ui.toggleSide(isReadingPage(page.url.pathname));
        return true;
      case 'help':
        ui.helpOpen = true;
        return true;
      default:
        return false;
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    const editable = event.target instanceof Element && event.target.closest(EDITABLE) !== null;
    if (document.querySelector('dialog[open]') || !isShortcutCandidate(event, editable)) {
      return;
    }
    const action = actionForKey(event.key, shell.panes.length, items().length > 0);
    if (action && perform(action)) {
      event.preventDefault();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />
