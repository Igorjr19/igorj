/** How far the camera stands for a flat object of `width` to fill `fill` of the view, whichever of width or height gives out first. */
export function fitDistance(fovDegrees: number, aspect: number, width: number, height: number, fill: number): number {
  const tangent = Math.tan((fovDegrees * Math.PI) / 360);
  const byWidth = width / fill / (2 * tangent * aspect);
  const byHeight = height / fill / (2 * tangent);
  return Math.max(byWidth, byHeight);
}

/** Eases a 0 to 1 progress in and out. */
export function ease(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return clamped * clamped * (3 - 2 * clamped);
}
