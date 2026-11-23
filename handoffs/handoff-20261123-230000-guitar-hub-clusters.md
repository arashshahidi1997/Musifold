---
title: "guitar · hub + cluster pages"
date: 2026-11-23
timestamp: 20261123-230000
series: "guitar"
status: open
git_commit: "917e39b"
refs: ["handoff-20261119-020800-manager-setup.md"]
---

**How to resume (one paste):** the kickoff prompt at the end.

## What shipped
- `917e39b` (not pushed): the guitar guide is one structure. Hub `map.qmd` (move map, cluster table, diagram key, drills, parked ideas) plus a page and a deck for each cluster: `space`, `hold-step`, `fifth-motion`, `symmetry`, `parallel` (all `draft: true`). The old `guitar-harmony.qmd` is replaced; its 21 lessons are split across the clusters, cross-references are now links, "Lesson N" numbering is gone. Borrowed chords (Lesson 17) is split into *Borrowed iv* (hold-step) and *♭VII and ♭VI* (parallel).
- New short lessons: Neighbour triads, Third substitution, Pop axis loop (in `hold-step`).
- Songs are in the lessons through a new `songs` widget in `move-graph.js` (`data-moves="id,id"`: play buttons plus text mentions); fallback text lists the songs.
- Planned nodes (Common-tone °7, Modal swaps, Backdoor) are off the map and parked in comments in `move-graph.js` and `map.qmd`; the "planned" legend and styling are removed.
- *Road Trippin'* kept for 10ths and marked confirmed (user, 2026-11-19) in `move-graph.js` (mention under `octaves`) and in Lesson Interval shapes; no "unverified" wording remains.
- Sidebar in `docs/_quarto.yml`: section Guitar Harmony with the six pages. Prototype (`move-graph.js`, `map.qmd`, card styles in `musifold.css`) committed.
- Verification: `quarto render docs` clean (no warnings). In the browser (local server): the hub, 5 pages and 5 decks mount all widgets with no console errors (only Quarto's reveal "apple-mobile-web-app-capable" deprecation notice, not ours). Clicked a map node and a song, played a lesson song: fine. Found and fixed one bug on the way: a `;` in a preset note breaks `data-presets`.

## Uncommitted / in flight
- Nothing of mine. `.playwright-mcp/` (browser scratch) deleted; the http.server I started is stopped.

## Parked or broken
- Not done: listening through widgets (sound untested), the move map on a phone (800-wide SVG), the decks on a phone; the slide decks were only checked for mounting, not read slide by slide for overflow.
- The hub has no deck of its own (map only as page). `docs/index.qmd` does not link the guitar guide (it is draft).
- Open small bugs from the manager handoff, untouched: symmetric-chord widget enharmonic spelling, Neapolitan in root position vs N6 text, Fundamentals scroll.
- Lesson text still has the callout "Your notes, checked" (Lesson ii–V–I), written for the author; rewrite or drop before publishing.
- CLAUDE.md (meta) still describes `guitar-harmony.qmd`, not the hub/cluster layout, the `songs` widget or `move-graph.js`.
- Songs: no documented song for Neighbour triads or Third substitution (none invented).

## Next steps
1. Listen through every widget; check the map and decks on a phone (read each deck for overflow).
2. Read the three new lessons for correctness against the book (Tymoczko ch. 3).
3. meta: update CLAUDE.md for the new structure.
4. When ready to publish: remove `draft: true`, add navbar and index links (user decision).

## Kickoff prompt
```text
Title this session `musifold-guitar`. Read handoffs/handoff-20261123-230000-guitar-hub-clusters.md by its path, then CLAUDE.md, and follow always-complete. Unit: guitar. Continue from its Next steps; commit by path; do not push.
```
