import type { StepDefinition } from '../support/steps.ts';
import type { World } from '../support/world.ts';
import { blogSteps } from './blog.ts';
import { contentSteps } from './content.ts';
import { languageSteps } from './language.ts';

/** Step definitions for the specifications in specs/. Each feature adds its own module and lists it here. */
export const steps: readonly StepDefinition<World>[] = [...contentSteps, ...blogSteps, ...languageSteps];
