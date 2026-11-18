/** The name of the site in the corner of the window: the host without any subdomain, so every edition carries the same one. */
export function brandOf(host: string): string {
  const labels = host.split('.');
  return labels.length > 2 ? labels.slice(-2).join('.') : host;
}
