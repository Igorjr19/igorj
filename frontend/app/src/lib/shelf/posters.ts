/** The poster sizes Letterboxd serves: the same address with the size in its name. */
const SIZE = /-0-\d+-0-\d+-crop/;

/** The poster at a width, in the 2:3 of the originals; an address that does not carry its size is left as it is. */
export function posterAt(address: string, width: number): string {
  return address.replace(SIZE, `-0-${width}-0-${Math.round(width * 1.5)}-crop`);
}

/** The poster for the screen it is drawn on: 230 px wide, and twice that for dense screens. */
export function posterSources(address: string): { readonly src: string; readonly srcset: string } {
  return { src: posterAt(address, 230), srcset: `${posterAt(address, 230)} 230w, ${posterAt(address, 460)} 460w` };
}
