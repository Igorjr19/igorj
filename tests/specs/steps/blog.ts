/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { POSTS_EN } from '../../e2e/support/paths.ts';
import { readEnglishPosts, readPortugueseOnlyTitles } from '../support/fixture-posts.ts';
import { defineStep } from '../support/steps.ts';
import { currentPage, type World } from '../support/world.ts';

async function listedTitles(world: World): Promise<string[]> {
  return await currentPage(world).evaluate(() =>
    [...document.querySelectorAll('.zoom__body .entries > li > a:first-of-type')].map(
      (link) => link.textContent?.trim() ?? '',
    ),
  );
}

export const blogSteps = [
  defineStep<World>(/a published post in the category "([^"]+)"/, async (world, category = '') => {
    const slug = category.replaceAll(' ', '-');
    const post = (await readEnglishPosts()).find(
      (candidate) => !candidate.draft && candidate.categories.includes(slug),
    );
    assert(post, `No published fixture post in the category "${category}"`);
    world.expectedTitles = [...(world.expectedTitles ?? []), post.title];
  }),
  defineStep<World>(/a post marked as a draft/, async (world) => {
    const draft = (await readEnglishPosts()).find((candidate) => candidate.draft);
    assert(draft, 'No draft among the fixture posts');
    world.draftTitle = draft.title;
  }),
  defineStep<World>(/a visitor opens the blog/, async (world) => {
    world.page = await world.session.open(POSTS_EN, world.pageOptions);
  }),
  defineStep<World>(/both posts are listed/, async (world) => {
    const titles = await listedTitles(world);
    for (const expected of world.expectedTitles ?? []) {
      assert(titles.includes(expected), `The blog lists ${JSON.stringify(titles)}, not "${expected}"`);
    }
  }),
  defineStep<World>(/the draft is not listed/, async (world) => {
    const titles = await listedTitles(world);
    assert(
      world.draftTitle && !titles.includes(world.draftTitle),
      `The blog lists the draft: ${JSON.stringify(titles)}`,
    );
  }),
  defineStep<World>(/a post written only in Portuguese/, async (world) => {
    const [title] = await readPortugueseOnlyTitles();
    assert(title, 'No fixture post exists only in Portuguese');
    world.untranslatedTitle = title;
  }),
  defineStep<World>(/a visitor opens the English blog/, async (world) => {
    world.page = await world.session.open(POSTS_EN, world.pageOptions);
  }),
  defineStep<World>(/the post is listed with a label saying it is in Portuguese/, async (world) => {
    const labels = await currentPage(world).evaluate(
      (title: string) =>
        [...document.querySelectorAll('.zoom__body .entries > li')]
          .filter((row) => row.querySelector('a')?.textContent?.trim() === title)
          .map((row) => row.querySelector('span[lang]')?.textContent?.trim()),
      { args: [world.untranslatedTitle ?? ''] },
    );
    assertEquals(labels, ['Português']);
  }),
];
