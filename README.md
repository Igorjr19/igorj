# igorj.dev

Personal site of Ígor José Rodrigues: portfolio, blog and CV on a page that behaves like a terminal UI, with bordered panels, keyboard shortcuts and terminal color schemes. Every piece of content is in the HTML; JavaScript only adds shortcuts and theme switching.

Work in progress. The previous site stays at [igorj.dev.br](https://igorj.dev.br) until launch.

## Tooling

[mise](https://mise.jdx.dev) installs the pinned versions of every tool listed in `mise.toml`:

- [Hugo](https://gohugo.io) builds the site.
- [Deno](https://deno.com) runs the build tools, type checks and tests, and installs the CSS and font packages.
- [Biome](https://biomejs.dev) formats and lints TypeScript, CSS and JSON.
- [Taplo](https://taplo.tamasfe.dev) formats and checks TOML.
- [Lefthook](https://lefthook.dev) runs the checks on commit and push.
- [actionlint](https://github.com/rhysd/actionlint) checks the GitHub Actions workflow.
- [gitleaks](https://github.com/gitleaks/gitleaks) looks for committed secrets.

```sh
mise install
deno task hooks          # install the git hooks (once)
deno task dev            # local server at http://localhost:1313 (renders in memory)
deno task build          # production build
deno task ci             # everything the CI runs
```

| Task | What it does |
|---|---|
| `lint` | Biome (with the project rules in `tools/quality/biome/`), Taplo, actionlint and `conventions` |
| `conventions` | Rejects references to planning documents in versioned files |
| `deps` | [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) rules in `.dependency-cruiser.json`: no cycles, no orphans, layer boundaries, stable dependencies |
| `duplication` | [jscpd](https://github.com/kucherenko/jscpd): fails above 3% duplicated lines in TypeScript and CSS |
| `deps:metrics`, `deps:graph` | Afferent and efferent coupling and instability per module, and a Mermaid graph (also in every CI run summary) |
| `secrets` | Scans the whole git history for secrets (staged files on every commit) |
| `audit` | Checks dependencies against known vulnerabilities |
| `risk` | Lists what in the current branch needs human review (specs, gates, dependencies, external data, deployment, tests changed with code, large changes) |
| `format` | Applies Biome and Taplo formatting and safe fixes |
| `typecheck` | `deno check` over tools, tests and browser code |
| `test` | Unit tests |
| `coverage` | Unit tests with coverage, written to `.cache/coverage.lcov`; CI sends it to [Codecov](https://codecov.io), which requires 80% coverage of changed lines (`codecov.yml`) |
| `test:e2e` | Builds the fixture site, validates its HTML and runs browser tests: layout, themes, focus, accessibility with [axe-core](https://github.com/dequelabs/axe-core) (WCAG 2.1 AA in both color schemes), reading with JavaScript disabled, search metadata, size budgets per page from `data/budgets.toml` |
| `specs` | Runs the Gherkin specifications in `specs/` against the fixture site (also part of `test:e2e`) |
| `build:fixtures` | Builds the site from `tests/fixtures/content` into `generated/fixture-site` |
| `validate:html` | Checks the fixture site with [html-validate](https://html-validate.org) (standard, accessibility and document rules) |
| `fonts`, `themes`, `licenses` | Generate font faces, theme colors and the third-party notices (all run by `prepare`) |

## Content

Posts, projects, research and CV live in a separate private repository. The build reads `content/`, a local clone of it; `deno task content:fetch` clones it when `CONTENT_REPO` and `CONTENT_TOKEN` are set.

`deno task content:check` validates every Markdown front matter and YAML file against the schemas in `tools/content/schema.ts`: Hugo's own keys (`title`, `date`, `lastmod`, `draft`, `slug`, `summary`, `categories`) plus the site's fields in English, one category per post, and JSON Resume keys for the CV. Unknown keys and files outside the expected structure fail the check. The build runs it on the real content, and the fixture build on `tests/fixtures/content`.

The production build fails on example content (`example: true` or `[EXAMPLE]`). Set `ALLOW_EXAMPLE_CONTENT=1` for previews.

## Themes and fonts

Each theme is a terminal color scheme: 16 ANSI colors plus background, foreground, cursor and selection. A manifest in `data/themes/` points at the palette published by its authors, pinned by commit and checksum, and maps palette colors to interface roles (`data/theme-defaults.toml` holds the default mapping). The build downloads each palette, audits contrast (4.5:1 for text, 3:1 for focus and borders) and fails below the minimum. Adding a theme means adding a manifest.

Without a saved choice, the theme follows the system light or dark preference. A saved choice is applied before the first paint.

Fonts come from Fontsource packages; `data/fonts.toml` lists families, weights, styles, subsets and the files to preload, and the build generates the `@font-face` rules, copies only those files and writes the preload list read by the templates. The monospace font is preloaded because the layout cell is measured with it.

## Structure

| Path | Contents |
|---|---|
| `assets/css/` | Styles in cascade layers: WebTUI first, then `app.tokens`, `app.base`, `app.layout`, `app.components` |
| `assets/ts/` | Browser TypeScript, bundled by Hugo |
| `layouts/` | Hugo templates and partials |
| `i18n/` | Interface text per language |
| `data/` | Theme, font and third-party manifests |
| `tools/` | Build tools: pure modules by domain, command-line entry points in `tools/cli/` |
| `tests/unit/` | Unit tests, mirroring `tools/` |
| `tests/e2e/` | Browser tests against the fixture site |
| `tests/fixtures/` | Fixture content and the Hugo config that uses it |
| `generated/` | Build output (not versioned): `css/` and `data/` read by Hugo, `static/` served as is, `fixture-site/` used by the tests |

## CI and deployment

GitHub Actions runs lint, type checks and unit tests, then the HTML validation and browser tests, and only then builds with the real content and deploys to Cloudflare Pages with Wrangler. A local composite action (`.github/actions/setup`) installs the pinned tools and caches Deno dependencies. On pull requests a risk report classifies the change; flagged changes wait for approval on the `review` environment, the rest can merge on their own. Pushes to `main` deploy to production; other branches deploy previews. The content repository can trigger a rebuild with a `content-updated` repository dispatch.

Required repository settings: secrets `CONTENT_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variables `CONTENT_REPO`, `CLOUDFLARE_PAGES_PROJECT`, and `ALLOW_EXAMPLE_CONTENT` until the real content is in place.

## Third-party material

No third-party files are versioned. Packages are pinned in `deno.json` and `deno.lock`; [Renovate](https://docs.renovatebot.com) proposes updates to packages, tools and actions. The build publishes every license text at `/third-party-licenses.txt`, listed in `data/third-party.toml`. The interface builds on [WebTUI](https://github.com/webtui/webtui) (MIT) without changes; adjustments live in the site's own layers. Fonts: [Fira Code](https://github.com/tonsky/FiraCode) and [Fira Sans](https://github.com/mozilla/Fira) (SIL OFL 1.1) via Fontsource. Palettes: [Catppuccin](https://catppuccin.com) (MIT), fetched from [iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) (MIT).

## License

Code under the MIT license (see `LICENSE`).
