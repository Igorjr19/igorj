import type { FontFace, FontPackage, FontPreload, FontsManifest } from './types.ts';

/** Lists one @font-face per family, weight, style and subset. */
export function planFontFaces(manifest: FontsManifest, packages: ReadonlyMap<string, FontPackage>): FontFace[] {
  return manifest.families.flatMap((family) => {
    const fontPackage = packages.get(family.package);
    if (!fontPackage) {
      throw new Error(`Package ${family.package} is not installed`);
    }
    return family.weights.flatMap((weight) =>
      family.styles.flatMap((style) =>
        manifest.subsets.map((subset) => {
          const unicodeRange = fontPackage.unicodeRanges[subset];
          if (!unicodeRange) {
            throw new Error(`${family.package} has no "${subset}" subset`);
          }
          const fileName = `${fontPackage.id}-${subset}-${weight}-${style}.woff2`;
          return {
            family: family.name,
            style,
            weight,
            subset,
            unicodeRange,
            packageName: family.package,
            fileName,
            relativePath: `${fontPackage.id}/${fileName}`,
          };
        }),
      ),
    );
  });
}

/** Finds the planned face for each preload entry; a preload without a matching face is a manifest error. */
export function selectPreloads(faces: readonly FontFace[], preloads: readonly FontPreload[]): FontFace[] {
  return preloads.map((preload) => {
    const face = faces.find(
      (candidate) =>
        candidate.family === preload.family &&
        candidate.weight === preload.weight &&
        candidate.style === preload.style &&
        candidate.subset === preload.subset,
    );
    if (!face) {
      throw new Error(`No planned face for preload ${JSON.stringify(preload)}`);
    }
    return face;
  });
}
