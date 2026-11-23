---
title: "fundamentals · listen-through + slide fit"
date: 2026-11-23
timestamp: 20261123-234246
series: "fundamentals"
status: open
git_commit: "6539249"
refs: ["handoff-20261119-020800-manager-setup.md"]
---

**How to resume (one paste):** the kickoff prompt at the end.

## What shipped
- `6539249` (not pushed): audio guards and slide fit, in `acoustics.js`, `scales.js` and `fundamentals.qmd`. No edits to `musifold.js` or `musifold.css`.
- **Listen-through (items 4 and 5 of the manager handoff), 14 widgets on the page plus the home Tonnetz.** Method: the preview's Web Audio graph was instrumented (oscillators started/ended, peak level at the master compressor output) and every sound control was clicked; the page and the deck were driven in Chrome. Results:
  - Starts, stops, ends: every control sounds, every note ends by itself, nothing stays live (live oscillators back to 0 after each). Held sounds stop on demand: the beats drone ~0.2 s after Stop, the mode-window cycle on its second click.
  - Level: peaks 0.18–0.61 at the compressor output, highest V⁷→I (0.61); 8 rapid Tonnetz clicks 0.70. Nothing reached 1.0, so no clipping at the output.
  - Silent by design: interval chips in beats and intonation, mode chips in mode-window, "Stack the fifths" in comma. Chips in violin-frames play the frame.
  - Console: no widget errors on the page, the deck or the home page (only browser-extension noise).
- **Bug found and fixed: sound kept playing after leaving the widget.** The mode-window "Cycle through all" loop played forever when scrolled away or on another slide (132 oscillators in 8 s off-screen); the beats drone hummed on; the fifths-circle stepper kept stepping. Now all three stop on scroll-out and on a reveal.js slide change (`onLeave` in each file, which also listens for `slidechanged` because reveal keeps hidden slides "intersecting"). Verified in the deck and for the cycle on the page.
- **Slide fit at 1280×720** (measured in a 1280×720 frame, every widget slide): the controls of 2.1 comma (801 px), 3.1 tetrachords (721), 3.2 mode-window (779), the tetrachord matrix (801) and 6.1 violin-frames (745) were below the fold. Fix: reveal-only CSS in the note's front matter and a `{.compact}` class on those headings (figure capped at 215 px, tighter margins; the matrix is a `---` continuation, so it is targeted by its `data-widget`). Now the lowest control is at 690 px or less on all 14 widget slides; slide count unchanged (24).

## Uncommitted / in flight
- Nothing of mine. Other sessions' files were left alone (`.github/workflows/gh-pages.yml`, `guitar-chords.js`, `move-graph.js`, `fifth-motion.qmd`).
- No servers left running; the static test build was in the session scratchpad, not the repo.

## Parked or broken
**Audio I could not confirm (no ears on this run; the graph was measured, not heard):**
1. How it *sounds*: clicks or pops at note edges, timbre, balance between the two drones in beats, whether the 3.5 Hz comma beating and the pure/ET third difference are audible. Peak levels are fine; that is all that was confirmed.
2. Not exercised: the per-row click in harmonic-series (`acoustics.js` ~line 60), the cell clicks in the tetrachord matrix (`scales.js` ~265), and any widget on a phone or in Firefox/Safari (Chrome only). Checked in code only.
3. Overlap, not stuck: the one-shot buttons ("Replay walk", "Play V⁷ → I", "Hear the comma", scale playback) schedule all notes ahead and have no stop. Pressing them repeatedly layers the sound. They are finite (≤7 s), so I left them.
4. Not guarded on leaving a slide (finite, ≤7 s each): Tonnetz progression, Replay walk, Pure-then-ET. Only the three endless ones are.
5. `fifths-circle` Play measured as full run: 90 oscillators over 15.5 s, peak 0.23.

**Left on the slides (not controls):** captions below the figure still need a scroll on 2.1, 3.2, the matrix and 6.1; the lower part of the figure on 1.1/beats (svg ends ~734 px) and 6.2/intonation (~736 px) is a few px below the fold, with their controls above it and reachable. The compact figures are smaller (215 px tall), so their in-figure text is smaller too; if that reads too small, a real fix is a shorter lead-in text or splitting the slide.

**Noticed, not mine to fix here:** the home-page Tonnetz explore readout spells the relative of F♯ major as "E♭m" next to "F♯m" and "B♭m" (D♯m expected), so the root-spelling fix in `dd23ee5` does not cover the neighbour list (`tonnetz.js` `neighbours` spelling; same unit, small).

## Next steps
1. Listen once by ear through the page and the deck; re-open point 1 above if anything clicks or sounds off.
2. Tonnetz neighbour spelling (E♭m vs D♯m) in `tonnetz.js`.
3. Decide whether the 215 px figures on the compact slides are readable at a talk's projector size.

Process notes for the manager: (a) `quarto preview` live-reload navigates the browser to whichever page another session last rendered, so a test tab got hijacked; I tested on `quarto render docs --output-dir <scratch>` plus `python3 -m http.server`. (b) Chrome cached the widget JS across renders (`fetch(url, {cache: "reload"})` refreshes it). (c) The browser window would not shrink below 1680×1006, so the deck was tested inside a 1280×720 iframe.

## Kickoff prompt
```text
Title this session `musifold-fundamentals · tonnetz spelling + ear check`. Read handoffs/handoff-20261123-234246-fundamentals-listen-slides.md by its path, then CLAUDE.md. Unit: fundamentals (do not edit docs/assets/musifold.js or musifold.css). Continue from Next steps. Commit by path; do not push.
```
