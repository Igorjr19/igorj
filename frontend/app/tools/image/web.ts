/** The size a picture is shown at on screen: no wider than `max`, in its own proportions; none when it is already small enough. */
export function webSize(
  width: number,
  height: number,
  max: number,
): { readonly width: number; readonly height: number } | null {
  return width <= max ? null : { width: max, height: Math.round((height * max) / width) };
}

/** A drawing keeps its sharp edges and its transparency in a PNG; a photograph is far smaller as a JPEG. */
export function webKind(path: string): 'jpg' | 'png' {
  return path.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
}
