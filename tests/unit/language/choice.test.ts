import { assertEquals } from '@std/assert';
import { chooseLanguage, siteLanguageOf } from '../../../assets/ts/language/choice.ts';

Deno.test('Portuguese in any regional form leads to Portuguese and every other language to English', () => {
  assertEquals(chooseLanguage(null, ['pt-BR']), 'pt');
  assertEquals(chooseLanguage(null, ['pt']), 'pt');
  assertEquals(chooseLanguage(null, ['en-US']), 'en');
  assertEquals(chooseLanguage(null, ['de']), 'en');
  assertEquals(chooseLanguage(null, []), 'en');
});

Deno.test('the first preference the site is written in wins, so a German reader who also reads Portuguese gets it', () => {
  assertEquals(chooseLanguage(null, ['de', 'pt-PT', 'en']), 'pt');
  assertEquals(chooseLanguage(null, ['en-GB', 'pt']), 'en');
});

Deno.test('a language chosen earlier beats the browser, and a value that is not a site language is ignored', () => {
  assertEquals(chooseLanguage('en', ['pt-BR']), 'en');
  assertEquals(chooseLanguage('pt-BR', ['en-US']), 'pt');
  assertEquals(chooseLanguage('klingon', ['pt-BR']), 'pt');
  assertEquals(chooseLanguage('', ['de']), 'en');
});

Deno.test('siteLanguageOf matches by primary subtag, ignoring case', () => {
  assertEquals(siteLanguageOf('PT-br'), 'pt');
  assertEquals(siteLanguageOf('ptx'), null);
  assertEquals(siteLanguageOf(null), null);
});
