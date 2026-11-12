export const SITE_URL = process.env['SITE_URL'] ?? 'https://igorj.dev/';

/** The absolute address of a path of the site. */
export function absolute(path: string): string {
  return new URL(path, SITE_URL).href;
}
