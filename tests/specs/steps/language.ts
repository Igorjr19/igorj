/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { waitToLeave } from '../../e2e/support/navigation.ts';
import { HOME_PT } from '../../e2e/support/paths.ts';
import { defineStep } from '../support/steps.ts';
import { currentPage, type World } from '../support/world.ts';

const HOME_BY_LANGUAGE = new Map([
  ['Portuguese', '/pt/'],
  ['English', '/en/'],
]);
const SETTLE_MS = 300;

const pathname = (world: World) => new URL(currentPage(world).url).pathname;

export const languageSteps = [
  defineStep<World>(/the browser prefers "([^"]+)"/, (world, language = '') => {
    world.pageOptions = { ...world.pageOptions, acceptLanguage: language };
  }),
  defineStep<World>(/the visitor chose English on a previous visit/, (world) => {
    world.pageOptions = { ...world.pageOptions, savedStorage: { language: 'en' } };
  }),
  defineStep<World>(/a visitor opens the root address/, async (world) => {
    const page = await world.session.open('/', world.pageOptions);
    world.page = page;
    await waitToLeave(page, '/');
  }),
  defineStep<World>(/a visitor opens the Portuguese home page directly/, async (world) => {
    world.page = await world.session.open(HOME_PT, world.pageOptions);
  }),
  defineStep<World>(/they land on the (Portuguese|English) home page/, (world, language = '') => {
    assertEquals(pathname(world), HOME_BY_LANGUAGE.get(language));
  }),
  defineStep<World>(/they stay on the Portuguese home page/, async (world) => {
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    assertEquals(pathname(world), HOME_PT);
  }),
];
