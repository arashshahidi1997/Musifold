---
title: "guitar · widget bugs + listen-through"
date: 2026-11-24
timestamp: 20261124-120000
series: "guitar"
status: open
git_commit: "eed3240"
refs: ["handoff-20261123-230000-guitar-hub-clusters.md"]
---

**How to resume (one paste):** the kickoff prompt at the end.

## What shipped
- Symmetric-chord widget (`guitar-chords.js`): on resolving, the °7 is respelled as vii°7 of the target and the aug as V+, so it shows G♯ → A (not A♭ → A). Checked in headless Chrome: C, A, E♭, F♯ for °7; C, E, A♭ for aug (E: F𝄪 → G♯ is correct spelling).
- Neapolitan: the `fifth-motion.qmd` preset and the map node demo (`move-graph.js`) now play `D♭/F@x8666x` (F in the bass, N6); the label reads ♭II6. Checked: fretboard dots show × 3 5 R 3 ×.
- Callout "Your notes, checked" is now "Common mix-ups" (ii is iiø7 in minor; Neapolitan is ♭II, a major triad, first inversion).
- Map on a phone: the 800-wide SVG shrank to ~4px text at 375px; it now has a 640px minimum width inside a sideways-scrolling wrapper (`move-graph.js` only; `musifold.js`/`musifold.css` untouched).
- Verification: `quarto render docs` clean.

## Uncommitted / in flight
- Nothing of mine. Local servers stopped; no `.playwright-mcp/`. (The Playwright MCP browser was locked by another session, so I drove headless Chrome over CDP with a script in the scratchpad.)

## Parked or broken
- Listen-through, checked in a headless browser, not by ear: every widget on the hub and 5 pages mounts with no errors; every button (progressions, songs after ▶, chord-shapes, caged, key-map, chord-roles, string-intervals, symmetric) starts oscillators; all 26 map nodes, all song picks and the four paths work, and all node `lesson` links and anchors exist. NOT checked: how it sounds (tuning, balance, clicks), clicking fretboard notes directly, interval-finder's own play button.
- Phone, 375px: pages and map have no horizontal overflow. Decks switch to reveal's scroll view automatically under 435px: no overflow, figures 328px wide.
- Desktop decks, read via script (not by eye) slide by slide: no horizontal overflow or off-screen elements. Slides taller than the stage scroll (`scrollable: true`); the longest are symmetry "Symmetric chords" (1444px vs 700) and "Mediant moves" (1407), space "Interval shapes" (1392): consider splitting.
- Map path "Next ▶" stays enabled on the last step (harmless).
- Still open from before: Fundamentals scroll bug (other unit), no deck for the hub, songs for Neighbour triads / Third substitution.

## Next steps
1. Listen through by ear (needs the user's speakers).
2. Split the three longest slides if wanted.
3. Read the three new lessons against Tymoczko ch. 3.

## Kickoff prompt
```text
Title this session `musifold-guitar`. Read handoffs/handoff-20261124-120000-guitar-widget-bugs.md by its path, then CLAUDE.md. Unit: guitar. Continue from its Next steps; commit by path; do not push.
```
