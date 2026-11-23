# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Musifold ("Internalizing Walks on the Musical Manifold") is a music-theory teaching project built with Quarto. Each note is a single `.qmd` file that renders both as a page of the website on GitHub Pages and as a reveal.js slide deck. `code/` and `data/` are empty placeholders.

- Repo: https://github.com/arashshahidi1997/Musifold
- Site: https://arashshahidi1997.github.io/Musifold/

## Commands

```bash
quarto preview docs       # live-reloading local preview
quarto render docs        # full build into docs/_site/ (what CI runs)
quarto render docs/tutorials/fundamentals/fundamentals.qmd   # render one note (page + slides)
```

There are no tests or linters. `docs/_site/` and `.quarto/` are build output and are gitignored.

## Structure and publishing

- The Quarto project root is `docs/`, not the repo root. `docs/_quarto.yml` defines the website: it renders only `**/*.qmd` (so plain `.md` scratch files are not published), writes the site to `docs/_site/`, and lists pages in the sidebar. Add new notes to `website.sidebar.contents` there and link them from `docs/index.qmd`.
- `.github/workflows/gh-pages.yml` runs `quarto render docs` and deploys `docs/_site/` to GitHub Pages on every push to `master`.
- Each tutorial lives in `docs/tutorials/<topic>/<topic>.qmd`. The Guitar Harmony guide is a multi-page tutorial instead (see below). Its front matter lists two formats: `html` (the site page, `<topic>.html`) and `revealjs` with `output-file: <topic>-slides.html`. Quarto links the slides from the page under "Other Formats". Do not commit rendered HTML.
- Slide boundaries come from headings: `#` makes a section title slide and `##` makes a content slide. A `---` adds a slide break inside a section, and it shows up as a horizontal rule on the web page. Write content so it reads well in both formats; the decks use `scrollable: true` for long slides.
- Math uses `$...$` / `$$...$$`.
- `docs/index.qmd` is the home page; its hero and tutorial cards are styled by `docs/assets/home.css` (linked from the page itself, not a shared widget stylesheet). Draft pages are not linked from it.
- Placeholders such as `*(Insert: diagram …)*` and `*(Placeholder for … widget)*` in the notes mark visuals that are still planned.

## Interactive widgets

The figures in the notes are dependency-free JavaScript widgets (SVG + Web Audio) in `docs/assets/`. They are copied to the site through `project.resources` in `_quarto.yml`, and the same code runs on the web page and in the reveal.js deck.

- `musifold.js` is the core. It provides DOM/SVG helpers, music math (`midiToHz`, `cents`, `pcName`), a small additive synth (`tone`, `chord`, `sequence`, `drone`), `animate()`, which runs a frame loop only while the widget is on screen, `stepper()`, and the registry. On DOMContentLoaded it mounts every `.mf-widget[data-widget]` element.
- `widgets/acoustics.js`, `widgets/scales.js` and `widgets/tonnetz.js` each call `Musifold.register(name, (root, opts) => …)`. `opts` holds the element's `data-*` attributes; the Tonnetz, for example, reads `data-mode` = explore | progression | walk.
- To place a widget in a note, use a fenced div with fallback text:
  ```
  ::: {.mf-widget data-widget="beats"}
  [Interactive figure: … It needs JavaScript.]{.mf-noscript}
  :::
  ```
  A note that uses widgets must load the CSS and scripts in its front matter, for **both** `html` and `revealjs` (`include-in-header` / `include-after-body`; see `fundamentals.qmd`). The paths are relative to the rendered page.
