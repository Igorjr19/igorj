import type { Page } from '@astral/astral';
import type { PageOptions, Session } from '../../e2e/support/session.ts';

/** State shared by the steps of one scenario. */
export interface World {
  readonly session: Session;
  pageOptions: PageOptions;
  page?: Page;
  /** Markdown body of the post the scenario opened. */
  post?: string;
}

export function currentPage(world: World): Page {
  if (!world.page) {
    throw new Error('No page is open; a "When" step must open one first');
  }
  return world.page;
}
