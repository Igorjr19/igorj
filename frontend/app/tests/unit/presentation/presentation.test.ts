import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  PRESENTATION_KEY,
  parsePresentation,
  resolvePresentation,
} from '../../../src/lib/presentation/presentation.ts';

Deno.test('only the two known presentations are read from storage, so a stale or odd value is ignored', () => {
  assertEquals(parsePresentation('scene'), 'scene');
  assertEquals(parsePresentation('simple'), 'simple');
  assertEquals(parsePresentation('on'), null);
  assertEquals(parsePresentation(null), null);
});

Deno.test('where the room cannot be drawn the site is plain, whatever was chosen', () => {
  assertEquals(resolvePresentation({ saved: 'scene', capable: false, automated: false }), 'simple');
});

Deno.test('a choice wins where the room can be drawn, and with none people get the room and automated browsers the plain site', () => {
  assertEquals(resolvePresentation({ saved: 'simple', capable: true, automated: false }), 'simple');
  assertEquals(resolvePresentation({ saved: 'scene', capable: true, automated: true }), 'scene');
  assertEquals(resolvePresentation({ saved: null, capable: true, automated: false }), 'scene');
  assertEquals(resolvePresentation({ saved: null, capable: true, automated: true }), 'simple');
});

Deno.test('the head script of app.html reads the same storage key and sets the same attributes the menu reads', async () => {
  const head = await Deno.readTextFile(new URL('../../../src/app.html', import.meta.url));
  assertStringIncludes(head, `localStorage.getItem('${PRESENTATION_KEY}')`);
  assertStringIncludes(head, 'root.dataset.presentation');
  assertStringIncludes(head, 'root.dataset.sceneCapable');
});
