import type { Gray, Rgba } from './types.ts';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Rec. 601 luma, which is what a photo in grays is usually meant to be. */
export function grayscale(image: Rgba): Gray {
  const data = new Float32Array(image.width * image.height);
  for (let index = 0; index < data.length; index += 1) {
    const at = index * 4;
    const luma = 0.299 * (image.data[at] ?? 0) + 0.587 * (image.data[at + 1] ?? 0) + 0.114 * (image.data[at + 2] ?? 0);
    data[index] = luma / 255;
  }
  return { width: image.width, height: image.height, data };
}

function gaussianKernel(sigma: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let offset = -radius; offset <= radius; offset += 1) {
    const weight = Math.exp(-(offset * offset) / (2 * sigma * sigma));
    kernel[offset + radius] = weight;
    sum += weight;
  }
  return kernel.map((weight) => weight / sum);
}

const clampTo = (value: number, last: number): number => Math.min(last, Math.max(0, value));

function blurPixel(image: Gray, kernel: Float32Array, at: [number, number], horizontal: boolean): number {
  const [x, y] = at;
  const radius = (kernel.length - 1) / 2;
  let sum = 0;
  for (let offset = -radius; offset <= radius; offset += 1) {
    const sx = horizontal ? clampTo(x + offset, image.width - 1) : x;
    const sy = horizontal ? y : clampTo(y + offset, image.height - 1);
    sum += (kernel[offset + radius] ?? 0) * (image.data[sy * image.width + sx] ?? 0);
  }
  return sum;
}

/** Blurs along one axis, repeating the edge pixels beyond the border. */
function blurAxis(image: Gray, kernel: Float32Array, horizontal: boolean): Gray {
  const data = new Float32Array(image.data.length);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      data[y * image.width + x] = blurPixel(image, kernel, [x, y], horizontal);
    }
  }
  return { width: image.width, height: image.height, data };
}

export function gaussianBlur(image: Gray, sigma: number): Gray {
  const kernel = gaussianKernel(sigma);
  return blurAxis(blurAxis(image, kernel, true), kernel, false);
}

/** Adds back the detail the blur removes: `amount` of the difference, wherever it is at least `threshold`. */
export function unsharpMask(image: Gray, sigma: number, amount: number, threshold: number): Gray {
  const blurred = gaussianBlur(image, sigma);
  const data = image.data.map((value, index) => {
    const difference = value - (blurred.data[index] ?? 0);
    return clamp01(Math.abs(difference) >= threshold ? value + amount * difference : value);
  });
  return { width: image.width, height: image.height, data };
}

/** Adds the given share of white to every pixel, so the middle tones lift and the dark ones barely move. */
export function brightness(image: Gray, percent: number): Gray {
  return { ...image, data: image.data.map((value) => clamp01(value + percent / 100)) };
}

/** An S-shaped curve: values below the midpoint go darker and values above it go lighter, `factor` setting how sharply. */
export function sigmoid(image: Gray, midpoint: number, factor: number): Gray {
  const curve = (value: number): number => 1 / (1 + Math.exp(factor * (midpoint - value)));
  const low = curve(0);
  const span = curve(1) - low;
  return { ...image, data: image.data.map((value) => clamp01((curve(value) - low) / span)) };
}
