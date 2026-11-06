import type { Page } from '@astral/astral';

export interface AxeViolation {
  readonly id: string;
  readonly impact: string | null;
  readonly help: string;
  readonly targets: readonly string[];
}

const AXE_SOURCE = await Deno.readTextFile('node_modules/axe-core/axe.min.js');
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Waits for the page to stop moving: a dialog fading in would be read half transparent. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
  });
}

/** Runs axe-core inside the page against WCAG 2.1 A and AA, once nothing is moving. */
export async function findAccessibilityViolations(page: Page): Promise<AxeViolation[]> {
  await settle(page);
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
