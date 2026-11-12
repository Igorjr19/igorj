import { readCredits } from '#lib/server/credits.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () => (await modelLanguages()).map((lang) => ({ lang }));

export const load: PageServerLoad = async ({ params }) => {
  const model = await readModel(params.lang);
  const credits = await readCredits();
  return {
    material: credits.material,
    // A service is credited only when the model has its data.
    sources: credits.sources.filter((source) => (model as unknown as Record<string, unknown>)[source.model]),
  };
};
