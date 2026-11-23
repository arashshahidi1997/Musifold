---
title: "meta · CLAUDE.md + parked list"
date: 2026-11-23
timestamp: 20261123-233500
series: "meta"
status: open
git_commit: "65627bb"
refs: ["handoff-20261119-020800-manager-setup.md", "handoff-20261123-230000-guitar-hub-clusters.md"]
---

**How to resume (one paste):** the kickoff prompt at the end.

## What shipped
- `65627bb` (not pushed): `CLAUDE.md` matches the repo: Guitar Harmony hub (`map.qmd`) plus five cluster pages and decks (all draft); `move-graph.js` (data and the `songs` widget with `data-moves`); `home.css`; the `;` rule for preset notes; load order of the guitar scripts; the private `papers/` and `answers/` rule; the manager setup (`.claude/manager.yml`, `handoffs/`, projio-workflow plugin, gitignored local copies).
- `inbox/img-guide.md` now has a Marp-only header (its Quarto-valid `{style}` attributes are noted there; not folded into CLAUDE.md).
- `PARKED.md` at the repo root: planned nodes (Common-tone °7, Modal swaps, Backdoor) and map-comment ideas, plus the board's Parked items (fifth-tuned instruments, genres, outreach, feedback), each with date and source, worded generically. Location agreed with the manager; `PARKED.md` added to the meta paths in `.claude/manager.yml`.
- No `LATER` notes were left in the source (the old one was in the replaced `guitar-harmony.qmd`; its ideas are in the map comment and now in `PARKED.md`).

## Uncommitted / in flight
- Nothing of mine. Other sessions' changes were left alone: `.github/workflows/gh-pages.yml` (site), `docs/assets/widgets/guitar-chords.js` and `docs/tutorials/guitar-harmony/fifth-motion.qmd` (guitar). No `.playwright-mcp/` and no local server from this session.

## Parked or broken
- The board's Parked section can now point to `PARKED.md` instead of duplicating it.
- CLAUDE.md names the "Common mix-ups" rewrite nowhere; it is a guitar task.

## Next steps
1. When the guitar guide is published (drafts removed), update the Guitar Harmony paragraph in CLAUDE.md (navbar, `index.qmd`).
2. Keep `PARKED.md` current: new ideas go there, picked-up ones move out.

## Kickoff prompt
```text
Title this session `musifold-meta`. Read handoffs/handoff-20261123-233500-meta-claude-md-parked.md by its path, then CLAUDE.md and PARKED.md. Unit: meta (do not edit docs/). Commit by path; do not push.
```
