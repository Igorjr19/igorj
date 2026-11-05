import type { Page } from '@astral/astral';

export interface AxeViolation {
  readonly id: string;
  readonly impact: string | null;
  readonly help: string;
  readonly targets: readonly string[];
}

const AXE_SOURCE = await Deno.readTextFile('node_modules/axe-core/axe.min.js');
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Runs axe-core inside the page against WCAG 2.1 A and AA. */
export async function findAccessibilityViolations(page: Page): Promise<AxeViolation[]> {
  await page.evaluate(AXE_SOURCE);
  return await page.evaluate(
    async (tags: string[]) => {
      const { axe } = globalThis as typeof globalThis & {
        axe: {
          run: (
            context: Document,
            options: object,
          ) => Promise<{
            violations: { id: string; impact: string | null; help: string; nodes: { target: string[] }[] }[];
          }>;
        };
      };
      const { violations } = await axe.run(document, { runOnly: { type: 'tag', values: tags } });
      return violations.map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        targets: nodes.flatMap((node) => node.target),
      }));
    },
    { args: [WCAG_TAGS] },
  );
}
