# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Musifold ("Internalizing Walks on the Musical Manifold") is a music-theory teaching project built with Quarto. Each note is a single `.qmd` file that renders both as a page of the website on GitHub Pages and as a reveal.js slide deck. It is currently content-only; `code/` and `data/` are empty placeholders.

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
- Each tutorial lives in `docs/tutorials/<topic>/<topic>.qmd`. Its front matter lists two formats: `html` (the site page, `<topic>.html`) and `revealjs` with `output-file: <topic>-slides.html`. Quarto links the slides from the page under "Other Formats". Do not commit rendered HTML.
- Slide boundaries come from headings: `#` makes a section title slide and `##` makes a content slide. A `---` adds a slide break inside a section, and it shows up as a horizontal rule on the web page. Write content so it reads well in both formats; the decks use `scrollable: true` for long slides.
- Math uses `$...$` / `$$...$$`.
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
- Browsers cache the JS/CSS, so after editing them hard-reload the page (or add a `?v=` query) when checking changes.
- `inbox/` holds scratch and reference notes. It is not part of the site. `img-guide.md` there is written for Marp, which the project no longer uses. Its `{style="..."}` image attributes still work in Quarto, but Marp-only syntax such as `![bg ...]` does not.

## DataLad / git-annex

This is a DataLad dataset. Under `.gitattributes`, binary files larger than 0 bytes go to git-annex (MD5E backend), and text files stay in git. Images and other binary assets added under `docs/` will therefore be annexed. Use `datalad save -m "..."` (or `git annex add`) for them, and make sure the content is actually available in CI. The Pages workflow does a plain `actions/checkout` with no annex get, so annexed images will appear as broken symlinks on the site unless that is handled.
