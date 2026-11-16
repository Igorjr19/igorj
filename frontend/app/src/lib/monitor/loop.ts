/** Runs `frame` on every animation frame with the seconds since the start; it stops by itself while the tab is hidden and when the returned function is called. */
export function animate(frame: (seconds: number) => void): () => void {
  let handle = 0;
  let stopped = false;
  const started = performance.now();
  const tick = (now: number): void => {
    if (stopped) {
      return;
    }
    if (!document.hidden) {
      frame((now - started) / 1000);
    }
    handle = requestAnimationFrame(tick);
  };
  handle = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(handle);
  };
}
