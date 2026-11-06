/// <reference lib="dom" />
// The scripts of a page that is read: how far along the reader is, and the copy buttons on its code.
import '../progress/main.ts';

/** How long a button says the code was copied. */
const COPIED_MS = 1500;

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  const label = button.textContent ?? '';
  button.hidden = false;
  button.addEventListener('click', () => {
    const code = button.parentElement?.querySelector('pre')?.textContent ?? '';
    navigator.clipboard
      ?.writeText(code)
      .then(() => {
        button.textContent = button.dataset['copied'] ?? label;
        setTimeout(() => {
          button.textContent = label;
        }, COPIED_MS);
      })
      .catch(() => {
        // Clipboard refused: the code is still there to select.
      });
  });
}
