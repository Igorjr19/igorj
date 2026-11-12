import type { PostModel, SiteModel } from '../../../../../tools/model/types.ts';
import { type Feed, renderFeed } from '../feed.ts';
import { languageInfo } from '../languages.ts';
import { itemHref } from '../routes.ts';
import { readDictionary } from './i18n.ts';
import { absolute } from './site.ts';

/** The feed of the posts written in the model's language that pass the filter; a title says whose feed it is. */
export async function feedOf(
  model: SiteModel,
  path: string,
  select: (post: PostModel) => boolean,
  label?: string,
): Promise<string> {
  const author = model.profile?.author ?? '';
  const description = (await readDictionary(model.language))['feedDescription'];
  const feed: Feed = {
    title: label ? `${author} — ${label}` : author,
    link: absolute(`/${model.language}/${path}`),
    self: absolute(`/${model.language}/${path}index.xml`),
    description: typeof description === 'string' ? description : 'Posts',
    locale: languageInfo(model.language).locale,
    items: model.posts
      .filter((post) => post.language === model.language && select(post))
      .map((post) => ({
        title: post.title,
        link: absolute(itemHref('posts', post)),
        date: post.date,
        summary: post.summary,
        categories: [post.category.name],
      })),
  };
  return renderFeed(feed);
}

export const XML_HEADERS = { 'Content-Type': 'application/xml; charset=utf-8' };
