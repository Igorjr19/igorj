/// <reference lib="dom" />
// The scripts of a page that is read: how far along the reader is, the copy buttons on its code and the share button.
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

/** Opens the system's sharing where there is one; elsewhere copies the address and says so. */
const share = document.querySelector<HTMLElement>('[data-share]');
const shareButton = share?.querySelector('button');
const shareLabel = shareButton?.querySelector('span');
if (share && shareButton && shareLabel) {
  const label = shareLabel.textContent ?? '';
  share.hidden = false;
  shareButton.addEventListener('click', () => {
    const page = { title: document.title, url: location.href };
    if (navigator.share) {
      navigator.share(page).catch(() => {
        // Closed without sharing: nothing to undo.
      });
      return;
    }
    navigator.clipboard
      ?.writeText(page.url)
      .then(() => {
        shareLabel.textContent = shareButton.dataset['copied'] ?? label;
        setTimeout(() => {
          shareLabel.textContent = label;
        }, COPIED_MS);
      })
      .catch(() => {
        // Clipboard refused: the address bar still has the link.
      });
  });
}
