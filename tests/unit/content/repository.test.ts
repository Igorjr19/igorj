import { assertEquals } from '@std/assert';
import { cloneArgs } from '../../../tools/content/repository.ts';

Deno.test('cloneArgs makes a shallow clone of the default branch into the destination', () => {
  const args = cloneArgs({ repo: 'owner/repo', token: 't', destination: 'content' });
  assertEquals(args.slice(0, 3), ['clone', '--depth', '1']);
  assertEquals(args.includes('--branch'), false);
  assertEquals(args.at(-1), 'content');
});
