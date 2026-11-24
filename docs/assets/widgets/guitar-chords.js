// Guitar chord widgets: chord spelling + voicing engine, the progression player,
// chord roles, CAGED positions, the chord-shape library and symmetric chords.
// Needs guitar.js (the fretboard engine) loaded first.
(function () {
  "use strict";
  const M = window.Musifold;
  const { svg, el, canvas, controls, button, toggleGroup, mod } = M;
  const { fretboard, orientationSetting, pluckAll, OPEN, STRING_NAMES, FRETS } = M.guitar;

  // ------------------------------------------------------------------
  // Spelling
  // ------------------------------------------------------------------
  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  const ACC = { "-2": "♭♭", "-1": "♭", 0: "", 1: "♯", 2: "♯♯" };
  const ROOT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

  function parseRoot(str) {
    const m = /^([A-G])([♭b♯#]?)/.exec(str);
    if (!m) throw new Error(`Bad note name: ${str}`);
    const letter = LETTERS.indexOf(m[1]);
    const acc = m[2] === "♭" || m[2] === "b" ? -1 : m[2] === "♯" || m[2] === "#" ? 1 : 0;
    return { letter, pc: mod(LETTER_PC[letter] + acc, 12), len: m[0].length, name: m[1] + ACC[acc] };
  }

  // Name the note `semis` above `root`, written on the letter `steps` above it.
  function spellFrom(root, steps, semis) {
    const li = (root.letter + steps) % 7;
    const pc = mod(root.pc + semis, 12);
    const d = mod(pc - LETTER_PC[li] + 6, 12) - 6;
    return LETTERS[li] + (ACC[d] !== undefined ? ACC[d] : "?");
  }

  // [semitones, letter steps, degree label]
  const R = [0, 0, "R"], M2 = [2, 1, "2"], m3 = [3, 2, "♭3"], M3 = [4, 2, "3"], P4 = [5, 3, "4"],
    d5 = [6, 4, "♭5"], P5 = [7, 4, "5"], A5 = [8, 4, "♯5"], M6 = [9, 5, "6"], d7 = [9, 6, "♭♭7"],
    m7 = [10, 6, "♭7"], M7 = [11, 6, "7"];
  const QUAL = {
    "": [R, M3, P5], m: [R, m3, P5], 7: [R, M3, P5, m7], maj7: [R, M3, P5, M7], m7: [R, m3, P5, m7],
    m7b5: [R, m3, d5, m7], dim: [R, m3, d5], dim7: [R, m3, d5, d7], aug: [R, M3, A5],
    sus4: [R, P4, P5], sus2: [R, M2, P5], 6: [R, M3, P5, M6], m6: [R, m3, P5, M6],
    mmaj7: [R, m3, P5, M7], "7sus4": [R, P4, P5, m7],
  };
  const ALIAS = { "ø7": "m7b5", "ø": "m7b5", "m7♭5": "m7b5", "°": "dim", "°7": "dim7", "+": "aug", "m(maj7)": "mmaj7", M7: "maj7" };
  const SHOW = { "": "", m: "m", m7b5: "m7♭5", dim: "°", dim7: "°7", aug: "+", mmaj7: "m(maj7)" };
  const GENERIC = ["R", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];

  function parseFrets(str) {
    const parts = str.includes(",") ? str.split(",") : str.split("");
    return parts.map((p) => (p === "x" || p === "X" ? null : Number(p)));
  }

  function parseChord(tok) {
    let [name, voicing] = tok.split("@");
    let bassName = null;
    if (name.includes("/")) [name, bassName] = name.split("/");
    const root = parseRoot(name);
    let q = name.slice(root.len);
    if (q in ALIAS) q = ALIAS[q];
    if (!(q in QUAL)) throw new Error(`Unknown chord: ${tok}`);
    const tones = QUAL[q].map(([semis, steps, label]) => ({ semis, label, pc: mod(root.pc + semis, 12), name: spellFrom(root, steps, semis) }));
    const bass = bassName ? parseRoot(bassName) : null;
    return {
      tok, root, q, tones, bass,
      name: root.name + (q in SHOW ? SHOW[q] : q) + (bass ? "/" + bass.name : ""),
      explicit: voicing ? parseFrets(voicing) : null,
    };
  }

  function noteInfo(chord, midi) {
    const pc = mod(midi, 12);
    const t = chord.tones.find((x) => x.pc === pc);
    if (t) return { label: t.label, name: t.name };
    if (chord.bass && chord.bass.pc === pc) return { label: GENERIC[mod(pc - chord.root.pc, 12)], name: chord.bass.name };
    return { label: GENERIC[mod(pc - chord.root.pc, 12)], name: M.pcName(pc) };
  }

  // ------------------------------------------------------------------
  // Voicings: movable shapes as fret offsets from the root, low E → high e.
  // ------------------------------------------------------------------
  const X = null;
  const FULL = {
    0: {
      "": [0, 2, 2, 1, 0, 0], m: [0, 2, 2, 0, 0, 0], 7: [0, 2, 0, 1, 0, 0], maj7: [0, X, 1, 1, 0, X],
      m7: [0, 2, 0, 0, 0, 0], m7b5: [0, X, 0, 0, -1, X], dim: [0, 1, 2, 0, X, X], dim7: [0, X, -1, 0, -1, X],
      aug: [0, X, 2, 1, 1, X], sus4: [0, 2, 2, 2, 0, 0], 6: [0, X, -1, 1, 0, X], m6: [0, X, -1, 0, 0, X],
      mmaj7: [0, 2, 1, 0, 0, 0], "7sus4": [0, 2, 0, 2, 0, 0],
    },
    1: {
      "": [X, 0, 2, 2, 2, 0], m: [X, 0, 2, 2, 1, 0], 7: [X, 0, 2, 0, 2, 0], maj7: [X, 0, 2, 1, 2, 0],
      m7: [X, 0, 2, 0, 1, 0], m7b5: [X, 0, 1, 0, 1, X], dim: [X, 0, 1, 2, 1, X], dim7: [X, 0, 1, -1, 1, X],
      aug: [X, 0, 3, 2, 2, X], sus4: [X, 0, 2, 2, 3, 0], sus2: [X, 0, 2, 2, 0, 0], 6: [X, 0, 2, 2, 2, 2],
      m6: [X, 0, 2, -1, 1, X], mmaj7: [X, 0, 2, 1, 1, 0], "7sus4": [X, 0, 2, 0, 3, 0],
    },
  };
  // Shells: root + 3rd + 7th (or 6th), the guide tones.
  const SHELL = {
    0: { 7: [0, X, 0, 1, X, X], maj7: [0, X, 1, 1, X, X], m7: [0, X, 0, 0, X, X], m7b5: [0, X, 0, 0, -1, X], 6: [0, X, -1, 1, X, X], m6: [0, X, -1, 0, X, X], dim7: [0, X, -1, 0, -1, X] },
    1: { 7: [X, 0, -1, 0, X, X], maj7: [X, 0, -1, 1, X, X], m7: [X, 0, -2, 0, X, X], m7b5: [X, 0, 1, 0, 1, X], dim7: [X, 0, 1, -1, 1, X] },
  };

  const valid = (frets) => frets.every((f) => f === null || (f >= 0 && f <= FRETS)) && frets.some((f) => f !== null);

  function candidates(chord, mode = "full") {
    if (chord.explicit) return [{ frets: chord.explicit, rs: chord.explicit.findIndex((f) => f !== null) }];
    const out = [];
    [0, 1].forEach((rs) => {
      const tpl = (mode === "shell" && SHELL[rs][chord.q]) || FULL[rs][chord.q];
      if (!tpl) return;
      const r0 = mod(chord.root.pc - OPEN[rs], 12);
      [r0, r0 + 12].forEach((r) => {
        const frets = tpl.map((o) => (o === null ? null : r + o));
        if (!valid(frets)) return;
        if (chord.bass && rs === 1) {
          // put a slash-chord bass on the low E string if it is close by
          let bf = mod(chord.bass.pc - OPEN[0], 12);
          if (bf + 12 <= FRETS && Math.abs(bf + 12 - r) < Math.abs(bf - r)) bf += 12;
          if (Math.abs(bf - r) <= 3) frets[0] = bf;
        }
        out.push({ frets, rs, r });
      });
    });
    return out;
  }

  const center = (frets) => {
    const fs = frets.filter((f) => f !== null && f > 0);
    return fs.length ? fs.reduce((a, b) => a + b, 0) / fs.length : 0.5;
  };

  function choose(cands, near) {
    let best = null, bd = Infinity;
    cands.forEach((c) => {
      const d = Math.abs(center(c.frets) - near) + center(c.frets) * 0.01;
      if (d < bd) { bd = d; best = c; }
    });
    return best;
  }

  const midisOf = (frets) => frets.map((f, st) => (f === null ? null : OPEN[st] + f));

  const DEG_COLOR = (label) =>
    label === "R" ? "#1f2933" : /3$/.test(label) ? "#2a9d6f" : /5$/.test(label) ? "#2f6fdf" : /7$/.test(label) ? "#a347c4" : "#e0702b";

  // Draw a chord voicing; if `prev` is given, show which notes stay and which move.
  function drawVoicing(fb, chord, v, prevChord, prev) {
    const mids = midisOf(v.frets);
    if (prev) {
      // root motion
      const pr = prev.frets.findIndex((f) => f !== null);
      const nr = v.frets.findIndex((f) => f !== null);
      if (pr >= 0 && nr >= 0) fb.line(pr, prev.frets[pr], nr, v.frets[nr], { stroke: "#9aa5b1", width: 2, dashed: true, opacity: 0.6 });
      prev.frets.forEach((pf, st) => {
        const nf = v.frets[st];
        if (pf === null || pf === nf) return;
        fb.dot(st, pf, { r: 8, fill: "#9aa5b1", dashed: true, opacity: 0.8 });
        if (nf !== null && Math.abs(nf - pf) <= 4) fb.line(st, pf, st, nf, { stroke: "#e0702b", width: 3, opacity: 0.8 });
      });
    }
    v.frets.forEach((f, st) => {
      if (f === null) { fb.mute(st); return; }
      const info = noteInfo(chord, mids[st]);
      if (prev && prev.frets[st] === f) {
        svg("circle", { cx: fb.cx(f), cy: fb.sy(st), r: 14, fill: "none", stroke: "#e0a82b", "stroke-width": 3 }, fb.marks);
      }
      fb.dot(st, f, { r: 11, fill: DEG_COLOR(info.label), label: info.label, size: info.label.length > 2 ? 8 : 10 });
    });
  }

  // Words for what each string does between two voicings.
  function motionText(prevChord, prev, chord, v) {
    const stay = [], move = [];
    v.frets.forEach((nf, st) => {
      const pf = prev.frets[st];
      if (pf === null || nf === null) return;
      const a = noteInfo(prevChord, OPEN[st] + pf).name, b = noteInfo(chord, OPEN[st] + nf).name;
      if (pf === nf) stay.push(a);
      else if (Math.abs(nf - pf) <= 2) move.push(`${a}→${b} (${nf > pf ? "+" : "−"}${Math.abs(nf - pf)})`);
    });
    const parts = [];
    if (stay.length) parts.push(`<span style="color:#b8860b">stays: ${stay.join(", ")}</span>`);
    if (move.length) parts.push(`<span style="color:#e0702b">steps: ${move.join(", ")}</span>`);
    return parts.join(" · ") || "the shape moves to a new position";
  }

  const strum = (frets) => pluckAll(midisOf(frets).filter((m) => m !== null));

  Object.assign(M.guitar, { parseChord, candidates, choose, center, midisOf });

  // ------------------------------------------------------------------
  // Progression player
  // ------------------------------------------------------------------
  // data-presets="Name = C F G C | I IV V I | note ; Name2 = …"   or
  // data-chords="C F G C" data-labels="I IV V I" data-note="…"
  // data-voicing="shell" · data-shells="toggle" · data-position="5" · data-speed="1.2" · data-loop
  function parsePresets(opts) {
    const raw = opts.presets
      ? opts.presets.split(";").map((p) => p.trim()).filter(Boolean)
      : [`= ${opts.chords || "C"} | ${opts.labels || ""} | ${opts.note || ""}`];
    return raw.map((p) => {
      const eq = p.indexOf("=");
      const name = p.slice(0, eq).trim();
      const [chords, labels = "", note = ""] = p.slice(eq + 1).split("|").map((x) => x.trim());
      const ch = chords.split(/\s+/).map(parseChord);
      const lb = labels ? labels.split(/\s+/) : [];
      return { name, chords: ch, labels: ch.map((_, i) => lb[i] || ""), note };
    });
  }

  M.register("progression", (root, opts) => {
    const presets = parsePresets(opts);
    let P = 0, idx = 0, timer = null, voicings = [];
    let mode = opts.voicing === "shell" ? "shell" : "full";
    let speed = Number(opts.speed || 1.3);
    const near = Number(opts.position || 5);

    if (presets.length > 1) {
      const top = controls(root);
      toggleGroup(top, presets.map((p) => p.name), (i) => { P = i; stop(); build(); go(0, true); });
    }
    const chips = el("div", { class: "mf-controls" }, root);
    const ctl = controls(root);
    const playBtn = button(ctl, "▶ Play", () => (timer ? stop() : play()));
    button(ctl, "◀", () => { stop(); go(idx - 1, true); });
    button(ctl, "▶|", () => { stop(); go(idx + 1, true); });
    const loopLabel = el("label", {}, ctl);
    const loop = el("input", { type: "checkbox" }, loopLabel);
    loop.checked = "loop" in opts;
    loopLabel.append(" loop");
    const sp = el("label", { text: "speed" }, ctl);
    const spIn = el("input", { type: "range", min: 0.5, max: 2.5, step: 0.1, value: 3 - speed, style: "width:90px" }, sp);
    spIn.addEventListener("input", () => (speed = 3 - Number(spIn.value)));
    if (opts.shells === "toggle") {
      toggleGroup(ctl, ["Full", "Shell"], (i) => { mode = i ? "shell" : "full"; build(); go(idx, true); }, mode === "shell" ? 1 : 0);
    }
    orientationSetting(ctl);
    const s = canvas(root, 720, 200);
    const fb = fretboard(s, { clickable: false });
    const readout = el("div", { class: "mf-readout" }, root);

    function build() {
      const pr = presets[P];
      let c = near;
      voicings = pr.chords.map((ch) => {
        const v = choose(candidates(ch, mode), c) || { frets: [X, X, X, X, X, X], rs: 0 };
        c = center(v.frets);
        return v;
      });
      chips.innerHTML = "";
      pr.chords.forEach((ch, i) => {
        const b = button(chips, "", () => { stop(); go(i, true); });
        b.innerHTML = `<b>${ch.name}</b>${pr.labels[i] ? `<br><small>${pr.labels[i]}</small>` : ""}`;
        b.style.minWidth = "46px";
      });
    }

    function go(i, sound) {
      const n = presets[P].chords.length;
      idx = mod(i, n);
      [...chips.children].forEach((b, j) => b.classList.toggle("mf-on", j === idx));
      fb.refresh();
      if (sound) strum(voicings[idx].frets);
    }
    function play() {
      playBtn.textContent = "⏸ Pause";
      go(idx, true);
      const tick = () => {
        const n = presets[P].chords.length;
        if (idx === n - 1 && !loop.checked) { stop(); return; }
        go(idx + 1, true);
        timer = setTimeout(tick, speed * 1000);
      };
      timer = setTimeout(tick, speed * 1000);
    }
    function stop() { clearTimeout(timer); timer = null; playBtn.textContent = "▶ Play"; }

    fb.render = () => {
      const pr = presets[P];
      const ch = pr.chords[idx], v = voicings[idx];
      const hasPrev = idx > 0 || (loop.checked && pr.chords.length > 1);
      const pi = mod(idx - 1, pr.chords.length);
      drawVoicing(fb, ch, v, hasPrev ? pr.chords[pi] : null, hasPrev ? voicings[pi] : null);
      readout.innerHTML =
        `<b>${ch.name}</b>${pr.labels[idx] ? ` (${pr.labels[idx]})` : ""}: ${ch.tones.map((t) => t.name).join(" ")}` +
        (hasPrev ? `<br>From ${pr.chords[pi].name}: ${motionText(pr.chords[pi], voicings[pi], ch, v)}` : "") +
        (pr.note ? `<br><span style="color:#6b7785">${pr.note}</span>` : "");
    };
    build();
    go(0, false);
  });

  // ------------------------------------------------------------------
  // CAGED shapes (offsets from the root fret on the root string)
  // ------------------------------------------------------------------
  const CAGED = {
    maj: [
      { name: "C", rs: 1, o: [X, 0, -1, -3, -2, -3] },
      { name: "A", rs: 1, o: [X, 0, 2, 2, 2, 0] },
      { name: "G", rs: 0, o: [0, -1, -3, -3, -3, 0] },
      { name: "E", rs: 0, o: [0, 2, 2, 1, 0, 0] },
      { name: "D", rs: 2, o: [X, X, 0, 2, 3, 2] },
    ],
    min: [
      { name: "Cm", rs: 1, o: [X, 0, -2, -3, -2, X] },
      { name: "Am", rs: 1, o: [X, 0, 2, 2, 1, 0] },
      { name: "Gm", rs: 0, o: [0, -2, -3, -3, 0, 0] },
      { name: "Em", rs: 0, o: [0, 2, 2, 0, 0, 0] },
      { name: "Dm", rs: 2, o: [X, X, 0, 2, 3, 1] },
    ],
  };

  function cagedPositions(rootPc, q) {
    const out = [];
    CAGED[q].forEach((sh) => {
      const r0 = mod(rootPc - OPEN[sh.rs], 12);
      [r0, r0 + 12].forEach((r) => {
        const frets = sh.o.map((o) => (o === null ? null : r + o));
        if (valid(frets)) out.push({ shape: sh.name, frets, rs: sh.rs, r });
      });
    });
    return out.sort((a, b) => Math.min(...a.frets.filter((f) => f !== null)) - Math.min(...b.frets.filter((f) => f !== null)));
  }

  // ------------------------------------------------------------------
  // One note, three roles
  // ------------------------------------------------------------------
  M.register("chord-roles", (root) => {
    let pos = { st: 5, f: 8 }, role = 0, q = 0, alt = 0;
    const ctl = controls(root);
    el("span", { class: "mf-readout", text: "The note is the" }, ctl);
    toggleGroup(ctl, ["root", "3rd", "5th"], (i) => { role = i; alt = 0; update(true); });
    el("span", { class: "mf-readout", text: "of a" }, ctl);
    toggleGroup(ctl, ["major", "minor"], (i) => { q = i; alt = 0; update(true); });
    el("span", { class: "mf-readout", text: "chord" }, ctl);
    const ctl2 = controls(root);
    button(ctl2, "Another voicing", () => { alt++; update(true); });
    button(ctl2, "▶ Play", () => cur && strum(cur.frets));
    orientationSetting(ctl2);
    const s = canvas(root, 720, 200);
    const fb = fretboard(s, { clickable: true });
    const readout = el("div", { class: "mf-readout" }, root);
    let cur = null, chord = null, count = 0;

    fb.onclick = (st, f) => { pos = { st, f }; alt = 0; update(true); };

    function update(sound) {
      const N = fb.midi(pos.st, pos.f);
      const semis = [0, q ? 3 : 4, 7][role];
      const rootPc = mod(N - semis, 12);
      chord = parseChord(ROOT_NAMES[rootPc] + (q ? "m" : ""));
      const want = ["R", q ? "♭3" : "3", "5"][role];
      const found = cagedPositions(rootPc, q ? "min" : "maj").filter((p) => p.frets[pos.st] === pos.f);
      count = found.length;
      cur = found.length ? found[mod(alt, found.length)] : null;
      fb.refresh();
      if (sound && cur) strum(cur.frets);
      const n = parseChord(ROOT_NAMES[mod(N, 12)]).root;
      const six = [
        ["root", ROOT_NAMES[mod(N, 12)], ROOT_NAMES[mod(N, 12)] + "m"],
        ["3rd", ROOT_NAMES[mod(N - 4, 12)], ROOT_NAMES[mod(N - 3, 12)] + "m"],
        ["5th", ROOT_NAMES[mod(N - 7, 12)], ROOT_NAMES[mod(N - 7, 12)] + "m"],
      ];
      readout.innerHTML =
        `<b>${n.name}</b> (${STRING_NAMES[pos.st]} string, fret ${pos.f}) as the <b>${want}</b> → <b>${chord.name}</b> (${chord.tones.map((t) => t.name).join(" ")})` +
        (cur ? `, ${cur.shape}-shape${count > 1 ? ` (${mod(alt, count) + 1} of ${count})` : ""}` : ": no CAGED shape puts that note on this string; try a neighbouring string") +
        `<br>All six chords containing ${n.name}: ` + six.map(([r, a, b]) => `as ${r}: ${a}, ${b}`).join(" · ");
    }

    fb.render = () => {
      const N = fb.midi(pos.st, pos.f);
      if (cur) {
        cur.frets.forEach((f, st) => {
          if (f === null) { fb.mute(st); return; }
          const info = noteInfo(chord, fb.midi(st, f));
          const isTarget = st === pos.st && f === pos.f;
          fb.dot(st, f, { r: isTarget ? 14 : 10, fill: DEG_COLOR(info.label), stroke: isTarget ? "#e0a82b" : "#fff", label: info.label, size: 10 });
        });
      } else {
        fb.dot(pos.st, pos.f, { r: 14, fill: "#1f2933", label: M.pcName(N), size: 10 });
      }
    };
    update(false);
  });

  // ------------------------------------------------------------------
  // CAGED: one chord, five shapes
  // ------------------------------------------------------------------
  M.register("caged", (root) => {
    let key = 0, q = 0, i = 0, list = [];
    const ctl = controls(root);
    toggleGroup(ctl, ROOT_NAMES, (k) => { key = k; i = 0; update(true); }, 0);
    const ctl2 = controls(root);
    toggleGroup(ctl2, ["major", "minor"], (k) => { q = k; i = 0; update(true); });
    button(ctl2, "◀", () => { i--; update(true); });
    button(ctl2, "▶", () => { i++; update(true); });
    button(ctl2, "▶ Climb all positions", () => list.forEach((p, k) => setTimeout(() => { i = k; update(true); }, k * 1100)));
    orientationSetting(ctl2);
    const s = canvas(root, 720, 200);
    const fb = fretboard(s);
    const readout = el("div", { class: "mf-readout" }, root);
    let chord = null;

    function update(sound) {
      chord = parseChord(ROOT_NAMES[key] + (q ? "m" : ""));
      list = cagedPositions(key, q ? "min" : "maj");
      i = mod(i, list.length);
      fb.refresh();
      if (sound) strum(list[i].frets);
      readout.innerHTML = `<b>${chord.name}</b>: ${list.map((p, k) => (k === i ? `<b>${p.shape}-shape</b>` : `${p.shape}-shape`)).join(" → ")}` +
        `<br>The ${list[i].shape}-shape: the open ${list[i].shape} chord moved up the neck. Each shape shares notes with the next one, so together they cover the whole neck.`;
    }

    fb.render = () => {
      list.forEach((p, k) => {
        if (k === i) return;
        p.frets.forEach((f, st) => { if (f !== null) fb.dot(st, f, { r: 6, fill: "#9aa5b1", opacity: 0.45 }); });
      });
      const p = list[i];
      p.frets.forEach((f, st) => {
        if (f === null) { fb.mute(st); return; }
        const info = noteInfo(chord, fb.midi(st, f));
        fb.dot(st, f, { r: 11, fill: DEG_COLOR(info.label), label: info.label, size: 10 });
      });
    };
    update(false);
  });

  // ------------------------------------------------------------------
  // Chord-shape library
  // ------------------------------------------------------------------
  M.register("chord-shapes", (root, opts) => {
    const quals = (opts.qualities || "maj7,7,m7,m7b5,dim7").split(",");
    let qi = 0, rs = 0, key = 0, mode = "full";
    const ctl = controls(root);
    const QLABEL = { "": "major", m: "minor", maj7: "maj7", 7: "7", m7: "m7", m7b5: "m7♭5 (ø7)", dim7: "°7", dim: "°", aug: "+", sus4: "sus4", sus2: "sus2", 6: "6", m6: "m6", mmaj7: "m(maj7)", "7sus4": "7sus4" };
    toggleGroup(ctl, quals.map((q) => QLABEL[q] || q), (i) => { qi = i; update(true); });
    const ctl2 = controls(root);
    el("span", { class: "mf-readout", text: "Root on:" }, ctl2);
    toggleGroup(ctl2, ["6th string", "5th string"], (i) => { rs = i; update(true); });
    if (opts.shells !== undefined) toggleGroup(ctl2, ["Full", "Shell"], (i) => { mode = i ? "shell" : "full"; update(true); });
    button(ctl2, "▶ Play", () => cur && strum(cur.frets));
    button(ctl2, "▶ Arpeggio", () => cur && midisOf(cur.frets).filter((m) => m !== null).forEach((m, k) => M.pluck(M.midiToHz(m), { at: k * 0.18 })));
    orientationSetting(ctl2);
    const ctl3 = controls(root);
    el("span", { class: "mf-readout", text: "Root:" }, ctl3);
    toggleGroup(ctl3, ROOT_NAMES, (k) => { key = k; update(true); }, 0);
    const s = canvas(root, 720, 200);
    const fb = fretboard(s);
    const readout = el("div", { class: "mf-readout" }, root);
    let cur = null, chord = null;

    function update(sound) {
      chord = parseChord(ROOT_NAMES[key] + quals[qi]);
      const all = candidates(chord, mode).filter((c) => c.rs === rs);
      cur = choose(all, 6);
      fb.refresh();
      if (sound && cur) strum(cur.frets);
      readout.innerHTML = `<b>${chord.name}</b> = ${chord.tones.map((t) => `${t.name} <small>(${t.label})</small>`).join(" ")}` +
        (cur ? "" : `<br>No ${mode} shape with the root on this string.`);
    }
    fb.render = () => {
      if (!cur) return;
      cur.frets.forEach((f, st) => {
        if (f === null) { fb.mute(st); return; }
        const info = noteInfo(chord, fb.midi(st, f));
        fb.dot(st, f, { r: 11, fill: DEG_COLOR(info.label), label: info.label, size: info.label.length > 2 ? 8 : 10 });
      });
    };
    update(false);
  });

  // ------------------------------------------------------------------
  // Symmetric chords: diminished 7th (every 3 frets) and augmented (every 4)
  // ------------------------------------------------------------------
  M.register("symmetric", (root, opts) => {
    const isAug = opts.type === "aug";
    const STEP = isAug ? 4 : 3;
    const q = isAug ? "aug" : "dim7";
    let r = isAug ? 3 : 7; // fret of the root on the low E string (G+ / B°7)
    let res = null, resMinor = false;
    const ctl = controls(root);
    button(ctl, `◀ −${STEP} frets`, () => { r = r - STEP < 0 ? r + STEP * Math.floor((FRETS - 2 - r) / STEP) : r - STEP; res = null; update(true); });
    button(ctl, `+${STEP} frets ▶`, () => { r = r + STEP + 2 > FRETS ? mod(r, STEP) : r + STEP; res = null; update(true); });
    const ctl2 = controls(root);
    el("span", { class: "mf-readout", text: "Resolve to:" }, ctl2);
    const resBox = el("span", {}, ctl2);
    if (!isAug) toggleGroup(ctl2, ["major", "minor"], (i) => { resMinor = !!i; if (res !== null) resolve(res); });
    orientationSetting(ctl2);
    const s = canvas(root, 720, 200);
    const fb = fretboard(s);
    const readout = el("div", { class: "mf-readout" }, root);
    let chord = null, v = null, target = null, tv = null;

    function shapeAt(fret) {
      const frets = FULL[0][q].map((o) => (o === null ? null : fret + o));
      return { frets, rs: 0, r: fret };
    }
    function update(sound) {
      const pc = mod(OPEN[0] + r, 12);
      chord = parseChord(ROOT_NAMES[pc] + (isAug ? "+" : "°7"));
      v = shapeAt(r);
      target = tv = null;
      fb.refresh();
      if (sound) strum(v.frets);
      // resolution buttons: each note as leading tone (dim7) or as the 5th of V+ (aug)
      resBox.innerHTML = "";
      const tones = [...new Set(midisOf(v.frets).filter((m) => m !== null).map((m) => mod(m, 12)))];
      tones.forEach((t) => {
        const tonic = isAug ? mod(t + 5, 12) : mod(t + 1, 12);
        button(resBox, ROOT_NAMES[tonic] + (isAug || !resMinor ? "" : "m"), () => resolve(tonic));
      });
      readout.innerHTML = `<b>${chord.name}</b> at fret ${r}: ${chord.tones.map((t) => t.name).join(" ")}. ` +
        `Slide it ${STEP} frets and you play the same ${isAug ? "three" : "four"} notes in a new order. ` +
        (isAug ? "Each note can be heard as the root of a V+, so it resolves three ways." : "Each note can act as a leading tone, so it resolves four ways.");
    }
    function resolve(tonic) {
      res = tonic;
      target = parseChord(ROOT_NAMES[tonic] + (isAug || !resMinor ? "" : "m"));
      tv = choose(candidates(target), center(v.frets));
      // respell the symmetric chord as seen from the target: vii°7 (G♯ B D F) or V+ (G B D♯)
      const sp = isAug ? parseChord(spellFrom(target.root, 4, 7) + "+") : parseChord(spellFrom(target.root, 6, 11) + "°7");
      const byPc = new Map(sp.tones.map((t) => [t.pc, t.name]));
      chord = { ...chord, name: sp.name, tones: chord.tones.map((t) => ({ ...t, name: byPc.get(t.pc) || t.name })) };
      fb.refresh();
      strum(v.frets);
      setTimeout(() => strum(tv.frets), 700);
      // the defining move: leading tone → tonic (dim7), raised 5th → the tonic's 3rd (aug)
      const fromPc = isAug ? mod(tonic + 3, 12) : mod(tonic - 1, 12);
      const toPc = isAug ? mod(tonic + 4, 12) : tonic;
      const from = chord.tones.find((t) => t.pc === fromPc);
      const to = target.tones.find((t) => t.pc === toPc);
      const key = from && to ? `<b>${from.name} → ${to.name}</b> (${isAug ? "the raised 5th rises to the 3rd" : "the leading tone rises to the tonic"}). ` : "";
      readout.innerHTML = `<b>${chord.name} → ${target.name}</b>: ${key}On the neck: ${motionText(chord, v, target, tv)}`;
    }
    fb.render = () => {
      if (target && tv) drawVoicing(fb, target, tv, chord, v);
      else drawVoicing(fb, chord, v, null, null);
    };
    update(false);
  });
})();
