import { assertStringIncludes } from '@std/assert';
import { MONITOR_QUERY } from '../../../src/lib/monitor/query.ts';

Deno.test('the head script and the stylesheet ask for the monitor with the same query as the code, since they run before it', async () => {
  const head = await Deno.readTextFile(new URL('../../../src/app.html', import.meta.url));
  const css = await Deno.readTextFile(new URL('../../../src/styles/layout/monitor.css', import.meta.url));
  assertStringIncludes(head, `matchMedia('${MONITOR_QUERY}')`);
  assertStringIncludes(css, `@media ${MONITOR_QUERY}`);
});
