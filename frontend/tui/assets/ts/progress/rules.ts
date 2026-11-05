/** A page that fits the window has been read in full; otherwise the share of the scrollable distance already passed. */
export function readPercent(scrollTop: number, scrollHeight: number, viewportHeight: number): number {
  const scrollable = scrollHeight - viewportHeight;
  if (scrollable <= 0) {
    return 100;
  }
  return Math.min(100, Math.max(0, Math.round((scrollTop / scrollable) * 100)));
}
