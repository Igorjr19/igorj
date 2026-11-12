import type { SiteModel } from '../../../../../tools/model/types.ts';
import { languageInfo } from '../languages.ts';
import { type ItemSection, itemHref } from '../routes.ts';
import { enabledSections } from '../sections.ts';
import type { SitemapUrl } from '../sitemap.ts';
import { modelLanguages, readModel } from './model.ts';
import { absolute } from './site.ts';

interface Page {
  /** The same for a page and its translations. */
  readonly key: string;
  readonly language: string;
  readonly path: string;
  readonly lastmod?: string | undefined;
}

const ITEM_SECTIONS: readonly ItemSection[] = ['posts', 'projects', 'research'];

function pagesOf(model: SiteModel): Page[] {
  const { language } = model;
  const page = (key: string, path: string, lastmod?: string): Page => ({ key, language, path, lastmod });
  const sections = enabledSections(model.sections).map((section) =>
    page(section.path, section.path ? `/${language}/${section.path}/` : `/${language}/`),
  );
  const items = ITEM_SECTIONS.flatMap((section) =>
    model[section]
      .filter((item) => item.language === language)
      .map((item) =>
        page(
          `${section}:${item.id}`,
          itemHref(section, item),
          'lastmod' in item ? (item.lastmod ?? item.date) : undefined,
        ),
      ),
  );
  const categories = model.sections.posts
    ? model.categories.map((category) => page(`category:${category.slug}`, `/${language}/categories/${category.slug}/`))
    : [];
  const tags = model.tags.map((tag) => page(`tag:${tag.slug}`, `/${language}/tags/${tag.slug}/`));
  return [
    ...sections,
    page('credits', `/${language}/credits/`),
    page('tags', `/${language}/tags/`),
    ...items,
    ...categories,
    ...tags,
  ];
}

/** Every page of the site with the address of each of its translations, for the sitemap. */
export async function sitemapUrls(): Promise<SitemapUrl[]> {
  const languages = await modelLanguages();
  const pages = (await Promise.all(languages.map(async (language) => pagesOf(await readModel(language))))).flat();
  return pages.map((page) => {
    const twins = pages.filter((other) => other.key === page.key);
    const alternates =
      twins.length > 1
        ? Object.fromEntries(twins.map((twin) => [languageInfo(twin.language).locale, absolute(twin.path)]))
        : {};
    return { loc: absolute(page.path), lastmod: page.lastmod, alternates };
  });
}
