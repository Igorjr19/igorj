export interface Palette {
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly accent: string;
}

/** The color a theme role has right now, as `rgb(...)`, whatever notation the theme writes it in. */
function resolved(context: CanvasRenderingContext2D, role: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${role})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${red}, ${green}, ${blue})`;
}

export function readPalette(): Palette {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return {
      background: 'rgb(20, 20, 30)',
      surface: 'rgb(40, 40, 55)',
      text: 'rgb(220, 220, 230)',
      accent: 'rgb(140, 100, 250)',
    };
  }
  return {
    background: resolved(context, '--color-background'),
    surface: resolved(context, '--color-surface-2'),
    text: resolved(context, '--color-text'),
    accent: resolved(context, '--color-accent'),
  };
}
