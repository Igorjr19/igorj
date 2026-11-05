import { assertEquals } from '@std/assert';
import { choiceToSaved, savedToChoice } from '../../../assets/ts/theme/choice.ts';

Deno.test('a family choice follows the system while a theme choice stays put', () => {
  assertEquals(choiceToSaved('family:one'), { family: 'one' });
  assertEquals(choiceToSaved('theme:one-dark'), { theme: 'one-dark' });
});

Deno.test('a value the picker never offers saves nothing', () => {
  assertEquals(choiceToSaved('whatever'), null);
  assertEquals(choiceToSaved(''), null);
});

Deno.test('the radio to show is the explicit theme, else the saved family, else the default family', () => {
  assertEquals(savedToChoice({ theme: 'one-dark', family: 'one' }, 'catppuccin'), 'theme:one-dark');
  assertEquals(savedToChoice({ family: 'one' }, 'catppuccin'), 'family:one');
  assertEquals(savedToChoice(null, 'catppuccin'), 'family:catppuccin');
});
