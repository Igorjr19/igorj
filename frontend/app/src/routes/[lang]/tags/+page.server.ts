import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () => (await modelLanguages()).map((lang) => ({ lang }));

export const load: PageServerLoad = async ({ params }) => ({
  tags: (await readModel(params.lang)).tags.map((tag) => ({ slug: tag.slug, name: tag.name, count: tag.count })),
});
