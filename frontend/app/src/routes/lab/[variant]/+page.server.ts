import { LAB } from '#lib/lab/labels.ts';
import { buildHome } from '#lib/server/home.ts';
import { readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => LAB.variants.map(({ key }) => ({ variant: key }));

export const load: PageServerLoad = async ({ params }) => ({
  variant: params.variant,
  system: (await buildHome(await readModel('en'), new Date())).system,
});
