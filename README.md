# igorj.dev

Personal site of Ígor José Rodrigues: portfolio, blog and CV on a page that behaves like a terminal UI, with bordered panels, keyboard shortcuts and terminal color schemes. Every piece of content is in the HTML; JavaScript only adds shortcuts and theme switching.

Work in progress. The previous site stays at [igorj.dev.br](https://igorj.dev.br) until launch.

## Tooling

[mise](https://mise.jdx.dev) installs the pinned versions of every tool listed in `mise.toml`:

- [Hugo](https://gohugo.io) builds the site.
- [Deno](https://deno.com) runs the build tools, type checks and tests, and installs the CSS and font packages.
- [Biome](https://biomejs.dev) formats and lints TypeScript, CSS and JSON.
- [Taplo](https://taplo.tamasfe.dev) formats and checks TOML.
- [Lefthook](https://lefthook.dev) checks formatting and the commit message on commit.
- [actionlint](https://github.com/rhysd/actionlint) checks the GitHub Actions workflow.

```sh
mise install
deno task hooks          # install the git hooks (once)
deno task dev            # local server at http://localhost:1313 (renders in memory)
deno task build          # production build
deno task check          # lint, types and unit tests (seconds)
deno task ci             # everything the CI runs, browser tests included
```

| Task | What it does |
|---|---|
| `lint` | Biome (with the project rules in `tools/quality/biome/`), Taplo, actionlint and `conventions` |
| `conventions` | Rejects references to planning documents in versioned files |
| `audit` | Checks dependencies against known vulnerabilities (weekly in CI) |
| `format` | Applies Biome and Taplo formatting and safe fixes |
| `typecheck` | `deno check` over tools, tests and browser code |
| `test` | Unit tests |
| `check` | `lint`, `typecheck` and `test` |
| `test:e2e` | Builds the fixture site, validates its HTML and runs browser tests: layout, themes, focus, accessibility with [axe-core](https://github.com/dequelabs/axe-core) (WCAG 2.1 AA in both color schemes), reading with JavaScript disabled, search metadata, size budgets per page from `frontend/tui/data/budgets.toml` |
| `content:verify` | What the content repository runs on its pull requests: the content check, the model and a full build of `content/` into `generated/content-check`, without publishing |
| `model` | Builds the model from `content/` (or the folder given) into `generated/model/` and `generated/media/`; `dev` keeps it current with `model:watch` |
| `build:fixtures` | Builds the site from `tests/fixtures/content` into `generated/fixture-site` |
| `validate:html` | Checks the fixture site with [html-validate](https://html-validate.org) (standard, accessibility and document rules) |
| `fonts`, `themes`, `licenses` | Generate font faces, theme colors and the third-party notices (all run by `prepare`) |

## Content

Everything the site says lives in a separate private repository: posts, projects, research, CV, the about and now texts, contact links, the author's name and role, the languages and the category names. The build reads `content/`, a local clone of it; `deno task content:fetch` clones it when `CONTENT_REPO` and `CONTENT_TOKEN` are set.

It flows through three layers, each knowing only the one before it:

1. **Reader** (`tools/content/`). `deno task content:check` validates every file of the content folders against the schemas in `tools/content/schema.ts` and the rules across files in `tools/content/consistency.ts`. Those rules: the site, category and about files are required, every post uses a declared category, and unknown keys or misplaced files fail. Anything beside the content folders, such as the content repository's own tools, is never read.
2. **Model** (`tools/model/`). `deno task model` applies the content rules per language and writes `generated/model/<lang>.json`, with the media copied to `generated/media/`. The rules are: which posts each language lists, project and research order, CV fallback, category names, titles and descriptions. Dates stay as written; anything relative to today is left to the frontend.
3. **Frontend** (`frontend/tui/`). Hugo reads only the model and its media. Content adapters build the post, project and research pages from it; templates display and decide nothing about the content.

A new frontend would read the same model, so the content and its rules do not change with the look.

The music and film summaries come from `external/*.json`, which a daily job in the content repository refreshes with its own tools; the site build never calls an external service. Data a week old or more shows the date it was saved. `deno task build:info` records the commit shown in the system panel.

The content repository validates its pull requests with `deno task content:verify` from this repository. The production build fails on example content (`example: true` or `[EXAMPLE]`); previews may hold it.

## Themes and fonts

Each theme is a terminal color scheme: 16 ANSI colors plus background, foreground, cursor and selection. A manifest in `frontend/tui/data/themes/` points at the palette published by its authors, pinned by commit and checksum, and maps palette colors to interface roles (`frontend/tui/data/theme-defaults.toml` holds the default mapping). The build downloads each palette, audits contrast (4.5:1 for text, 3:1 for focus and borders) and fails below the minimum. Adding a theme means adding a manifest.

Without a saved choice, the theme follows the system light or dark preference. A saved choice is applied before the first paint.

Fonts come from Fontsource packages; `frontend/tui/data/fonts.toml` lists families, weights, styles, subsets and the files to preload, and the build generates the `@font-face` rules, copies only those files and writes the preload list read by the templates. The monospace font is preloaded because the layout cell is measured with it.

## Structure

The repository reads the content, applies its rules and hands the result to a frontend. The frontend is the only part that knows about the look; it can be replaced without touching the rest.

| Path | Contents |
|---|---|
| `tools/content/` | Reads and validates the content repository; the only code that knows its folders and files |
| `tools/model/` | The content rules, applied per language: which posts each language lists, project and research order, CV fallback, category names, page titles. `deno task model` writes `generated/model/<lang>.json` and copies the media to `generated/media/`; the frontend reads only these |
| `tools/cli/` | Command-line entry points for the content, model, git and convention checks |
| `tools/shared/` | Helpers shared by every part (downloads, files, hashes) |
| `tests/unit/` | Unit tests for `tools/`, mirroring its paths |
| `tests/fixtures/content/` | Fixture content in the content repository format |
| `frontend/tui/` | The terminal-style frontend: everything below is specific to it |
| `frontend/tui/hugo.toml` | Hugo configuration; Hugo runs from the repository root with `--config frontend/tui/hugo.toml` |
| `frontend/tui/layouts/`, `pages/`, `static/` | Hugo templates, partials and the frontend's own pages (CV, credits) |
| `frontend/tui/adapters/` | Hugo content adapters that build the post, project and research pages from the model, each in its own language, with its media attached |
| `frontend/tui/assets/css/` | Styles in cascade layers: WebTUI first, then `app.tokens`, `app.base`, `app.layout`, `app.components` |
| `frontend/tui/assets/ts/` | Browser TypeScript, bundled by Hugo |
| `frontend/tui/i18n/` | Interface text per language |
| `frontend/tui/data/` | Theme, font, third-party and size budget manifests |
| `frontend/tui/tools/` | Build tools of this frontend: themes, fonts, licenses, colors, budgets |
| `frontend/tui/tests/` | Its unit tests, browser tests against the fixture site, and the fixture Hugo config |
| `generated/` | Build output (not versioned): `css/` and `data/` read by Hugo, `static/` served as is, `fixture-site/` used by the tests |

## CI and deployment

GitHub Actions runs `deno task ci` in one job and, on `main`, builds with the real content and deploys to Cloudflare Pages with Wrangler. A local composite action (`.github/actions/setup`) installs the pinned tools and caches Deno dependencies. A pull request merges once that check passes; a dependency audit runs weekly. Pushes to `main` deploy to the Cloudflare `production` branch, which serves igorj.dev, and never allow example content; other branches deploy previews. Running the workflow by hand with another `content_ref` builds that content branch into a preview named after it, which accepts example content (for instance `example`, which fills every section with placeholder text). The content repository can trigger a rebuild with a `content-updated` repository dispatch.

Required repository settings: secrets `CONTENT_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variables `CONTENT_REPO` and `CLOUDFLARE_PAGES_PROJECT`.

## Third-party material

No third-party files are versioned. Packages are pinned in `deno.json` and `deno.lock`; [Renovate](https://docs.renovatebot.com) proposes updates to packages, tools and actions. The build publishes every license text at `/third-party-licenses.txt`, listed in `frontend/tui/data/third-party.toml`. The interface builds on [WebTUI](https://github.com/webtui/webtui) (MIT) without changes; adjustments live in the site's own layers. Fonts: [Fira Code](https://github.com/tonsky/FiraCode) and [Fira Sans](https://github.com/mozilla/Fira) (SIL OFL 1.1) via Fontsource. Palettes: [Catppuccin](https://catppuccin.com) (MIT), fetched from [iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) (MIT).

## License

Code under the MIT license (see `LICENSE`). The texts and images published on the site belong to Ígor José Rodrigues, all rights reserved; they live in a separate private repository and are not covered by this license.
