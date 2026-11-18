export interface Box {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/** Whether a point is outside a box: a click there, on the dark around a modal, is one that means to leave it. */
export function isOutside(box: Box, x: number, y: number): boolean {
  return x < box.left || x > box.right || y < box.top || y > box.bottom;
}

/** Closes a modal when the click landed on its backdrop; a click inside its own padding stays inside. */
export function closeOnOutside(dialog: HTMLDialogElement | undefined, event: MouseEvent): void {
  if (dialog && event.target === dialog && isOutside(dialog.getBoundingClientRect(), event.clientX, event.clientY)) {
    dialog.close();
  }
}
