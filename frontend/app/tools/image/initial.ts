/** The first letter or digit of a title, in capitals, which stands for an item that has no picture. */
export function initialOf(title: string): string {
  const match = title.match(/[\p{L}\p{N}]/u);
  return (match?.[0] ?? '·').toLocaleUpperCase();
}
