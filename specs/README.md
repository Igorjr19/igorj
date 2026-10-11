# Specifications

Acceptance criteria in [Gherkin](https://cucumber.io/docs/gherkin/reference/), one `.feature` file per behavior.
They are written or approved by the site owner; code changes make them pass, never the other way around.

- Step definitions live in `tests/specs/steps/`.
- Scenarios tagged `@wip` describe agreed behavior that is not built yet and are reported as ignored.
- `deno task specs` runs them against the fixture site; `deno task test:e2e` includes them.
