// Guitar widgets: a shared fretboard engine (standard tuning, frets 0–15, right-handed)
// plus string intervals, the interval finder and the key map.
(function () {
  "use strict";
  const M = window.Musifold;
  const { svg, el, canvas, controls, button, toggleGroup, caption, mod } = M;

  // String 0 = low E … string 5 = high E.
  const OPEN = [40, 45, 50, 55, 59, 64];
  const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];
  const FRETS = 15;

  // ---------- orientation setting (shared by every fretboard on the page) ----------

  const PREF_KEY = "musifold.guitar.lowEOnTop";
  let lowEOnTop = false;
  try { lowEOnTop = localStorage.getItem(PREF_KEY) === "1"; } catch (e) { /* storage unavailable */ }
  const boards = new Set();

  function setLowEOnTop(v) {
    lowEOnTop = v;
    try { localStorage.setItem(PREF_KEY, v ? "1" : "0"); } catch (e) { /* storage unavailable */ }
    document.querySelectorAll(".mf-setting input").forEach((i) => (i.checked = v));
    boards.forEach((b) => b.layout());
  }

  function orientationSetting(parent) {
    const label = el("label", { class: "mf-setting", title: "Display setting shared by every fretboard on this page" }, parent);
    const cb = el("input", { type: "checkbox" }, label);
    cb.checked = lowEOnTop;
    label.append("⚙ low E on top");
    cb.addEventListener("change", () => setLowEOnTop(cb.checked));
  }

  // ---------- fretboard engine ----------

  // Draws a neck into SVG `s`. Widgets draw their marks in `render()`, which re-runs
  // whenever the orientation changes; `onclick(string, fret)` handles taps.
  function fretboard(s, { x0 = 62, x1 = 650, top = 26, gap = 26, clickable = false } = {}) {
    const L = (x1 - x0) / (1 - Math.pow(2, -FRETS / 12));
    const fx = (f) => x0 + L * (1 - Math.pow(2, -f / 12)); // fret wire position, true spacing
    const cx = (f) => (f === 0 ? x0 - 17 : (fx(f - 1) + fx(f)) / 2); // where a finger goes
    const sy = (st) => top + (lowEOnTop ? st : 5 - st) * gap;
    const bottom = top + 5 * gap;

    const g = svg("g", {}, s);
    const base = svg("g", {}, g);
    svg("rect", { x: x0, y: top - 12, width: x1 - x0, height: 5 * gap + 24, rx: 3, fill: "#f3e7d3" }, base);
    [3, 5, 7, 9, 15].forEach((f) => svg("circle", { cx: cx(f), cy: (top + bottom) / 2, r: 5, fill: "#dccbb0" }, base));
    [1.5, 3.5].forEach((k) => svg("circle", { cx: cx(12), cy: top + k * gap, r: 5, fill: "#dccbb0" }, base));
    for (let f = 1; f <= FRETS; f++) svg("line", { x1: fx(f), y1: top - 12, x2: fx(f), y2: bottom + 12, stroke: "#b8a789", "stroke-width": 2 }, base);
    svg("rect", { x: x0 - 5, y: top - 12, width: 6, height: 5 * gap + 24, fill: "#3b3b3b" }, base);
    [1, 3, 5, 7, 9, 12, 15].forEach((f) => svg("text", { x: cx(f), y: bottom + 30, "font-size": 11, "text-anchor": "middle", fill: "#9aa5b1", text: f }, base));
    svg("text", { x: cx(0), y: bottom + 30, "font-size": 11, "text-anchor": "middle", fill: "#9aa5b1", text: "open" }, base);

    const strings = OPEN.map((_, st) => ({
      line: svg("line", { x1: x0 - 30, x2: x1, stroke: "#8a8f96", "stroke-width": 0.8 + (5 - st) * 0.35 }, g),
      label: svg("text", { x: 14, "font-size": 13, "font-weight": 700, "text-anchor": "middle", fill: "#52606d", text: STRING_NAMES[st] }, g),
    }));
    const marks = svg("g", { "pointer-events": "none" }, g);
    const hits = svg("g", {}, g);
    const hitRects = [];
    if (clickable) {
      for (let st = 0; st < 6; st++) {
        for (let f = 0; f <= FRETS; f++) {
          const xa = f === 0 ? x0 - 32 : fx(f - 1), xb = f === 0 ? x0 - 2 : fx(f);
          const r = svg("rect", { x: xa, width: xb - xa, height: gap, fill: "transparent", class: "mf-clickable" }, hits);
          r.addEventListener("click", () => api.onclick && api.onclick(st, f));
          hitRects.push({ r, st });
        }
      }
    }

    const api = {
      g, marks, fx, cx, sy, top, bottom, gap, x0, x1,
      midi: (st, f) => OPEN[st] + f,
      onclick: null,
      render: null,
      layout() {
        strings.forEach((o, st) => {
          o.line.setAttribute("y1", sy(st));
          o.line.setAttribute("y2", sy(st));
          o.label.setAttribute("y", sy(st) + 5);
        });
        hitRects.forEach(({ r, st }) => r.setAttribute("y", sy(st) - gap / 2));
        marks.innerHTML = "";
        if (api.render) api.render();
      },
      dot(st, f, { r = 10, fill = "#2f6fdf", stroke = "#fff", label = "", color = "#fff", size = 11, dashed = false, opacity = 1 } = {}) {
        const x = cx(f), y = sy(st);
        svg("circle", {
          cx: x, cy: y, r, fill: dashed ? "none" : fill, stroke: dashed ? fill : stroke,
          "stroke-width": dashed ? 2 : 1.5, "stroke-dasharray": dashed ? "3 3" : null, opacity,
        }, marks);
        if (label) svg("text", { x, y: y + size * 0.36, "font-size": size, "font-weight": 700, "text-anchor": "middle", fill: dashed ? fill : color, opacity, text: label }, marks);
      },
      line(st1, f1, st2, f2, { stroke = "#2f6fdf", width = 3, dashed = false, opacity = 0.7 } = {}) {
        svg("line", {
          x1: cx(f1), y1: sy(st1), x2: cx(f2), y2: sy(st2), stroke, "stroke-width": width,
          "stroke-linecap": "round", "stroke-dasharray": dashed ? "5 5" : null, opacity,
        }, marks);
      },
      mute(st) {
        svg("text", { x: x0 - 17, y: sy(st) + 5, "font-size": 14, "font-weight": 700, "text-anchor": "middle", fill: "#9aa5b1", text: "×" }, marks);
      },
      refresh() { api.layout(); },
    };
    boards.add(api);
    return api;
  }

  const hz = (midi) => M.midiToHz(midi);
  const moveText = (df) => (df === 0 ? "same fret" : `${df > 0 ? "+" : "−"}${Math.abs(df)} fret${Math.abs(df) > 1 ? "s" : ""}`);
  const pluckAll = (midis, at = 0) => midis.forEach((m) => M.pluck(hz(m), { at, gain: 0.32 / Math.sqrt(midis.length) }));

  // A row of independent on/off buttons.
  function toggles(parent, labels, initial, onchange) {
    const state = labels.map((_, i) => initial.includes(i));
    labels.forEach((label, i) => {
      const b = button(parent, label, () => {
        state[i] = !state[i];
        b.classList.toggle("mf-on", state[i]);
        onchange(state);
      });
      b.classList.toggle("mf-on", state[i]);
    });
    return state;
  }

  M.guitar = { fretboard, orientationSetting, toggles, pluckAll, OPEN, STRING_NAMES, FRETS };

  // ------------------------------------------------------------------
  // 1.1 String intervals and the B-string shift.
  // ------------------------------------------------------------------
  const SHAPES = [
    { name: "Perfect 4th", semis: 5, span: 1 },
    { name: "Perfect 5th", semis: 7, span: 1 },
    { name: "Major 3rd", semis: 4, span: 1 },
    { name: "Minor 3rd", semis: 3, span: 1 },
    { name: "Octave", semis: 12, span: 2 },
    { name: "Minor 10th", semis: 15, span: 3 },
    { name: "Major 10th", semis: 16, span: 3 },
  ];

  M.register("string-intervals", (root) => {
    const ctl = controls(root);
    let shape = 4, pair = 0, auto = null;
    toggleGroup(ctl, SHAPES.map((x) => x.name), (i) => { shape = i; pair = Math.min(pair, 5 - SHAPES[i].span); fb.refresh(); sound(); }, shape);
    const ctl2 = controls(root);
    button(ctl2, "◀", () => step(-1));
    button(ctl2, "▶", () => step(1));
    const autoBtn = button(ctl2, "⟳ Walk across the strings", () => {
      if (auto) { clearInterval(auto); auto = null; }
      else { pair = -1; step(1); auto = setInterval(() => step(1), 1700); }
      autoBtn.classList.toggle("mf-on", !!auto);
    });
    orientationSetting(ctl2);

    const s = canvas(root, 720, 200);
    const fb = fretboard(s);
    const readout = el("div", { class: "mf-readout" }, root);
    caption(root, "The same interval keeps the same shape on every pair of strings, until the shape crosses from G to B. That pair is a major 3rd apart instead of a 4th, so the upper note moves up one fret. The dashed circle shows where the usual shape would put it.");

    const ROOT_FRET = 5;
    function step(d) {
      const n = 6 - SHAPES[shape].span;
      pair = mod(pair + d, n);
      fb.refresh();
      sound();
    }
    function target() {
      const sh = SHAPES[shape];
      const hi = pair + sh.span;
      const fret = ROOT_FRET + sh.semis - (OPEN[hi] - OPEN[pair]);
      const usual = ROOT_FRET + sh.semis - 5 * sh.span; // if every pair were a 4th
      return { hi, fret, usual };
    }
    function sound() {
      const { hi, fret } = target();
      M.pluck(hz(fb.midi(pair, ROOT_FRET)));
      M.pluck(hz(fb.midi(hi, fret)), { at: 0.35 });
    }

    fb.render = () => {
      // interval brackets between neighbouring strings, right of the neck
      for (let st = 0; st < 5; st++) {
        const isB = st === 3;
        const y1 = fb.sy(st), y2 = fb.sy(st + 1);
        svg("path", { d: `M664 ${y1} H670 V${y2} H664`, fill: "none", stroke: isB ? "#e0702b" : "#9aa5b1", "stroke-width": 1.5 }, fb.marks);
        svg("text", { x: 676, y: (y1 + y2) / 2 + 4, "font-size": 11, "font-weight": isB ? 700 : 400, fill: isB ? "#e0702b" : "#6b7785", text: isB ? "M3" : "P4" }, fb.marks);
      }
      const sh = SHAPES[shape];
      const { hi, fret, usual } = target();
      const shifted = fret !== usual;
      if (shifted) {
        fb.dot(hi, usual, { fill: "#9aa5b1", dashed: true, label: "?", r: 10 });
        fb.line(hi, usual, hi, fret, { stroke: "#e0702b", width: 2, dashed: true });
      }
      fb.line(pair, ROOT_FRET, hi, fret, { stroke: shifted ? "#e0702b" : "#2f6fdf" });
      fb.dot(pair, ROOT_FRET, { fill: "#1f2933", label: "R" });
      fb.dot(hi, fret, { fill: shifted ? "#e0702b" : "#2f6fdf", label: "" });
      const rootName = M.pcName(fb.midi(pair, ROOT_FRET));
      const tName = M.pcName(fb.midi(hi, fret));
      const df = fret - ROOT_FRET;
      readout.innerHTML = `${sh.name} from ${rootName} (${STRING_NAMES[pair]} string, fret ${ROOT_FRET}) to ${tName} on the ${STRING_NAMES[hi]} string: ` +
        `<b>${sh.span === 1 ? "next string" : sh.span === 2 ? "skip one string" : "three strings over"}, ${moveText(df)}</b>` +
        (shifted ? ` <span style="color:#e0702b">(one more than usual: the shape crosses G→B)</span>` : "");
    };
    fb.layout();
  });

  // ------------------------------------------------------------------
  // 1.2 Interval finder: click a note, see its intervals nearby.
  // ------------------------------------------------------------------
  const FIND = [
    { label: "Octaves", semis: [12, 24], deg: "8", color: "#1f2933" },
    { label: "5ths", semis: [7, 19], deg: "5", color: "#2f6fdf" },
    { label: "4ths", semis: [5, 17], deg: "4", color: "#a347c4" },
    { label: "Major 3rds / 10ths", semis: [4, 16], deg: "3", color: "#2a9d6f" },
    { label: "Minor 3rds / 10ths", semis: [3, 15], deg: "♭3", color: "#e0702b" },
  ];
  const SEMI_NAMES = { 3: "m3", 4: "M3", 5: "P4", 7: "P5", 12: "8ve", 15: "m10", 16: "M10", 17: "P11", 19: "P12", 24: "2×8ve" };

  M.register("interval-finder", (root) => {
    let rootPos = { st: 1, f: 3 };
    const ctl = controls(root);
    const on = toggles(ctl, FIND.map((x) => x.label), [0, 1, 3], () => fb.refresh());
    const ctl2 = controls(root);
    button(ctl2, "▶ Play the shapes", () => play());
    orientationSetting(ctl2);
    const s = canvas(root, 720, 200);
    const fb = fretboard(s, { clickable: true });
    const readout = el("div", { class: "mf-readout" }, root);
    caption(root, "Click any fret to make it the root. Small dots mark every place the chosen intervals occur; lines connect the root to the ones within reach (up to four frets away, on higher strings). These are the shapes to memorize.");

    let near = [];
    fb.onclick = (st, f) => { rootPos = { st, f }; fb.refresh(); M.pluck(hz(fb.midi(st, f))); };

    function play() {
      const notes = [fb.midi(rootPos.st, rootPos.f), ...near.map((n) => n.midi)].sort((a, b) => a - b);
      notes.forEach((m, i) => M.pluck(hz(m), { at: i * 0.3 }));
    }

    fb.render = () => {
      const rm = fb.midi(rootPos.st, rootPos.f);
      near = [];
      // every occurrence of the chosen pitch classes
      for (let st = 0; st < 6; st++) {
        for (let f = 0; f <= FRETS; f++) {
          const d = mod(fb.midi(st, f) - rm, 12);
          FIND.forEach((F, i) => {
            if (!on[i]) return;
            if (mod(F.semis[0], 12) === d) fb.dot(st, f, { r: 7, fill: F.color, opacity: 0.28, label: "" });
          });
        }
      }
      // shapes within reach on higher strings
      for (let st = rootPos.st + 1; st < 6; st++) {
        for (let f = Math.max(0, rootPos.f - 4); f <= Math.min(FRETS, rootPos.f + 4); f++) {
          const semis = fb.midi(st, f) - rm;
          FIND.forEach((F, i) => {
            if (on[i] && F.semis.includes(semis)) near.push({ st, f, F, semis, midi: fb.midi(st, f) });
          });
        }
      }
      near.forEach((n) => fb.line(rootPos.st, rootPos.f, n.st, n.f, { stroke: n.F.color, width: 2.5, opacity: 0.55 }));
      near.forEach((n) => fb.dot(n.st, n.f, { r: 12, fill: n.F.color, label: SEMI_NAMES[n.semis] || n.F.deg, size: 9 }));
      fb.dot(rootPos.st, rootPos.f, { r: 13, fill: "#1f2933", label: M.pcName(rm), size: 11 });
      const list = near.map((n) => `${SEMI_NAMES[n.semis]} on ${STRING_NAMES[n.st]} (${n.f - rootPos.f >= 0 ? "+" : "−"}${Math.abs(n.f - rootPos.f)})`);
      readout.innerHTML = `Root <b>${M.midiName(rm)}</b>: ${STRING_NAMES[rootPos.st]} string, fret ${rootPos.f}. ` +
        (list.length ? `Within reach: ${list.join(" · ")}` : "No shapes within reach on higher strings.");
    };
    fb.layout();
  });

  // ------------------------------------------------------------------
  // 2 Key map: the diatonic chords around a tonic.
  // ------------------------------------------------------------------
  // Barre shapes as fret offsets from the root, low E → high e (null = muted).
  const SHAPES_E = { maj: [0, 2, 2, 1, 0, 0], min: [0, 2, 2, 0, 0, 0], dim: [0, 1, 2, 0, null, null] };
  const SHAPES_A = { maj: [null, 0, 2, 2, 2, 0], min: [null, 0, 2, 2, 1, 0], dim: [null, 0, 1, 2, 1, null] };

  const DEGREES = [
    { rn: "I", off: 0, q: "maj", fn: "T" },
    { rn: "ii", off: 2, q: "min", fn: "S" },
    { rn: "iii", off: 4, q: "min", fn: "T" },
    { rn: "IV", off: 5, q: "maj", fn: "S" },
    { rn: "V", off: 7, q: "maj", fn: "D" },
    { rn: "vi", off: 9, q: "min", fn: "T" },
    { rn: "vii°", off: 11, q: "dim", fn: "D" },
  ];
  const FN_COLOR = { T: "#2f6fdf", S: "#e0702b", D: "#2a9d6f" };

  // Candidate root positions [string, fret offset from the tonic's fret], in order of preference.
  const POSITIONS = {
    0: { I: [[0, 0]], ii: [[0, 2], [1, -3]], iii: [[1, -1], [0, 4]], IV: [[1, 0]], V: [[1, 2], [0, 7]], vi: [[0, -3], [1, 4]], "vii°": [[0, -1], [1, 6]] },
    1: { I: [[1, 0]], ii: [[1, 2], [0, 7]], iii: [[0, -3], [1, 4]], IV: [[0, -2], [1, 5]], V: [[0, 0]], vi: [[0, 2]], "vii°": [[1, -1], [0, 4]] },
  };

  const KEYS = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const FLAT_KEYS = new Set([1, 3, 5, 8, 10]);
  const SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

  M.register("key-map", (root) => {
    let key = 0, rootString = 0, sel = 0;
    const ctl = controls(root);
    el("span", { class: "mf-readout", text: "Key:" }, ctl);
    toggleGroup(ctl, KEYS, (i) => { key = i; fb.refresh(); playSel(); }, key);
    const ctl2 = controls(root);
    el("span", { class: "mf-readout", text: "Tonic on:" }, ctl2);
    toggleGroup(ctl2, ["6th string", "5th string"], (i) => { rootString = i; fb.refresh(); playSel(); }, rootString);
    button(ctl2, "▶ I – IV – V – I", () => playSeq([0, 3, 4, 0]));
    button(ctl2, "▶ All seven", () => playSeq([0, 1, 2, 3, 4, 5, 6]));
    orientationSetting(ctl2);
    const s = canvas(root, 720, 214);
    const fb = fretboard(s, { clickable: true });
    // legend
    [["tonic", "T"], ["subdominant", "S"], ["dominant", "D"]].forEach(([t, k], i) => {
      svg("circle", { cx: 70 + i * 160, cy: 206, r: 5, fill: FN_COLOR[k] }, s);
      svg("text", { x: 80 + i * 160, y: 210, "font-size": 11, fill: "#52606d", text: t + " function" }, s);
    });
    const readout = el("div", { class: "mf-readout" }, root);
    caption(root, "Large dots are chord roots, labelled with Roman numerals. The highlighted chord is drawn as a barre shape. I, IV and V make an L across two strings; ii and vi sit two frets above I and V; the relative minor (vi) is three frets below the tonic. Click a numeral to hear it.");

    let placed = [];
    const tonicFret = () => mod(key - (OPEN[rootString === 0 ? 0 : 1] % 12), 12);
    const spell = (pc) => (FLAT_KEYS.has(key) ? FLAT : SHARP)[mod(pc, 12)];

    function place() {
      const t = tonicFret();
      return DEGREES.map((d) => {
        const opts = POSITIONS[rootString][d.rn];
        for (const [st, df] of opts) {
          const f = t + df;
          const shape = (st === 0 ? SHAPES_E : SHAPES_A)[d.q];
          const frets = shape.map((o) => (o === null ? null : f + o));
          if (frets.every((x) => x === null || (x >= 0 && x <= FRETS))) return { d, st, f, frets };
        }
        // fall back an octave up
        const [st, df] = opts[0];
        const f = t + df + 12;
        const shape = (st === 0 ? SHAPES_E : SHAPES_A)[d.q];
        return { d, st, f, frets: shape.map((o) => (o === null ? null : f + o)) };
      });
    }

    function chordMidis(p) {
      return p.frets.map((f, st) => (f === null ? null : fb.midi(st, f))).filter((x) => x !== null);
    }
    function playSel() { pluckAll(chordMidis(placed[sel])); }
    let seqTimers = [];
    function playSeq(list) {
      seqTimers.forEach(clearTimeout);
      seqTimers = list.map((i, n) => setTimeout(() => { sel = i; fb.refresh(); playSel(); }, n * 900));
    }

    fb.onclick = (st, f) => {
      const hit = placed.findIndex((p) => p.st === st && p.f === f);
      if (hit >= 0) { sel = hit; fb.refresh(); playSel(); }
    };

    fb.render = () => {
      placed = place();
      const byRn = Object.fromEntries(placed.map((p) => [p.d.rn, p]));
      // the L shape
      const I = byRn.I, IV = byRn.IV, V = byRn.V;
      fb.line(I.st, I.f, IV.st, IV.f, { stroke: "#9aa5b1", width: 2, dashed: true, opacity: 0.8 });
      fb.line(IV.st, IV.f, V.st, V.f, { stroke: "#9aa5b1", width: 2, dashed: true, opacity: 0.8 });
      if (I.st !== V.st || I.f !== V.f) fb.line(I.st, I.f, V.st, V.f, { stroke: "#9aa5b1", width: 2, dashed: true, opacity: 0.4 });
      // other numerals first, so the selected chord's notes stay visible on top
      placed.forEach((q, i) => {
        if (i !== sel) fb.dot(q.st, q.f, { r: 13, fill: FN_COLOR[q.d.fn], opacity: 0.8, label: q.d.rn, size: q.d.rn.length > 2 ? 9 : 11 });
      });
      // selected chord shape
      const p = placed[sel];
      const rootPc = mod(key + p.d.off, 12);
      p.frets.forEach((f, st) => {
        if (f === null) { fb.mute(st); return; }
        const iv = mod(fb.midi(st, f) - rootPc, 12);
        const deg = { 0: "R", 3: "♭3", 4: "3", 6: "♭5", 7: "5" }[iv] || "";
        if (!(st === p.st && f === p.f)) fb.dot(st, f, { r: 9, fill: "#fff", stroke: FN_COLOR[p.d.fn], label: deg, color: FN_COLOR[p.d.fn], size: 9 });
      });
      fb.dot(p.st, p.f, { r: 15, fill: FN_COLOR[p.d.fn], stroke: "#1f2933", label: p.d.rn, size: p.d.rn.length > 2 ? 9 : 11 });
      const name = spell(rootPc) + (p.d.q === "min" ? "m" : p.d.q === "dim" ? "°" : "");
      const names = placed.map((q) => `${q.d.rn} ${spell(key + q.d.off)}${q.d.q === "min" ? "m" : q.d.q === "dim" ? "°" : ""}`);
      readout.innerHTML = `Key of <b>${spell(key)} major</b>: ${names.join(" · ")}<br>` +
        `Selected <b>${p.d.rn} = ${name}</b>, root on the ${STRING_NAMES[p.st]} string at fret ${p.f}.`;
    };
    fb.layout();
  });
})();
