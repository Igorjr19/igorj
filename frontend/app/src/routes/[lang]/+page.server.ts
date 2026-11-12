import { buildHome } from '#lib/server/home.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () => (await modelLanguages()).map((lang) => ({ lang }));

export const load: PageServerLoad = async ({ params }) => ({
  home: await buildHome(await readModel(params.lang), new Date()),
});
