// Scale widgets: tetrachords, the moving modal window, the tetrachord combination matrix,
// and violin left-hand frames.
(function () {
  "use strict";
  const M = window.Musifold;
  const { svg, el, canvas, controls, button, toggleGroup, caption } = M;

  // Calls stop() when the widget leaves the screen: scrolled out of view on the page, or another slide in a deck
  // (reveal.js keeps hidden slides "intersecting", so listen for its slidechanged event as well).
  function onLeave(root, stop) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => entries.forEach((e) => { if (!e.isIntersecting) stop(); })).observe(root);
    }
    const slide = root.closest(".reveal .slides section");
    if (slide) slide.closest(".reveal").addEventListener("slidechanged", () => { if (!slide.classList.contains("present")) stop(); });
  }

  const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
  const isWhite = (m) => WHITE_PCS.includes(M.mod(m, 12));

  // Draw a piano strip from midi `from` to `to` (both white keys). Returns key info by midi.
  function keyboard(parent, { x, y, from, to, w = 34, h = 110 }) {
    const g = svg("g", {}, parent);
    const keys = new Map();
    let wx = x;
    for (let m = from; m <= to; m++) {
      if (!isWhite(m)) continue;
      const rect = svg("rect", { x: wx, y, width: w, height: h, rx: 3, fill: "#fff", stroke: "#9aa5b1" }, g);
      keys.set(m, { rect, cx: wx + w / 2, black: false, base: "#fff", x: wx });
      wx += w;
    }
    for (let m = from; m <= to; m++) {
      if (isWhite(m)) continue;
      const left = keys.get(m - 1);
      if (!left) continue;
      const bw = w * 0.6;
      const rect = svg("rect", { x: left.x + w - bw / 2, y, width: bw, height: h * 0.62, rx: 2, fill: "#2b333b", stroke: "#2b333b" }, g);
      keys.set(m, { rect, cx: left.x + w, black: true, base: "#2b333b", x: left.x + w - bw / 2 });
    }
    return { g, keys, width: wx - x };
  }

  function paint(kb, midi, color) {
    const k = kb.keys.get(midi);
    if (k) k.rect.setAttribute("fill", color || k.base);
  }

  const stepLetter = (d) => (d === 1 ? "H" : d === 2 ? "W" : d === 3 ? "W+H" : `${d}`);

  // ------------------------------------------------------------------
  // The four pedagogical tetrachords.
  // ------------------------------------------------------------------
  const TETRA = [
    { name: "Ionian", steps: [2, 2, 1], color: "#2f6fdf" },
    { name: "Dorian", steps: [2, 1, 2], color: "#2a9d6f" },
    { name: "Phrygian", steps: [1, 2, 2], color: "#a347c4" },
    { name: "Lydian", steps: [2, 2, 2], color: "#e0702b" },
  ];
  const offsets = (steps) => steps.reduce((acc, d) => [...acc, acc[acc.length - 1] + d], [0]);

  M.register("tetrachords", (root) => {
    const rowH = 84, W = 720, H = TETRA.length * rowH + 10;
    const s = canvas(root, W, H);
    const rows = TETRA.map((t, i) => {
      const y = 12 + i * rowH;
      const g = svg("g", { class: "mf-clickable" }, s);
      svg("rect", { x: 2, y: y - 4, width: W - 4, height: rowH - 6, rx: 8, fill: t.color, opacity: 0.06 }, g);
      svg("text", { x: 16, y: y + 24, "font-size": 17, "font-weight": 700, fill: t.color, text: t.name }, g);
      svg("text", { x: 16, y: y + 46, "font-size": 14, text: t.steps.map(stepLetter).join(" – ") }, g);
      const kb = keyboard(g, { x: 170, y, from: 60, to: 67, w: 30, h: 66 });
      const offs = offsets(t.steps);
      const notes = offs.map((o) => 60 + o);
      notes.forEach((m) => paint(kb, m, M.mod(m, 12) === 0 ? t.color : t.color + "99"));
      // step arcs to the right of the keyboard, drawn as a mini number line
      const nx0 = 380, unit = 34;
      svg("line", { x1: nx0, y1: y + 40, x2: nx0 + 6 * unit, y2: y + 40, stroke: "#d9dee4" }, g);
      for (let k = 0; k <= 6; k++) svg("circle", { cx: nx0 + k * unit, cy: y + 40, r: 2, fill: "#c3cad3" }, g);
      const dots = offs.map((o, j) => {
        if (j > 0) {
          const xa = nx0 + offs[j - 1] * unit, xb = nx0 + o * unit;
          svg("path", { d: `M${xa} ${y + 34} Q${(xa + xb) / 2} ${y + 34 - 12 * t.steps[j - 1]} ${xb} ${y + 34}`, fill: "none", stroke: t.color, "stroke-width": 2 }, g);
          svg("text", { x: (xa + xb) / 2, y: y + 22 - 6 * t.steps[j - 1] + 6, "font-size": 12, "font-weight": 700, "text-anchor": "middle", fill: t.color, text: stepLetter(t.steps[j - 1]) }, g);
        }
        svg("text", { x: nx0 + o * unit, y: y + 60, "font-size": 12, "text-anchor": "middle", text: M.pcName(o).replace("E♭", "E♭").replace("C♯", "D♭") }, g);
        return svg("circle", { cx: nx0 + o * unit, cy: y + 40, r: 7, fill: t.color }, g);
      });
      const span = offs[3];
      svg("text", { x: W - 14, y: y + 44, "font-size": 12, "text-anchor": "end", fill: "#6b7785", text: span === 5 ? "spans a perfect 4th" : "spans a tritone" }, g);
      const row = { t, notes, dots, kb, playAt: -1e9 };
      g.addEventListener("click", () => playRow(row));
      return row;
    });

    function playRow(row, at = 0) {
      M.sequence(row.notes.map(M.midiToHz), { step: 0.32, dur: 0.45, at });
      setTimeout(() => (row.playAt = performance.now()), at * 1000);
    }

    const ctl = controls(root);
    button(ctl, "▶ Play all four", () => rows.forEach((r, i) => playRow(r, i * 1.6)));
    caption(root, "Click a row to hear it. Three of the patterns span a perfect fourth (5 semitones); only the position of the half step changes. The Lydian pattern is all whole steps and stretches to a tritone.");

    M.animate(root, () => {
      const now = performance.now();
      rows.forEach((r) => {
        const age = (now - r.playAt) / 320;
        r.dots.forEach((d, j) => {
          const hit = age >= j && age < j + 1.2;
          d.setAttribute("r", hit ? 11 : 7);
        });
      });
    });
  });

  // ------------------------------------------------------------------
  // The moving window: seven modes on the white keys.
  // ------------------------------------------------------------------
  const MODES = [
    { name: "Ionian", note: "the major scale" },
    { name: "Dorian", note: "minor with a bright, raised 6th" },
    { name: "Phrygian", note: "minor with a dark ♭2" },
    { name: "Lydian", note: "major with a raised ♯4" },
    { name: "Mixolydian", note: "major with a ♭7" },
    { name: "Aeolian", note: "the natural minor scale" },
    { name: "Locrian", note: "diminished 5th above the tonic, so the tonic never feels settled" },
  ];

  M.register("mode-window", (root) => {
    const W = 720, H = 250, kx = 60, ky = 64, kw = 40;
    const s = canvas(root, W, H);
    const kb = keyboard(s, { x: kx, y: ky, from: 48, to: 72, w: kw, h: 120 });
    const whites = [...kb.keys.entries()].filter(([, k]) => !k.black).map(([m]) => m); // 15 keys C3..C5
    whites.forEach((m) => svg("text", { x: kb.keys.get(m).cx, y: ky + 112, "font-size": 12, "text-anchor": "middle", fill: "#6b7785", text: M.pcName(m) }, s));
    // W/H letters for every gap between consecutive white keys
    const gaps = [];
    for (let i = 0; i < whites.length - 1; i++) {
      const d = whites[i + 1] - whites[i];
      gaps.push(svg("text", { x: kx + (i + 1) * kw, y: ky + 142, "font-size": 14, "font-weight": 700, "text-anchor": "middle", fill: d === 1 ? "#e0702b" : "#2f6fdf", opacity: 0.25, text: stepLetter(d) }, s));
    }
    const win = svg("rect", { x: kx, y: ky - 8, width: kw * 8, height: 136, rx: 8, fill: "rgba(47,111,223,0.12)", stroke: "#2f6fdf", "stroke-width": 2.5 }, s);
    const title = svg("text", { x: kx, y: 30, "font-size": 18, "font-weight": 700, fill: "#2f6fdf" }, s);
    const sub = svg("text", { x: kx, y: 50, "font-size": 13, fill: "#52606d" }, s);
    const marker = svg("circle", { cx: 0, cy: ky + 92, r: 8, fill: "#e0702b", opacity: 0 }, s);
    const pattern = svg("text", { x: kx, y: ky + 172, "font-size": 14, fill: "#1f2933" }, s);

    let cur = 0, from = 0, t = 1, playStart = -1e9, cycling = null;
    const ctl = controls(root);
    const group = toggleGroup(ctl, MODES.map((m) => m.name), (i) => go(i));
    const ctl2 = controls(root);
    button(ctl2, "▶ Play scale", () => playScale());
    const stopCycle = () => { if (cycling) { clearInterval(cycling); cycling = null; } cycleBtn.classList.remove("mf-on"); };
    const cycleBtn = button(ctl2, "⟳ Cycle through all", () => {
      if (cycling) { stopCycle(); return; }
      cycleBtn.classList.add("mf-on");
      const next = () => { go((cur + 1) % 7); group.select(cur, false); playScale(); };
      playScale();
      cycling = setInterval(next, 3600);
    });
    // The cycle must not keep playing once the widget is off screen (another slide, scrolled away).
    onLeave(root, stopCycle);
    caption(root, "Slide an eight-note window along the white keys. The keys never change, but starting on a different degree moves the two half steps (H) to new places in the scale, and that changes its character.");

    function go(i) { from = M.lerp(from, cur, Math.min(1, t)); cur = i; t = 0; label(); }
    function notes() { return whites.slice(cur, cur + 8); }
    function playScale() {
      M.sequence(notes().map(M.midiToHz), { step: 0.3, dur: 0.4 });
      playStart = performance.now();
    }
    function label() {
      const m = MODES[cur];
      title.textContent = `${m.name} — starts on ${M.pcName(whites[cur])}`;
      sub.textContent = m.note;
      const n = notes();
      pattern.textContent = "Steps: " + n.slice(1).map((x, i) => stepLetter(x - n[i])).join(" ");
    }
    label();

    M.animate(root, (time, dt) => {
      t = Math.min(1, t + dt * 2.2);
      const pos = M.lerp(from, cur, M.ease(t));
      win.setAttribute("x", kx + pos * kw);
      title.setAttribute("x", kx + pos * kw);
      sub.setAttribute("x", kx + pos * kw);
      pattern.setAttribute("x", kx + pos * kw);
      gaps.forEach((g, i) => g.setAttribute("opacity", i >= cur && i < cur + 7 && t >= 1 ? 1 : 0.25));
      const age = (performance.now() - playStart) / 300;
      if (age >= 0 && age < 8) {
        const k = kb.keys.get(notes()[Math.floor(age)]);
        marker.setAttribute("cx", k.cx);
        marker.setAttribute("opacity", 1);
      } else marker.setAttribute("opacity", 0);
    });
  });

  // ------------------------------------------------------------------
  // Lower tetrachord × upper tetrachord.
  // ------------------------------------------------------------------
  const SCALE_NAMES = {
    WWHWWWH: ["Ionian (major)", true],
    WHWWWHW: ["Dorian", true],
    HWWWHWW: ["Phrygian", true],
    WWWHWWH: ["Lydian", true],
    WWHWWHW: ["Mixolydian", true],
    WHWWHWW: ["Aeolian (minor)", true],
    HWWHWWW: ["Locrian", true],
    WHWWWWH: ["Melodic minor", false],
    HWWWWHW: ["Dorian ♭2", false],
    WWWHWHW: ["Lydian dominant", false],
    WWHWHWW: ["Mixolydian ♭6", false],
    WHWHWWW: ["Locrian ♮2", false],
    HWWWWWH: ["Neapolitan major", false],
    WWHHWWW: ["Major Locrian", false],
    WWWHHWW: ["Lydian minor", false],
  };

  function combine(a, b) {
    const span = (t) => t.steps.reduce((x, y) => x + y, 0);
    const joint = 12 - span(a) - span(b);
    if (joint <= 0) return null;
    const steps = [...a.steps, joint, ...b.steps];
    const key = steps.map(stepLetter).join("");
    const [name, diatonic] = SCALE_NAMES[key] || ["(unnamed)", false];
    return { steps, joint, name, diatonic };
  }

  M.register("tetrachord-matrix", (root) => {
    const W = 720, H = 350, gx = 170, gy = 44, cw = 130, ch = 42;
    const s = canvas(root, W, H);
    svg("text", { x: gx + 2 * cw, y: 16, "font-size": 12, "text-anchor": "middle", fill: "#6b7785", text: "upper tetrachord →" }, s);
    svg("text", { x: 14, y: 30, "font-size": 12, fill: "#6b7785", text: "lower tetrachord ↓" }, s);
    TETRA.forEach((t, j) => svg("text", { x: gx + j * cw + cw / 2, y: gy - 8, "font-size": 13, "font-weight": 700, "text-anchor": "middle", fill: t.color, text: t.name }, s));
    const cells = [];
    TETRA.forEach((a, i) => {
      svg("text", { x: gx - 10, y: gy + i * ch + ch / 2 + 5, "font-size": 13, "font-weight": 700, "text-anchor": "end", fill: a.color, text: a.name }, s);
      TETRA.forEach((b, j) => {
        const res = combine(a, b);
        const g = svg("g", { class: res ? "mf-clickable" : "" }, s);
        const fill = !res ? "#f0f2f4" : res.diatonic ? "#dce8fb" : "#fbe7da";
        const rect = svg("rect", { x: gx + j * cw + 2, y: gy + i * ch + 2, width: cw - 4, height: ch - 4, rx: 6, fill, stroke: "#fff", "stroke-width": 2 }, g);
        svg("text", { x: gx + j * cw + cw / 2, y: gy + i * ch + ch / 2 + 5, "font-size": 12, "text-anchor": "middle", fill: res ? "#1f2933" : "#9aa5b1", text: res ? res.name : "too wide" }, g);
        if (res) g.addEventListener("click", () => select(i, j, true));
        cells.push({ i, j, rect, res });
      });
    });
    // legend
    svg("rect", { x: 14, y: 60, width: 12, height: 12, rx: 3, fill: "#dce8fb" }, s);
    svg("text", { x: 32, y: 70, "font-size": 11, fill: "#52606d", text: "diatonic mode" }, s);
    svg("rect", { x: 14, y: 80, width: 12, height: 12, rx: 3, fill: "#fbe7da" }, s);
    svg("text", { x: 32, y: 90, "font-size": 11, fill: "#52606d", text: "other scale" }, s);

    const ky = 240;
    const kb = keyboard(s, { x: 60, y: ky, from: 60, to: 72, w: 36, h: 100 });
    const info = svg("text", { x: 380, y: ky + 22, "font-size": 16, "font-weight": 700 }, s);
    const stepsLine = svg("g", {}, s);
    const noteLine = svg("text", { x: 380, y: ky + 92, "font-size": 13, fill: "#52606d" }, s);
    const marker = svg("circle", { cx: 0, cy: ky + 84, r: 7, fill: "#1f2933", opacity: 0 }, s);

    let notes = [], playStart = -1e9;
    function select(i, j, sound) {
      const res = combine(TETRA[i], TETRA[j]);
      cells.forEach((c) => c.rect.setAttribute("stroke", c.i === i && c.j === j ? "#1f2933" : "#fff"));
      kb.keys.forEach((k, m) => paint(kb, m));
      notes = [60];
      res.steps.forEach((d) => notes.push(notes[notes.length - 1] + d));
      notes.forEach((m, n) => paint(kb, m, n <= 3 ? TETRA[i].color : TETRA[j].color));
      info.textContent = `${TETRA[i].name} + ${TETRA[j].name} = ${res.name}`;
      stepsLine.innerHTML = "";
      let x = 380;
      res.steps.forEach((d, n) => {
        const color = n < 3 ? TETRA[i].color : n === 3 ? "#6b7785" : TETRA[j].color;
        const label = n === 3 ? `[${stepLetter(d)}]` : stepLetter(d);
        const tnode = svg("text", { x, y: ky + 54, "font-size": 18, "font-weight": 700, fill: color, text: label }, stepsLine);
        x += n === 3 ? 44 : 30;
        return tnode;
      });
      svg("text", { x: 380, y: ky + 72, "font-size": 11, fill: "#6b7785", text: "lower · [joining step] · upper" }, stepsLine);
      noteLine.textContent = notes.map(M.pcName).join(" ");
      if (sound) { M.sequence(notes.map(M.midiToHz), { step: 0.28, dur: 0.38 }); playStart = performance.now(); }
    }
    select(0, 0, false);

    const ctl = controls(root);
    button(ctl, "▶ Play selected", () => { M.sequence(notes.map(M.midiToHz), { step: 0.28, dur: 0.38 }); playStart = performance.now(); });
    caption(root, "Click a cell to build that scale on C and hear it. The joining step is whatever is left to complete the octave: a whole step normally, a half step when one half is Lydian. Two Lydian tetrachords already fill a whole octave, so they cannot be combined.");

    M.animate(root, () => {
      const age = (performance.now() - playStart) / 280;
      if (age >= 0 && age < notes.length) {
        marker.setAttribute("cx", kb.keys.get(notes[Math.floor(age)]).cx);
        marker.setAttribute("cy", kb.keys.get(notes[Math.floor(age)]).black ? ky + 50 : ky + 84);
        marker.setAttribute("opacity", 1);
      } else marker.setAttribute("opacity", 0);
    });
  });

  // ------------------------------------------------------------------
  // Violin: tetrachords as left-hand frames.
  // ------------------------------------------------------------------
  const STRINGS = [
    { name: "E", midi: 76 },
    { name: "A", midi: 69 },
    { name: "D", midi: 62 },
    { name: "G", midi: 55 },
  ];

  M.register("violin-frames", (root) => {
    const W = 720, H = 290, nut = 70, scale = 1700, sy0 = 50, sgap = 46;
    const xOf = (k) => nut + scale * (1 - Math.pow(2, -k / 12)); // true finger spacing
    const s = canvas(root, W, H);
    svg("rect", { x: nut - 4, y: sy0 - 22, width: xOf(8) - nut + 30, height: 3 * sgap + 44, rx: 10, fill: "#3a2a20", opacity: 0.9 }, s);
    svg("rect", { x: nut - 8, y: sy0 - 22, width: 8, height: 3 * sgap + 44, fill: "#e8dcc8" }, s);
    for (let k = 1; k <= 7; k++) {
      svg("line", { x1: xOf(k), y1: sy0 - 16, x2: xOf(k), y2: sy0 + 3 * sgap + 16, stroke: "#ffffff", opacity: 0.12, "stroke-dasharray": "3 4" }, s);
    }
    STRINGS.forEach((st, i) => {
      const y = sy0 + i * sgap;
      svg("line", { x1: nut, y1: y, x2: xOf(8) + 26, y2: y, stroke: "#d9cbb3", "stroke-width": 1.4 + i * 0.5 }, s);
      svg("text", { x: nut - 18, y: y + 5, "font-size": 15, "font-weight": 700, "text-anchor": "end", text: st.name }, s);
    });
    svg("text", { x: nut, y: 18, "font-size": 12, fill: "#6b7785", text: "nut" }, s);
    svg("text", { x: xOf(5), y: 18, "font-size": 12, fill: "#6b7785", "text-anchor": "middle", text: "finger spacing is drawn to scale: half steps get smaller up the string" }, s);

    const frame = svg("rect", { x: nut, y: 0, width: 0, height: 34, rx: 17, fill: "rgba(47,111,223,0.18)", stroke: "#7fa3e8" }, s);
    const fingers = [0, 1, 2, 3].map((f) => {
      const g = svg("g", {}, s);
      const c = svg("circle", { r: f === 0 ? 9 : 13, fill: f === 0 ? "none" : "#2f6fdf", stroke: "#fff", "stroke-width": 2 }, g);
      const label = svg("text", { "font-size": 13, "font-weight": 700, "text-anchor": "middle", fill: "#fff", text: f === 0 ? "0" : `${f}` }, g);
      const name = svg("text", { "font-size": 13, "text-anchor": "middle", fill: "#1f2933" }, s);
      return { g, c, label, name, x: nut, y: sy0, tx: nut, ty: sy0, hot: 0 };
    });
    const touch = svg("text", { "font-size": 12, "text-anchor": "middle", fill: "#e0702b", "font-weight": 700, text: "touching" }, s);

    let pat = 0, str = 1;
    const ctl = controls(root);
    toggleGroup(ctl, TETRA.map((t) => `${t.name} ${t.steps.map(stepLetter).join("")}`), (i) => { pat = i; place(true); });
    const ctl2 = controls(root);
    el("span", { class: "mf-readout", text: "String:" }, ctl2);
    toggleGroup(ctl2, STRINGS.slice().reverse().map((x) => x.name), (i) => { str = 3 - i; place(true); }, 2);
    button(ctl2, "▶ Play", () => play());
    const readout = el("div", { class: "mf-readout" }, root);
    caption(root, "The same four-finger shape works on every string, only the note names change. On the next string up, the frame starts a whole step above your 3rd finger, so lower tetrachord + whole step + upper tetrachord becomes a two-string scale.");

    function place(sound) {
      const offs = offsets(TETRA[pat].steps);
      const y = sy0 + str * sgap;
      fingers.forEach((f, i) => { f.tx = i === 0 ? nut - 0 : xOf(offs[i]); f.ty = y; f.name.textContent = M.pcName(STRINGS[str].midi + offs[i]); });
      const half = TETRA[pat].steps.findIndex((d, i) => d === 1 && i > 0);
      touch.dataset.idx = half;
      readout.innerHTML = `${TETRA[pat].name} frame on the ${STRINGS[str].name} string: <b>${offs.map((o) => M.pcName(STRINGS[str].midi + o)).join(" – ")}</b> (${TETRA[pat].steps.map(stepLetter).join(" ")}). ` +
        (pat === 3 ? "The 3rd finger reaches a whole step further: an extended frame." : TETRA[pat].steps[0] === 1 ? "Low 1st finger, close to the nut." : `Half step between fingers ${TETRA[pat].steps.indexOf(1)} and ${TETRA[pat].steps.indexOf(1) + 1}: those two fingers touch.`);
      if (sound) play();
    }
    function play() {
      const offs = offsets(TETRA[pat].steps);
      offs.forEach((o, i) => {
        M.tone(M.midiToHz(STRINGS[str].midi + o), { at: i * 0.35, dur: 0.5 });
        setTimeout(() => (fingers[i].hot = 1), i * 350);
      });
    }
    place(false);
    fingers.forEach((f) => { f.x = f.tx; f.y = f.ty; });

    M.animate(root, (t, dt) => {
      const k = 1 - Math.pow(0.001, dt);
      fingers.forEach((f, i) => {
        f.x += (f.tx - f.x) * k;
        f.y += (f.ty - f.y) * k;
        f.hot = Math.max(0, f.hot - dt * 2);
        f.c.setAttribute("cx", f.x);
        f.c.setAttribute("cy", f.y);
        f.c.setAttribute("r", (i === 0 ? 9 : 13) + f.hot * 5);
        f.label.setAttribute("x", f.x);
        f.label.setAttribute("y", f.y + 5);
        f.name.setAttribute("x", f.x);
        f.name.setAttribute("y", sy0 + 3 * sgap + 44);
      });
      frame.setAttribute("x", fingers[0].x - 14);
      frame.setAttribute("y", fingers[0].y - 17);
      frame.setAttribute("width", fingers[3].x - fingers[0].x + 28);
      const idx = Number(touch.dataset.idx);
      if (idx > 0) {
        touch.setAttribute("opacity", 1);
        touch.setAttribute("x", (fingers[idx].x + fingers[idx + 1].x) / 2);
        touch.setAttribute("y", fingers[idx].y - 22);
      } else touch.setAttribute("opacity", 0);
    });
  });
})();
