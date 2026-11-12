/** A page that is read, such as a post, hides the side column on its own, so the text takes the window. */
export function isReadingPage(pathname: string): boolean {
  return pathname.split('/').filter(Boolean).length > 2 && !/^\/[^/]+\/(?:tags|categories)\/[^/]+\/$/.test(pathname);
}
