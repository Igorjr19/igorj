/** A CSS `url()` that survives any address, including an inlined SVG, which holds single quotes of its own. */
export function cssUrl(address: string): string {
  return `url(${JSON.stringify(address)})`;
}