- Widgets draw into a fixed `viewBox` (usually 720 wide) that scales to the column width. Keep them roughly 350px tall or less so they fit on a slide. The deck uses `smaller: true` and `scrollable: true`.
- Guitar widgets:
  - `widgets/guitar.js` holds the fretboard engine (`Musifold.guitar.fretboard`): standard tuning, frets 0–15, right-handed, high E on top, with a shared, remembered "low E on top" setting. Widgets draw in `fb.render`, which re-runs on orientation change.
  - `widgets/guitar-chords.js` holds the chord engine: `parseChord` spells chords properly, and `candidates`/`choose` pick E- or A-string barre or shell voicings nearest the previous chord. It also holds the reusable **`progression`** widget. Configure it with `data-chords`/`data-labels`/`data-note`, or with `data-presets="Name = chords | labels | note ; …"`. **A preset note must not contain `;`**: it is the preset separator, and a `;` in a note breaks `data-presets`. A chord token can force a voicing with `@` (e.g. `Am7@x05555`).
  - `widgets/move-graph.js` holds the data and widgets for the move map: `CLUSTERS`, `NODES` (each move: cluster, map position, `lesson` link, signature, idea, `demo` progression), `EDGES`, `PATHS`, `SONGS` (documented progressions with the nodes they use) and `MENTIONS` (songs cited without playback). It registers `move-graph` (the interactive map) and **`songs`**, which a lesson places with `data-moves="id,id"` to show play buttons for the songs on those moves plus text mentions (the fallback text should list the songs). Only moves with a lesson belong on the map; ideas without one are parked (see `PARKED.md`). Song claims must be documented, never invented.
  - Load order: `guitar.js`, then `guitar-chords.js`, then `move-graph.js`.
- Guitar Harmony guide layout (`docs/tutorials/guitar-harmony/`): the hub `map.qmd` (move map, cluster table, diagram key, drills) plus one page and one slide deck for each cluster: `space`, `hold-step`, `fifth-motion`, `symmetry`, `parallel`, each `<cluster>.qmd` with `<cluster>-slides.html`. Lessons link to each other and carry no "Lesson N" numbers. The hub has no deck of its own. All six pages are `draft: true`; they are in the sidebar (Guitar Harmony section) but not in the navbar or `index.qmd`. Publishing means removing `draft: true` and adding those links (the user decides when).
- Drafts use `draft: true` with `draft-mode: unlinked` (set in `_quarto.yml`): they render but aren't in the nav or search, and are still reachable by URL once pushed.
- Browsers cache the JS/CSS, so after editing them hard-reload the page (or add a `?v=` query) when checking changes.
- `inbox/` holds scratch and reference notes. It is not part of the site. `inbox/img-guide.md` is marked Marp-only (see its header); its `{style="..."}` image attributes still work in Quarto, but Marp-only syntax such as `![bg ...]` and the `marp: true` front matter does not.
- `PARKED.md` (repo root) is the single list of ideas that are not started. Park new ideas there instead of starting them (the project follows "always complete, never finished": finish what exists first).

## DataLad / git-annex

This is a DataLad dataset. Under `.gitattributes`, binary files larger than 0 bytes go to git-annex (MD5E backend), and text files stay in git. Images and other binary assets added under `docs/` will therefore be annexed. Use `datalad save -m "..."` (or `git annex add`) for them, and make sure the content is actually available in CI. The Pages workflow does a plain `actions/checkout` with no annex get, so annexed images will appear as broken symlinks on the site unless that is handled.

## Private material

`papers/` (converted book and paper text) and `answers/` (quote-checked claims drawn from them) are **private**: they are gitignored, and must never be committed, copied into `docs/` wholesale or quoted at length on the site. The repo is public. Song examples and their confidence live in `move-graph.js`.

## Manager setup

Work is coordinated by a standing manager session, `musifold-manager`, from the `projio-workflow` plugin (project-manager core, `manager-setup`, `session-wrap`).

- `.claude/manager.yml` is the config: title prefix `musifold-`, the adapter skill `.claude/skills/musifold-manager/`, the handoffs folder, the board path and the units (fundamentals · guitar · core · site · research · meta, each with its paths). Session titles read `musifold-<unit> · <topic>`; keep to your unit's paths.
- `handoffs/` (repo root, outside `docs/`) holds one handoff per finished session: `handoff-<timestamp>-<slug>.md` with `series:` = the unit, `status: open | consumed`, and sections What shipped · Uncommitted / in flight · Parked or broken · Next steps · Kickoff prompt. Template: `templates/handoff.md` of the `projio-workflow:manager-setup` skill.
- At wrap: commit by path, write the handoff, send the manager the three-line report. Never push unless asked: every push to `master` deploys the live site.
- Gitignored locally: the board `.scratch/musifold-manager-board.md`, the copies of the core skills under `.claude/skills/` (`project-manager/`, `manager-setup/`), and `.claude/launch.json` (preview config). `.claude/skills/musifold-manager/` and `manager.yml` are committed.
- Browser checks leave `.playwright-mcp/`; delete it, and stop any local server you started.
