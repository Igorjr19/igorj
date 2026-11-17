import type { Three } from './three.ts';

/** Quantizes the picture to four steps between two theme colors with an ordered dither, one dot per `cell` pixels. */
export function ditherShader(three: Three, dark: string, light: string, cell: number) {
  return {
    uniforms: {
      tDiffuse: { value: null },
      dark: { value: new three.Color(dark) },
      light: { value: new three.Color(light) },
      cell: { value: cell },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec3 dark;
      uniform vec3 light;
      uniform float cell;
      varying vec2 vUv;
      float order2(vec2 p) { return mod(p.x * 2.0 + p.y * 3.0, 4.0); }
      float order4(vec2 p) {
        vec2 q = mod(floor(p), 4.0);
        return (4.0 * order2(mod(q, 2.0)) + order2(floor(q / 2.0))) / 16.0;
      }
      void main() {
        vec3 color = texture2D(tDiffuse, vUv).rgb;
        float luma = dot(color, vec3(0.299, 0.587, 0.114));
        float scaled = clamp(luma, 0.0, 1.0) * 3.0;
        float low = floor(scaled);
        float level = (low + step(order4(gl_FragCoord.xy / cell), scaled - low)) / 3.0;
        gl_FragColor = vec4(mix(dark, light, level), 1.0);
      }`,
  };
}
