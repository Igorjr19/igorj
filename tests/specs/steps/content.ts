/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { HOME_EN } from '../../e2e/support/paths.ts';
import { type FixturePost, readEnglishPosts } from '../support/fixture-posts.ts';
import { defineStep } from '../support/steps.ts';
import { currentPage, type World } from '../support/world.ts';

async function findEnglishPost(title: string): Promise<FixturePost> {
  const post = (await readEnglishPosts()).find((candidate) => candidate.title === title);
  if (!post) {
    throw new Error(`No fixture post titled "${title}"`);
  }
  return post;
}

/** The visible text of each Markdown line, without markup, skipping code blocks. */
function plainTextLines(markdown: string): string[] {
  let inCode = false;
  return markdown.split('\n').flatMap((line) => {
    if (line.startsWith('```')) {
      inCode = !inCode;
      return [];
    }
    const text = line
      .replace(/^(- |> |#+ )/, '')
      .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replaceAll(/[*`]/g, '')
      .trim();
    return inCode || text === '' ? [] : [text];
  });
}

async function sectionLinks(world: World, section: string): Promise<string[]> {
  return await currentPage(world).evaluate(
    (name: string) => {
      const panel = [...document.querySelectorAll('.panel')].find(
        (candidate) => candidate.querySelector('.panel__name')?.textContent?.trim() === name,
      );
      return panel ? [...panel.querySelectorAll('li a')].map((link) => link.textContent?.trim() ?? '') : [];
    },
    { args: [section] },
  );
}

export const contentSteps = [
  defineStep<World>(/JavaScript is disabled/, (world) => {
    world.pageOptions = { ...world.pageOptions, javascript: false };
  }),
  defineStep<World>(/a visitor opens the English home page/, async (world) => {
    world.page = await world.session.open(HOME_EN, world.pageOptions);
  }),
  defineStep<World>(/a visitor opens the post "([^"]+)"/, async (world, title = '') => {
    const post = await findEnglishPost(title);
    world.post = post.body;
    world.page = await world.session.open(post.path, world.pageOptions);
  }),
  defineStep<World>(/they see the "([^"]+)" section listing "([^"]+)"/, async (world, section = '', item = '') => {
    const links = await sectionLinks(world, section);
    assert(links.includes(item), `"${section}" lists ${JSON.stringify(links)}, not "${item}"`);
  }),
  defineStep<World>(/they see the title "([^"]+)"/, async (world, title = '') => {
    const heading = await currentPage(world).evaluate(() => document.querySelector('h1')?.textContent?.trim());
    assertEquals(heading, title);
  }),
  defineStep<World>(/they see the whole text of the post/, async (world) => {
    const text = await currentPage(world).evaluate(() => document.querySelector('.prose')?.textContent ?? '');
    const normalized = text.replaceAll(/\s+/g, ' ');
    for (const line of plainTextLines(world.post ?? '')) {
      assert(normalized.includes(line), `missing from the page: "${line}"`);
    }
  }),
];
