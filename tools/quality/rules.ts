import type { RiskCategory } from './types.ts';

export interface PathRule {
  readonly category: RiskCategory;
  readonly reason: string;
  readonly patterns: readonly RegExp[];
}

export const PATH_RULES: readonly PathRule[] = [
  {
    category: 'specs',
    reason: 'Acceptance criteria are owned by a human reviewer.',
    patterns: [/^specs\//],
  },
  {
    category: 'quality-gates',
    reason: 'Changing a gate can hide a failure instead of fixing it.',
    patterns: [
      /^biome\.json$/,
      /^lefthook\.yml$/,
      /^\.github\//,
      /^\.htmlvalidate\.json$/,
      /^\.taplo\.toml$/,
      /^\.dependency-cruiser\.json$/,
      /^\.jscpd\.json$/,
      /^codecov\.yml$/,
      /^data\/budgets\.toml$/,
      /^tools\/quality\//,
      /^renovate\.json$/,
    ],
  },
  {
    category: 'dependencies',
    reason: 'New or updated packages and tools need a human check.',
    patterns: [/^deno\.json$/, /^deno\.lock$/, /^mise\.toml$/, /^\.github\/actions\//],
  },
  {
    category: 'external-data',
    reason: 'Changes how data from outside the repository is fetched or validated.',
    patterns: [
      /^tools\/content\//,
      /^tools\/shared\/download\.ts$/,
      /^tools\/cli\/fetch-content\.ts$/,
      /^data\/themes\//,
      /^data\/third-party\.toml$/,
    ],
  },
  {
    category: 'deployment',
    reason: 'Changes how or where the site is built and published.',
    patterns: [/^\.github\/workflows\//, /^hugo\.toml$/],
  },
];

export const TEST_FILE = /^tests\//;
export const PRODUCTION_CODE = /^(tools|assets|layouts|i18n)\//;
/** Generated or vendored files that make the size of a change look bigger than the work in it. */
export const SIZE_EXCLUDED = [/^deno\.lock$/, /^tests\/fixtures\//];
export const MAX_LINES_CHANGED = 400;
