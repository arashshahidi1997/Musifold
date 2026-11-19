---
name: musifold-manager
description: >
  Musifold's manager: the adapter for the project-manager core. Use when the
  user asks for an overview of Musifold work (tutorial pages such as
  Fundamentals and Guitar Harmony with its move map; the JavaScript widget
  library and audio; the Quarto site and GitHub Pages deploy; research and
  sources such as book excerpts and verified song examples), or opens the
  standing `musifold-manager` session. Loads the core first.
metadata:
  short-description: Musifold adapter for the project-manager core
  tags: [manager, orchestration, adapter]
---

# musifold-manager: the adapter

**Load the core first:** the `project-manager` skill
(`.claude/skills/project-manager/SKILL.md`). This file only fills in what is
specific to Musifold; the core's rules are not repeated here. Machine keys
are in `.claude/manager.yml`. Project conventions (build, widgets, drafts,
git-annex) are in `CLAUDE.md`.

## Names

- Standing manager: `musifold-manager`.
- Work sessions: `musifold-<unit> · <item>`, for example `musifold-guitar · hub + cluster pages`.
  Units are those in `.claude/manager.yml`: fundamentals, guitar, core, site, research, meta.
- Opener: read the handoff named in the kickoff by its path (`handoffs/handoff-…md`), then `CLAUDE.md`.
  Wrap: commit by path, write a handoff in `handoffs/` from the
  `manager-setup` template (series = the unit), and send the core's
  three-line report to `musifold-manager`.
- Working copy: `/home/arash/Documents/music/projects/Musifold` (XPS laptop; the only clone).

## Board

`.scratch/musifold-manager-board.md` (gitignored). Refresh with `round.py board`, open it with
`show_pane(pane="file", path=".scratch/musifold-manager-board.md")`. Other managers in Sync:

- `worklog-manager` · XPS · `local_702219f3-60cf-400e-9fe4-ac05d82de619` (cross-project; report up only to decide / needs / blocked)
- `inf-manager` · XPS · `local_6078ca0c-d5be-469e-9d3e-ca41d867df74` (machine and Python environments; conda is gone, use uv or pixi)
- `viz-manager` · XPS · `local_016ef55d-817d-473f-8332-7cfa57bb26b4` (finished visuals; requests go through the `viz-draft` skill)
- `lit-manager` · XPS · `local_63182342-5810-4f90-82c3-4260dc6979d8` (literature studio)

**Decisions (drill).** Record each answer, dated, in the manager handoff's
"Decisions the user made"; a decision that changes how the project works
(a convention, a push rule) also goes into `CLAUDE.md` through a `musifold-meta`
session. Relay it to the session concerned.

## Units of work and where their state lives

| Unit | State lives in |
|---|---|
| fundamentals | `docs/tutorials/fundamentals/fundamentals.qmd` (published) and its widgets `acoustics.js`, `scales.js`, `tonnetz.js` (the Tonnetz also runs on the home page) |
| guitar | `docs/tutorials/guitar-harmony/` (draft: the 21-lesson `guitar-harmony.qmd`, the move-map hub `map.qmd`), widgets `guitar.js`, `guitar-chords.js`, `move-graph.js` (the map's nodes, edges, paths and songs are data at the top of that file) |
| core | `docs/assets/musifold.js` and `musifold.css`, shared by every widget |
| site | `docs/_quarto.yml`, `docs/index.qmd`, `home.css`, `favicon.svg`, `.github/workflows/gh-pages.yml`; the deploy's state is `gh run list` |
| research | `papers/` (private book and paper excerpts, converted with lab docling on gamma2) and `answers/` (quote-checked claims); both gitignored. `inbox/` is the user's scratch |
| meta | `CLAUDE.md`, `README.md`, `.gitignore`, `.claude/`, `handoffs/` |

Each unit's open work is in its newest open handoff in `handoffs/` (series = unit).

**Incoming.** None: no other project drops notes into this repo, so round step 1 is skipped.

## What belongs to the sessions (the manager never edits)

- Tutorial content (`docs/tutorials/**`), widget code (`docs/assets/**`), site config and home page.
- Anything under `papers/` and `answers/`, and the uncommitted files of any session.

## Collision unit

The unit in `.claude/manager.yml`, by longest path prefix. `core` is shared by
every widget: a session in fundamentals or guitar that needs to change
`musifold.js` or `musifold.css` makes it a core collision, so only one session
holds core at a time.

## Integration (only when the user asks)

1. In a subagent: `quarto render docs` with no warnings or errors; for changed
   widgets, load the pages in the preview (`.claude/launch.json`, config
   `quarto`) and check that every `.mf-widget` mounts with no console errors.
   Browsers cache the JS, so reload with a `?v=` query.
2. Push `master` (this deploys the live site), then confirm the Pages run with
   `gh run list --limit 1` and that the changed pages return 200 on
   https://arashshahidi1997.github.io/Musifold/.

Push: only when the user asks (decided 2026-11-19).

## Musifold-specific round sections

- **Live site:** after any push, report the Pages run result. A draft page
  (`draft: true`, `draft-mode: unlinked`) is reachable by URL once pushed, so
  name any draft content that would go live.
- **Privacy:** `papers/` and `answers/` hold private lab text and must never be
  committed (the repo is public); handoffs and commit messages never quote
  them. Flag any session that stages them.
- **Parked ideas:** new tutorials, moves and features are parked, not started
  (`always-complete`). Today they sit in the `LATER` comment at the end of
  `guitar-harmony.qmd` and the map's `planned` nodes; consolidating them into
  one list is an open meta item.
- **Unverified content:** song examples and claims carry a confidence; a
  claim that couldn't be verified (e.g. *Road Trippin'* and 10ths) is a bug to
  fix before the page is published.

## Not the manager's

- Writing lessons, widgets or research notes: work sessions (reading-heavy
  items go to subagents).
- Finished visuals: the viz studio (`viz-draft` skill, `viz-manager`).
- The machine and Python environments: `inf-manager`.
- Other projects' repos.
