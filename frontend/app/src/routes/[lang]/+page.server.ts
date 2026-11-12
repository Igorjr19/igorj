import { modelLanguages } from '#lib/server/model.ts';
import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = async () => (await modelLanguages()).map((lang) => ({ lang }));
