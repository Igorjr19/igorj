import { assertEquals, assertThrows } from '@std/assert';
import { findOverruns, parseBudgets } from '../../../tools/quality/budgets.ts';

const budgets = { html: 100, css: 100, inlineScript: 10, linkedScript: 10, fonts: 1000 };

Deno.test('findOverruns reports only the resources above their budget', () => {
  assertEquals(findOverruns(budgets, { html: 100, css: 101, inlineScript: 0, linkedScript: 10, fonts: 999 }), [
    { key: 'css', limit: 100, actual: 101 },
  ]);
});

Deno.test('parseBudgets requires every budget, so a resource cannot silently go unchecked', () => {
  assertEquals(parseBudgets({ bytes: budgets }), budgets);
  assertThrows(() => parseBudgets({ bytes: { html: 100, css: 100, inlineScript: 10, fonts: 1000 } }));
});
