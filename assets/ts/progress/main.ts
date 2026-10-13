/// <reference lib="dom" />
import { readPercent } from './rules.ts';

const output = document.querySelector('[data-progress]');

function update(): void {
  const root = document.documentElement;
  if (output) {
    output.textContent = String(readPercent(window.scrollY, root.scrollHeight, window.innerHeight));
  }
}

update();
addEventListener('scroll', update, { passive: true });
addEventListener('resize', update);
