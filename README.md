# igorj.dev

The personal site of Ígor José Rodrigues, live at **[igorj.dev](https://igorj.dev)**: portfolio, blog, research and CV on one page that looks and behaves like a terminal UI.

Think of a tmux session or btop: a grid of bordered panels, each with a title and a shortcut number, all of them already filled when the page loads. Nothing to boot, no commands to learn, no fake typing. It is a regular website that reads well on a phone, in a screen reader and with JavaScript turned off; the keyboard and the themes are a layer on top.

## What is on the page

The home shows eight panels at once: about, now, projects, writing, reading, listening, watched and system. The professional ones are larger and on top; music, films and reading are smaller summaries underneath. Every project, post and research item opens as a single full-screen panel, the way tmux zooms into a pane, with the path at the top and a status line at the bottom (file, language, reading time, how much is read).

- **Keyboard first, never keyboard only.** `Tab` works as in any page; single-key shortcuts are an alternative, can be turned off, and stay quiet while you type.
- **Terminal color schemes.** Catppuccin in its four flavors and fourteen accents, following the system's light or dark preference until you pick one with `t`. Every theme passes a contrast audit at build time.
- **Images in two-color dithering**, inked with the theme's text color, so the photo and screenshots change color with the theme.
- **Portuguese and English**, at `/pt/` and `/en/`. The root picks one from the browser; a post written in only one language still shows up in the other's list, labeled.
- **Real data only.** Listening comes from Last.fm and films from Letterboxd, as weekly summaries without times or dates; the public contributions come from GitHub and the coding time from CodeTime. No chart or number without a source.
- **Static and light.** HTML built ahead of time, no framework, a few kilobytes of TypeScript, size budgets checked on every page. No cookies; the only analytics are Cloudflare's cookieless ones.
- RSS for the whole blog and for each category, a printable CV, and a `command not found` 404.

| Key | Action |
|---|---|
| `1`–`8` | Jump to a panel on the home |
| `j` `k` or arrows | Move between the items of a panel |
| `Enter` | Open the selected item |
| `q` | Go back up (post, list, home) |
| `n` / `p` | Next or previous post |
| `t` | Theme picker with live preview |
| `?` | Help, and the switch to turn shortcuts off |

## How it is built

[Hugo](https://gohugo.io) builds the pages and [Deno](https://deno.com) runs everything else: build tools, type checks, unit and browser tests. The interface starts from [WebTUI](https://github.com/webtui/webtui) with the site's own CSS layers on top. GitHub Actions checks every change and deploys to Cloudflare Pages.

The content lives in a separate private repository and goes through three layers, each knowing only the one before it:

```text
content repository ──► reader (tools/content) ──► model (tools/model) ──► frontend (frontend/tui) ──► igorj.dev
   Markdown, YAML        validates every file       content rules,           Hugo templates, CSS,
   and daily data                                   one JSON per language    themes and fonts
```

The look can be replaced with a new `frontend/<name>/` reading the same model, without touching the content or its rules. The sections below are for working on the code.

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

The content repository validates its pull requests with `deno task content:verify` from this repository. Every build fails on example content (`example: true` or `[EXAMPLE]`); missing text is a visible `[TODO]` instead. To see a content change before it goes live, run `deno task dev` with the change in `content/`.

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

GitHub Actions runs `deno task ci` in one job and, on `main`, builds with the real content and deploys to Cloudflare Pages with Wrangler. A local composite action (`.github/actions/setup`) installs the pinned tools and caches Deno dependencies. A pull request merges once that check passes; a dependency audit runs weekly. Only `main` is published, to the Cloudflare `production` branch, which serves igorj.dev; there are no preview deployments. The content repository triggers a rebuild with a `content-updated` repository dispatch, and the workflow can also be run by hand.

Required repository settings: secrets `CONTENT_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variables `CONTENT_REPO` and `CLOUDFLARE_PAGES_PROJECT`.

## Third-party material

No third-party files are versioned. Packages are pinned in `deno.json` and `deno.lock`, tools in `mise.toml` and actions by commit; updates are made by hand, and the weekly `deno audit` flags known vulnerabilities. The build publishes every license text at `/third-party-licenses.txt`, listed in `frontend/tui/data/third-party.toml`. The interface builds on [WebTUI](https://github.com/webtui/webtui) (MIT) without changes; adjustments live in the site's own layers. Fonts: [Fira Code](https://github.com/tonsky/FiraCode) and [Fira Sans](https://github.com/mozilla/Fira) (SIL OFL 1.1) via Fontsource. Palettes: Catppuccin (MIT), fetched from [iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) (MIT). Brand icons: [Font Awesome Free](https://fontawesome.com) (CC BY 4.0).

## License

Code under the MIT license (see `LICENSE`). The texts and images published on the site belong to Ígor José Rodrigues, all rights reserved; they live in a separate private repository and are not covered by this license.
