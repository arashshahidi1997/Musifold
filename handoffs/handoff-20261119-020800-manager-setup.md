---
title: "musifold-manager setup"
date: 2026-11-19
timestamp: 20261119-020800
series: "manager"
status: open
git_commit: "c34eb16"
refs: []
---

**How to resume (one paste):** the kickoff snippet at the end.

## What finished
- Manager set up (generic layout): config `.claude/manager.yml`, adapter skill `.claude/skills/musifold-manager/`, core copied into `.claude/skills/` (gitignored copies), board `.scratch/musifold-manager-board.md` (gitignored), handoffs folder `handoffs/`.
- Before the setup, in the same session: Quarto migration, Fundamentals widgets, the draft Guitar Harmony guide (21 lessons), home page polish and the Tonnetz spelling fix (`dd23ee5`, not pushed), and the Guitar Harmony move-map prototype (uncommitted: `docs/assets/widgets/move-graph.js`, `docs/tutorials/guitar-harmony/map.qmd`, card styles appended to `docs/assets/musifold.css`).

## Decisions the user made (don't re-ask)
- 2026-11-19: prefix `musifold-`; the manager tracks tutorial pages, widgets and engine, site and deploy, research and sources.
- 2026-11-19: working copy `/home/arash/Documents/music/projects/Musifold` (the only clone).
- 2026-11-19: push only when the user asks. Every push to master deploys the live site.
- 2026-11-19: units fundamentals · guitar · core · site · research · meta, as in `.claude/manager.yml`; handoffs at the repo root (`handoffs/`), outside the website source.
- 2026-11-18: guitar guide structure = a hub page with the interactive move map plus one page and one slide deck per cluster (Space, Hold & step, Fifth motion, Symmetry moves, Parallel slides). Song examples get progression playback with the project's synth.
- 2026-11-18: fretboards draw high E at the top by default (shared "low E on top" setting), frets 0–15, right-handed only; simple plucked sound for now (strummed audio parked).
- 2026-11-18: work follows `always-complete`: complete existing things before adding new ones; new ideas are parked.

## Open, for the next manager
Completion first, in this order (from the completeness check on 2026-11-19):
1. Push decision for `dd23ee5` (on the board).
2. guitar: Lesson 2 of `guitar-harmony.qmd` cites *Road Trippin'* for 10ths; research could not confirm it. Confirm from a transcription or remove the reference.
3. guitar: make the guide one structure: hub (`map.qmd` + move map) and five cluster pages from the existing lessons; put each lesson's songs into the lessons; give *Neighbour triads*, *Third substitution* and *Pop axis loop* a short lesson or take them off the map; keep `planned` nodes off the published map. Then commit the prototype with it.
4. Untested paths: listen through every widget (sound was only checked in code), the move map on a phone (800-wide SVG), the guitar slide decks.
5. Small bugs: symmetric-chord widget spells some notes enharmonically (A♭→A for G♯→A); Lesson 12 plays the Neapolitan in root position while the text says N6; some Fundamentals slides need a scroll to reach their controls.
6. meta: CLAUDE.md lacks the move graph, `map.qmd`, `home.css`, the manager setup and the private `papers/`/`answers/` rule; `inbox/img-guide.md` is Marp-only; collect parked ideas (the `LATER` comment in `guitar-harmony.qmd`, the map's planned nodes) into one list.
7. site: CI warns about Node 20 actions (bump versions); CI does not fetch git-annex content (harmless until the first binary image).
- Research: Tymoczko, *A Geometry of Music*, ch. 1, §2.10–ch. 3 and ch. 10 are converted in `papers/` with quote-checked claims in `answers/tymoczko_2011-guitar-organization.md` (both private, gitignored). Song examples and their confidence are in `move-graph.js`.

## Kickoff snippet
```text
Title this session `musifold-manager`. Read the handoff handoffs/handoff-20261119-020800-manager-setup.md by its path, then load the musifold-manager skill (it loads the project-manager core) and run a round. Stay open as observer and dispatcher; decisions to me through AskUserQuestion; commit by path; push only when I ask.
```
