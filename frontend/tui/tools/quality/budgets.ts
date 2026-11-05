import * as v from '@valibot/valibot';

export const BUDGET_KEYS = ['html', 'css', 'inlineScript', 'linkedScript', 'fonts'] as const;
export type BudgetKey = (typeof BUDGET_KEYS)[number];
export type Budgets = Readonly<Record<BudgetKey, number>>;
export type Measurements = Readonly<Record<BudgetKey, number>>;

export interface BudgetOverrun {
  readonly key: BudgetKey;
  readonly limit: number;
  readonly actual: number;
}

const BudgetsSchema = v.strictObject({
  bytes: v.strictObject(
    Object.fromEntries(BUDGET_KEYS.map((key) => [key, v.pipe(v.number(), v.integer(), v.minValue(1))])),
  ),
});

export function parseBudgets(input: unknown): Budgets {
  const result = v.safeParse(BudgetsSchema, input);
  if (!result.success) {
    throw new Error(`Budgets:\n${v.summarize(result.issues)}`);
  }
  return result.output.bytes as Budgets;
}

export function findOverruns(budgets: Budgets, measured: Measurements): BudgetOverrun[] {
  return BUDGET_KEYS.filter((key) => measured[key] > budgets[key]).map((key) => ({
    key,
    limit: budgets[key],
    actual: measured[key],
  }));
}
