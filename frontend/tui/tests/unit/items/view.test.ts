import { assertEquals } from '@std/assert';
import { otherView, readView, saveView, VIEW_STORAGE_KEY } from '../../../assets/ts/items/view.ts';

const memory = (value: string | null) => ({ getItem: () => value });

Deno.test('readView starts with the list, so a first visit sees the rows and the preview', () => {
  assertEquals(readView(memory(null)), 'list');
  assertEquals(readView(memory('something else')), 'list');
});

Deno.test('readView keeps the grid when the visitor chose it before', () => {
  assertEquals(readView(memory('grid')), 'grid');
});

Deno.test('otherView swaps between the two views, so one key toggles them', () => {
  assertEquals(otherView('list'), 'grid');
  assertEquals(otherView('grid'), 'list');
});

Deno.test('saveView writes the choice under its own key', () => {
  const saved: Record<string, string> = {};
  saveView(
    {
      setItem: (key, value) => {
        saved[key] = value;
      },
    },
    'grid',
  );
  assertEquals(saved, { [VIEW_STORAGE_KEY]: 'grid' });
});
