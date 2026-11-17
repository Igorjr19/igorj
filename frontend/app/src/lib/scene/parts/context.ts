import type { Kit } from '../kit.ts';

/** What the objects need from the room around them: the kit, the way to fetch a picture, and the call to redraw. */
export interface Objects {
  readonly kit: Kit;
  readonly strings: Readonly<Record<string, string>>;
  load(sources: readonly string[]): Promise<HTMLImageElement | null>;
  /** Something that shows has changed, so the room must be drawn again. */
  changed(): void;
}
