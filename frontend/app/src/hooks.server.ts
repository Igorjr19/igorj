import type { Handle } from '@sveltejs/kit/hooks';
import { languageInfo } from '#lib/languages.ts';

export const handle: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('%lang%', event.params['lang'] ? languageInfo(event.params['lang']).locale : 'en'),
  });
