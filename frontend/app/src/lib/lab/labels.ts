/** The words of the prototype pages, which live outside the site and go away once the monitor is chosen. */
export const LAB = {
  title: 'Monitor prototypes',
  back: 'lab',
  noWebgl: 'WebGL is not available here, so this prototype cannot show its 3D scene.',
  replay: 'replay',
  skip: 'skip',
  variants: [
    {
      key: 'monitor',
      letter: 'A',
      name: 'The real page on a 3D monitor',
      note: 'The site runs live inside the screen, with glass, reflection and scanlines over it; the camera follows the pointer a little.',
    },
    {
      key: 'boot',
      letter: 'B',
      name: 'Boot on the monitor, camera goes in',
      note: 'A power-on test on the screen while the camera moves in, until the live site takes the whole window.',
    },
    {
      key: 'pattern',
      letter: 'C',
      name: 'Game of life behind the window',
      note: 'No 3D: the window floats over a pattern in the grid of cells, paused while the tab is hidden.',
    },
  ],
} as const;
