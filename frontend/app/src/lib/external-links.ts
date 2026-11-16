/** Whether an address leads to another site than this one. */
export function isExternal(href: string, origin: string): boolean {
  try {
    return new URL(href, origin).origin !== origin;
  } catch {
    return false;
  }
}

/** Marks every link to another site so it opens in a new tab and the site stays open; links within the site stay as they are. */
export function markExternalLinks(root: ParentNode, origin: string): void {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    if (!link.hasAttribute('download') && isExternal(link.getAttribute('href') ?? '', origin)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  }
}
