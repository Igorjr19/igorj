import { readPercent } from './progress.ts';

/** How far along the reader is on the page being read, shared by the pane that scrolls and the status line that says it. */
class Progress {
  percent = $state(0);

  update(pane: HTMLElement): void {
    this.percent = readPercent(pane.scrollTop, pane.scrollHeight, pane.clientHeight);
  }
}

export const progress = new Progress();
