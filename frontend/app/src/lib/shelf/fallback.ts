/**
 * Hides a picture that did not load, so the card behind it shows. An error before the page took over leaves no event
 * to hear, so the state is read once as well.
 */
export function hideIfBroken(image: HTMLImageElement): { destroy: () => void } {
  const hide = (): void => {
    image.hidden = true;
  };
  if (image.complete && image.naturalWidth === 0) {
    hide();
  }
  image.addEventListener('error', hide);
  return { destroy: () => image.removeEventListener('error', hide) };
}
