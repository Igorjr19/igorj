import github from '@fortawesome/fontawesome-free/svgs/brands/github.svg?raw';
import instagram from '@fortawesome/fontawesome-free/svgs/brands/instagram.svg?raw';
import lastfm from '@fortawesome/fontawesome-free/svgs/brands/lastfm.svg?raw';
import letterboxd from '@fortawesome/fontawesome-free/svgs/brands/letterboxd.svg?raw';
import linkedin from '@fortawesome/fontawesome-free/svgs/brands/linkedin.svg?raw';
import circleHalfStroke from '@fortawesome/fontawesome-free/svgs/solid/circle-half-stroke.svg?raw';
import circleQuestion from '@fortawesome/fontawesome-free/svgs/solid/circle-question.svg?raw';
import envelope from '@fortawesome/fontawesome-free/svgs/solid/envelope.svg?raw';
import filter from '@fortawesome/fontawesome-free/svgs/solid/filter.svg?raw';
import list from '@fortawesome/fontawesome-free/svgs/solid/list.svg?raw';
import magnifyingGlass from '@fortawesome/fontawesome-free/svgs/solid/magnifying-glass.svg?raw';
import rss from '@fortawesome/fontawesome-free/svgs/solid/rss.svg?raw';
import shareNodes from '@fortawesome/fontawesome-free/svgs/solid/share-nodes.svg?raw';
import star from '@fortawesome/fontawesome-free/svgs/solid/star.svg?raw';
import tableCellsLarge from '@fortawesome/fontawesome-free/svgs/solid/table-cells-large.svg?raw';
import tableColumns from '@fortawesome/fontawesome-free/svgs/solid/table-columns.svg?raw';
import terminal from '@fortawesome/fontawesome-free/svgs/solid/terminal.svg?raw';

const SOLID = {
  envelope,
  'table-columns': tableColumns,
  terminal,
  'circle-half-stroke': circleHalfStroke,
  'circle-question': circleQuestion,
  rss,
  list,
  'table-cells-large': tableCellsLarge,
  filter,
  'magnifying-glass': magnifyingGlass,
  star,
  'share-nodes': shareNodes,
};

const BRANDS = { github, linkedin, instagram, lastfm, letterboxd };

export type UiIcon = keyof typeof SOLID;

/** The inline SVG with the license comment dropped and the attributes that make it a decoration the text beside it names. */
function inline(svg: string, name: string): string {
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
    .replace(
      '<svg ',
      `<svg class="icon ${name}" aria-hidden="true" focusable="false" preserveAspectRatio="xMinYMid meet" `,
    );
}

export function uiIcon(name: UiIcon): string {
  return inline(SOLID[name], 'icon--ui');
}

/** The brand icon of a network by its name, or an empty string for a network without one. */
export function networkIcon(network: string): string {
  const svg = (BRANDS as Record<string, string>)[network.toLowerCase().replace(/[^a-z]/g, '')];
  return svg ? inline(svg, 'icon--network') : '';
}
