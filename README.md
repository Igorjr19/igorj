# igorj.dev

The personal site of Ígor José Rodrigues, live at **[igorj.dev](https://igorj.dev)**: portfolio, blog, research and CV in a window that looks and behaves like a terminal UI.

Think of a tmux session or btop: a bordered window with a top bar, a side column of numbered panes and a status line, and the content already in the HTML of every page. Moving between panes happens in the same document, without loading a new page.

## What is on the page

The home shows the photo, the name drawn in characters, the role and place, three lines about the author, the latest writing and boxes with live facts: the build, public GitHub activity, listening and films watched. Every project, post and research item opens as a single page, the way tmux zooms into a pane, with the path at the top and a status line at the bottom.

- **Keyboard and mouse.** Single-key shortcuts are always on and stay quiet while you type or hold Ctrl, Alt or Meta; every key has a button. `f` searches, `#` filters the blog, `t` picks a theme with live preview, `:` opens a terminal with `ls`, `cd`, `cat`, `open`, `theme` and more, and `?` lists the keys.
- **Terminal color schemes.** Catppuccin in its four flavors and fourteen accents, following the system's light or dark preference until you pick one. Every theme passes a contrast audit at build time.
- **Images in two-color dithering**, inked with the theme's text color, so the photo and screenshots change color with the theme.
- **Portuguese and English**, at `/pt/` and `/en/`. The root picks one from the saved choice or the browser; a post written in only one language still shows up in the other's list, labeled.
- **Real data only.** Listening comes from Last.fm and films from Letterboxd, as weekly summaries without times or dates; the public contributions come from GitHub and the coding time from CodeTime. No chart or number without a source.
- **Prerendered.** Every page is built ahead of time and navigation happens on the client; performance is a goal, with the time a pane takes to open checked by a test. No cookies; the only analytics are Cloudflare's cookieless ones.
- RSS for the whole blog and for each category and tag, a sitemap with the translations of every page, a printable CV, and a `command not found` 404.

| Key | Action |
|---|---|
| `1`–`9` | Open a pane |
| `j` `k` or arrows | Move between the items of a list |
| `Enter` | Open the selected item |
| `q` | Go back up (post, list, home) |
| `n` / `p` | Next or previous post |
| `v` | List or grid |
| `z` | Hide or show the side column |
| `f` / `#` / `t` | Search / filter the blog / themes |
| `:` | Terminal |
| `?` | Help |

## How it is built

[SvelteKit](https://svelte.dev/docs/kit) prerenders the site with `adapter-static`, and [Deno](https://deno.com) runs everything: the build, the build tools, type checks, unit tests and the [Playwright](https://playwright.dev) tests, in Chromium, Firefox and WebKit. No Node is installed; packages come from npm, pinned in `deno.json`. GitHub Actions checks every change and deploys to Cloudflare Pages.

The content lives in a separate private repository and goes through three layers, each knowing only the one before it:

```text
content repository ──► reader (tools/content) ──► model (tools/model) ──► frontend (frontend/app) ──► igorj.dev
   Markdown, YAML        validates every file       content rules,           SvelteKit pages, CSS,
   and daily data                                   one JSON per language    themes, fonts, pictures
```

The look can be replaced with a new `frontend/<name>/` reading the same model, without touching the content or its rules. The sections below are for working on the code.

## Tooling

[mise](https://mise.jdx.dev) installs the pinned versions of every tool listed in `mise.toml`:

- [Deno](https://deno.com) runs the build, the build tools, type checks and tests, and installs the packages.
- [Biome](https://biomejs.dev) formats and lints TypeScript, CSS, Svelte and JSON.
- [Taplo](https://taplo.tamasfe.dev) formats and checks TOML.
- [Lefthook](https://lefthook.dev) checks formatting and the commit message on commit.
- [actionlint](https://github.com/rhysd/actionlint) checks the GitHub Actions workflow.

```sh
mise install
deno task hooks          # install the git hooks (once)
deno task dev            # Vite dev server with the content in content/
deno task build          # production build into public/
deno task check          # lint, types and unit tests (seconds)
deno task browsers       # install the browsers for the Playwright tests (once)
deno task ci             # everything the CI runs, browser tests included
```

| Task | What it does |
|---|---|
| `lint` | Biome (with the project rules in `tools/quality/biome/`), Taplo, actionlint and `conventions` |
| `conventions` | Rejects references to planning documents in versioned files |
| `audit` | Checks dependencies against known vulnerabilities (weekly in CI) |
| `format` | Applies Biome and Taplo formatting and safe fixes |
| `typecheck` | `deno check` over the tools and the unit tests, and `svelte-check` over the app |
| `test` | Unit tests |
| `check` | `lint`, `typecheck` and `test` |
| `test:app` | Builds the app from `tests/fixtures/content` and runs the Playwright tests (`APP_BROWSERS=chromium` for one browser) |
| `content:verify` | What the content repository runs on its pull requests: the content check, the model and a full build of `content/` into `generated/content-check`, without publishing |
| `model` | Builds the model from `content/` (or the folder given) into `generated/model/` and `generated/media/`; `dev` keeps it current with `model:watch` |
| `app:images` | The pictures: dithered portrait and figures, share images and favicons, into `generated/app-static` |
| `fonts`, `themes`, `licenses` | Generate font faces, theme colors and the third-party notices (all run by `prepare`) |

## Content

Everything the site says lives in a separate private repository: posts, projects, research, CV, the about and now texts, contact links, the author's name and role, the languages and the category names. The build reads `content/`, a local clone of it; `deno task content:fetch` clones it when `CONTENT_REPO` and `CONTENT_TOKEN` are set.

It flows through three layers, each knowing only the one before it:

1. **Reader** (`tools/content/`). `deno task content:check` validates every file of the content folders against the schemas in `tools/content/schema.ts` and the rules across files in `tools/content/consistency.ts`. Those rules: the site, category and about files are required, every post uses a declared category, and unknown keys or misplaced files fail. Anything beside the content folders, such as the content repository's own tools, is never read.
2. **Model** (`tools/model/`). `deno task model` applies the content rules per language and writes `generated/model/<lang>.json`, with the media copied to `generated/media/`. The rules are: which posts each language lists, project and research order, CV fallback, category names, titles and descriptions. Dates stay as written; anything relative to today is left to the frontend.
3. **Frontend** (`frontend/app/`). SvelteKit reads only the model and its media, at build time, and prerenders every page; components display and decide nothing about the content.

Another frontend would read the same model, so the content and its rules do not change with the look.

The music and film summaries come from `external/*.json`, which a daily job in the content repository refreshes with its own tools; the site build never calls an external service. Data a week old or more shows the date it was saved. `deno task build:info` records the commit shown in the system panel.

The content repository validates its pull requests with `deno task content:verify` from this repository. Every build fails on example content (`example: true` or `[EXAMPLE]`); missing text is a visible `[TODO]` instead. To see a content change before it goes live, run `deno task dev` with the change in `content/`.

## Themes and fonts

Each theme is a terminal color scheme: 16 ANSI colors plus background, foreground, cursor and selection. A manifest in `frontend/app/data/themes/` points at the palette published by its authors, pinned by commit and checksum, and maps palette colors to interface roles (`frontend/app/data/theme-defaults.toml` holds the default mapping). The build downloads each palette, audits contrast (4.5:1 for text, 3:1 for focus and borders) and fails below the minimum. Adding a theme means adding a manifest.

Without a saved choice, the theme follows the system light or dark preference. A saved choice is applied before the first paint.

Fonts come from Fontsource packages; `frontend/app/data/fonts.toml` lists families, weights, styles, subsets and the files to preload, and the build generates the `@font-face` rules, copies only those files and writes the preload list the pages read. The monospace font is preloaded because the layout cell is measured with it.

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
| `frontend/app/` | The frontend: SvelteKit prerendered with `adapter-static`, reading `generated/model/` |
| `frontend/app/src/routes/` | The pages: the home, the lists, the item pages, the CV, the shelf, the credits, the feeds, the sitemap |
| `frontend/app/src/lib/` | Components and logic: the window, the keys, the quick-pick box, the terminal, the Markdown renderer, the pane registry (`sections.ts`) |
| `frontend/app/src/styles/` | Styles in cascade layers: `app.tokens`, `app.base`, `app.layout`, `app.components` |
| `frontend/app/tools/` | Build tools of the frontend: the pictures, themes, fonts, licenses and colors; pure functions in their folders and file access in `cli/` |
| `frontend/app/data/` | Theme, font, share, source and third-party manifests |
| `frontend/app/i18n/` | Interface text per language |
| `frontend/app/tests/` | Unit tests (`unit/`) and the Playwright tests against the fixture build |
| `generated/` | Build output (not versioned): `css/` and `data/` read by the app, `app-static/` served as is, `fixture-app/` used by the tests |

## CI and deployment

GitHub Actions runs `deno task ci` in one job and, on `main`, builds with the real content and deploys to Cloudflare Pages with Wrangler. A local composite action (`.github/actions/setup`) installs the pinned tools and caches Deno dependencies. A pull request merges once that check passes; a dependency audit runs weekly. Only `main` is published, to the Cloudflare `production` branch, which serves igorj.dev; there are no preview deployments. The content repository triggers a rebuild with a `content-updated` repository dispatch, and the workflow can also be run by hand.

Required repository settings: secrets `CONTENT_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variables `CONTENT_REPO` and `CLOUDFLARE_PAGES_PROJECT`.

## Third-party material

No third-party files are versioned. Packages are pinned in `deno.json` and `deno.lock`, tools in `mise.toml` and actions by commit; updates are made by hand, and the weekly `deno audit` flags known vulnerabilities. The build publishes every license text at `/third-party-licenses.txt`, listed in `frontend/app/data/third-party.toml`. The pages are built with [Svelte](https://svelte.dev) and [SvelteKit](https://svelte.dev/docs/kit) (MIT). Fonts: [Fira Code](https://github.com/tonsky/FiraCode) and [Fira Sans](https://github.com/mozilla/Fira) (SIL OFL 1.1) via Fontsource. Palettes: Catppuccin (MIT), fetched from [iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) (MIT). Brand icons: [Font Awesome Free](https://fontawesome.com) (CC BY 4.0).

## License

Code under the MIT license (see `LICENSE`). The texts and images published on the site belong to Ígor José Rodrigues, all rights reserved; they live in a separate private repository and are not covered by this license.
