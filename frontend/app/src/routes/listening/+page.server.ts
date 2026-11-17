import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { PageServerLoad } from './$types';

/** The old address of the shelf leads to it where the edition has one, and to the home where it has not. */
export const load: PageServerLoad = async () => {
  const [language] = await modelLanguages();
  const shelf = language ? (await readModel(language)).sections.shelf : true;
  return { target: shelf ? 'shelf/' : '' };
};
