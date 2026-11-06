/// <reference lib="dom" />
import { readPercent } from './rules.ts';

const output = document.querySelector('[data-progress]');
const pane = document.getElementById('pane');

/** On wide screens the pane scrolls inside the window; on narrow ones the page itself scrolls. */
function update(): void {
  if (!output) {
    return;
  }
  const scroller = pane && pane.scrollHeight > pane.clientHeight + 1 ? pane : null;
  output.textContent = scroller
    ? String(readPercent(scroller.scrollTop, scroller.scrollHeight, scroller.clientHeight))
    : String(readPercent(window.scrollY, document.documentElement.scrollHeight, window.innerHeight));
}

update();
pane?.addEventListener('scroll', update, { passive: true });
addEventListener('scroll', update, { passive: true });
addEventListener('resize', update);
