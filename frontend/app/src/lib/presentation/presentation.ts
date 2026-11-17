/** How the site is shown: as a 3D room with the site on a monitor, or plain. The visitor's choice outlives the visit. */
export const PRESENTATION_KEY = 'presentation';

export type Presentation = 'scene' | 'simple';

export function parsePresentation(value: string | null | undefined): Presentation | null {
  return value === 'scene' || value === 'simple' ? value : null;
}

export interface PresentationInput {
  /** What the visitor chose, if anything. */
  readonly saved: Presentation | null;
  /** The window is big enough and the browser draws 3D. */
  readonly capable: boolean;
  /** Test and crawler browsers keep the plain site unless the choice says otherwise. */
  readonly automated: boolean;
}

/** The scene needs room and 3D; where it can be, a choice wins, and with none it is the default for people. */
export function resolvePresentation({ saved, capable, automated }: PresentationInput): Presentation {
  if (!capable) {
    return 'simple';
  }
  if (saved) {
    return saved;
  }
  return automated ? 'simple' : 'scene';
}
