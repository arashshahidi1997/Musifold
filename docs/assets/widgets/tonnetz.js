// Harmony widgets: the Tonnetz (explore / progression / walk modes) and V7 → I resolution.
(function () {
  "use strict";
  const M = window.Musifold;
  const { svg, el, canvas, controls, button, toggleGroup, caption, mod } = M;

  const MAJOR = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const MINOR = ["Cm", "C♯m", "Dm", "E♭m", "Em", "Fm", "F♯m", "Gm", "G♯m", "Am", "B♭m", "Bm"];

  // Spell a triad from its root letter: root, 3rd two letters up, 5th four letters up.
  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"], LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  function spellTriad(t) {
    const rootName = (t.major ? MAJOR : MINOR)[t.root].replace(/m$/, "");
    const li = LETTERS.indexOf(rootName[0]);
    return [[0, 0], [t.major ? 4 : 3, 2], [7, 4]].map(([semis, steps]) => {
      const l = (li + steps) % 7;
      const d = mod(t.root + semis - LETTER_PC[l] + 6, 12) - 6;
      return LETTERS[l] + ({ "-2": "♭♭", "-1": "♭", 0: "", 1: "♯", 2: "♯♯" })[d];
    });
  }

  const triadPcs = (t) => (t.major ? [t.root, t.root + 4, t.root + 7] : [t.root, t.root + 3, t.root + 7]).map((p) => mod(p, 12));
  const triadName = (t) => (t.major ? MAJOR[t.root] : MINOR[t.root]);
  const sameTriad = (a, b) => a.major === b.major && a.root === b.root;

  function parseTriad(name) {
    const minor = name.endsWith("m");
    const base = minor ? name.slice(0, -1) : name;
    const alias = { "C♯": 1, "Db": 1, "D♭": 1, "D♯": 3, "Eb": 3, "E♭": 3, "Gb": 6, "G♭": 6, "F♯": 6, "F#": 6, "G♯": 8, "Ab": 8, "A♭": 8, "A♯": 10, "Bb": 10, "B♭": 10, "C#": 1, "G#": 8 };
    const plain = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const root = base in alias ? alias[base] : plain[base];
    return { root, major: !minor };
  }

  // Smallest total semitone motion that takes the notes of one triad to another.
  function voiceLeading(a, b) {
    const pa = triadPcs(a), pb = triadPcs(b);
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    const dist = (x, y) => Math.min(mod(x - y, 12), mod(y - x, 12));
    let best = Infinity;
    perms.forEach((p) => { best = Math.min(best, dist(pa[0], pb[p[0]]) + dist(pa[1], pb[p[1]]) + dist(pa[2], pb[p[2]])); });
    const common = pa.filter((x) => pb.includes(x)).length;
    return { semis: best, common };
  }

  // The three neo-Riemannian neighbours, each sharing an edge (two notes).
  function neighbours(t) {
    return t.major
      ? [{ op: "P", t: { root: t.root, major: false } }, { op: "R", t: { root: mod(t.root + 9, 12), major: false } }, { op: "L", t: { root: mod(t.root + 4, 12), major: false } }]
      : [{ op: "P", t: { root: t.root, major: true } }, { op: "R", t: { root: mod(t.root + 3, 12), major: true } }, { op: "L", t: { root: mod(t.root + 8, 12), major: true } }];
  }

  // Name a neighbour of t from t's own letters: its root letter is a third (two letters) up or down from t's
  // root letter, so the L-neighbour of B major is D♯m, not E♭m.
  function neighbourName(t, n) {
    const li = LETTERS.indexOf((t.major ? MAJOR : MINOR)[t.root][0]);
    const up = (n.op === "L") === t.major || (n.op === "R" && !t.major);
    const l = n.op === "P" ? li : mod(li + (up ? 2 : -2), 7);
    const d = mod(n.t.root - LETTER_PC[l] + 6, 12) - 6;
    return LETTERS[l] + ({ "-2": "♭♭", "-1": "♭", 0: "", 1: "♯", 2: "♯♯" })[d] + (n.t.major ? "" : "m");
  }

  function voicing(t) {
    let r = 60 + t.root;
    if (r > 66) r -= 12;
    return [r, r + (t.major ? 4 : 3), r + 7].map(M.midiToHz);
  }

  // Lattice: x along fifths, diagonals along thirds. pc(i, j) = 7i + 4j.
  function buildLattice(s, { cols = 10, rows = 5, size = 62, x0 = 56, y0 = 0 }) {
    const h = size * Math.sqrt(3) / 2;
    const base = y0 + (rows - 1) * h + 24;
    const nodes = new Map();
    const key = (i, j) => `${i},${j}`;
    for (let j = 0; j < rows; j++) {
      const iMin = -Math.floor(j / 2);
      for (let i = iMin; i < iMin + cols; i++) {
        nodes.set(key(i, j), { i, j, pc: mod(7 * i + 4 * j, 12), x: x0 + size * (i + j / 2), y: base - h * j });
      }
    }
    const triLayer = svg("g", {}, s);
    const edgeLayer = svg("g", { "pointer-events": "none" }, s);
    const pathLayer = svg("g", { "pointer-events": "none" }, s);
    const nodeLayer = svg("g", {}, s);
    const tris = [];
    nodes.forEach((n) => {
      const a = nodes.get(key(n.i + 1, n.j)), b = nodes.get(key(n.i, n.j + 1)), c = nodes.get(key(n.i + 1, n.j + 1));
      if (a && b) tris.push({ pts: [n, a, b], triad: { root: n.pc, major: true } });
      if (a && b && c) tris.push({ pts: [a, b, c], triad: { root: mod(n.pc + 4, 12), major: false } });
      [[a, "#2f6fdf"], [b, "#e0702b"]].forEach(([m, color]) => {
        if (m) svg("line", { x1: n.x, y1: n.y, x2: m.x, y2: m.y, stroke: color, "stroke-width": 1.5, opacity: 0.35 }, edgeLayer);
      });
      const ul = nodes.get(key(n.i - 1, n.j + 1));
      if (ul) svg("line", { x1: n.x, y1: n.y, x2: ul.x, y2: ul.y, stroke: "#2a9d6f", "stroke-width": 1.5, opacity: 0.35 }, edgeLayer);
    });
    tris.forEach((t) => {
      t.cx = (t.pts[0].x + t.pts[1].x + t.pts[2].x) / 3;
      t.cy = (t.pts[0].y + t.pts[1].y + t.pts[2].y) / 3;
      t.poly = svg("polygon", { points: t.pts.map((p) => `${p.x},${p.y}`).join(" "), fill: t.triad.major ? "#2f6fdf" : "#a347c4", opacity: 0.04, class: "mf-clickable" }, triLayer);
      t.label = svg("text", { x: t.cx, y: t.cy + 4, "font-size": 11, "text-anchor": "middle", fill: t.triad.major ? "#2f6fdf" : "#a347c4", opacity: 0, "pointer-events": "none", "font-weight": 700, text: triadName(t.triad) }, triLayer);
    });
    nodes.forEach((n) => {
      n.circle = svg("circle", { cx: n.x, cy: n.y, r: 14, fill: "#fff", stroke: "#9aa5b1" }, nodeLayer);
      svg("text", { x: n.x, y: n.y + 4, "font-size": 12, "text-anchor": "middle", "pointer-events": "none", text: M.pcName(n.pc) }, nodeLayer);
    });
    return { nodes, tris, pathLayer, height: base + 24 };
  }

  function nearestTri(tris, triad, x, y) {
    let best = null, bd = Infinity;
    tris.forEach((t) => {
      if (!sameTriad(t.triad, triad)) return;
      const d = Math.hypot(t.cx - x, t.cy - y);
      if (d < bd) { bd = d; best = t; }
    });
    return best;
  }

  function arrow(layer, a, b, color = "#1f2933", width = 2.5) {
    const dx = b.cx - a.cx, dy = b.cy - a.cy, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const x2 = b.cx - ux * 9, y2 = b.cy - uy * 9;
    svg("line", { x1: a.cx + ux * 6, y1: a.cy + uy * 6, x2, y2, stroke: color, "stroke-width": width, "stroke-linecap": "round" }, layer);
    svg("path", { d: `M${x2 + ux * 6} ${y2 + uy * 6} L${x2 - uy * 5} ${y2 + ux * 5} L${x2 + uy * 5} ${y2 - ux * 5}Z`, fill: color }, layer);
  }

  const PROGRESSIONS = [
    { label: "I–vi–IV–ii–V–I", chords: ["C", "Am", "F", "Dm", "G", "C"] },
    { label: "Hexatonic cycle", chords: ["C", "Cm", "A♭", "A♭m", "E", "Em", "C"] },
    { label: "Fifths: C–G–D–A", chords: ["C", "G", "D", "A"] },
  ];

  M.register("tonnetz", (root, opts) => {
    const mode = opts.mode || "explore";
    const W = 720, H = 290;
    const s = canvas(root, W, H);
    const L = buildLattice(s, { y0: 4 });
    // legend
    const lg = svg("g", {}, s);
    [["#2f6fdf", "fifth"], ["#e0702b", "major 3rd"], ["#2a9d6f", "minor 3rd"]].forEach(([c, t], i) => {
      svg("line", { x1: 56 + i * 110, y1: 278, x2: 76 + i * 110, y2: 278, stroke: c, "stroke-width": 3 }, lg);
      svg("text", { x: 82 + i * 110, y: 282, "font-size": 11, fill: "#52606d", text: t }, lg);
    });

    const readout = el("div", { class: "mf-readout" }, root);
    const highlight = new Set();
    function paint() {
      L.tris.forEach((t) => {
        const on = highlight.has(t);
        t.poly.setAttribute("opacity", on ? 0.55 : t.soft ? 0.18 : 0.04);
        t.label.setAttribute("opacity", on || t.soft ? 1 : 0);
      });
    }

    let path = [];
    function clearPath() { path = []; L.pathLayer.innerHTML = ""; highlight.clear(); L.tris.forEach((t) => (t.soft = false)); paint(); }

    if (mode === "explore") {
      L.tris.forEach((t) => t.poly.addEventListener("click", () => {
        highlight.clear(); L.tris.forEach((x) => (x.soft = false));
        highlight.add(t);
        const nb = neighbours(t.triad);
        nb.forEach((n) => { const nt = nearestTri(L.tris, n.t, t.cx, t.cy); if (nt) nt.soft = true; });
        paint();
        M.chord(voicing(t.triad), { dur: 1.6 });
        const notes = spellTriad(t.triad).join(" ");
        readout.innerHTML = `<b>${triadName(t.triad)}</b> = ${notes}. Its edge-neighbours each share two notes: ` +
          nb.map((n) => `${neighbourName(t.triad, n)} (${n.op})`).join(", ") + ".";
      }));
      readout.innerHTML = "Click any triangle. Upward triangles are major triads, downward ones are minor.";
      caption(root, "Each note sits a fifth from its horizontal neighbours and a third from its diagonal ones, so every triangle is a triad. The pattern repeats: the lattice really wraps around into a torus.");
    }

    if (mode === "walk") {
      L.tris.forEach((t) => t.poly.addEventListener("click", () => {
        const prev = path[path.length - 1];
        path.push(t);
        highlight.add(t);
        paint();
        if (prev) arrow(L.pathLayer, prev, t, "#1f2933");
        M.chord(voicing(t.triad), { dur: 1.4 });
        report();
      }));
      const ctl = controls(root);
      button(ctl, "▶ Replay walk", () => {
        path.forEach((t, i) => M.chord(voicing(t.triad), { at: i * 0.9, dur: 1 }));
      });
      button(ctl, "Clear", () => { clearPath(); report(); });
      function report() {
        if (!path.length) { readout.innerHTML = "Click triangles to walk from chord to chord."; return; }
        let total = 0;
        const steps = path.slice(1).map((t, i) => {
          const vl = voiceLeading(path[i].triad, t.triad);
          total += vl.semis;
          return vl.semis;
        });
        const avg = steps.length ? (total / steps.length).toFixed(1) : "–";
        readout.innerHTML = `Path: ${path.map((t) => triadName(t.triad)).join(" → ")}<br>Voice movement per step: ${steps.join(", ") || "–"} semitones · total <b>${total}</b> · average <b>${avg}</b>`;
      }
      report();
      caption(root, "Try two walks to the same chord: one along neighbouring triangles, one with jumps. Neighbouring steps move one voice by one or two semitones; long jumps move more voices further, and they sound more abrupt.");
    }

    if (mode === "progression") {
      let prog = 0, timer = [], token = null, tokenFrom = null, tokenTo = null, tokenT = 1;
      token = svg("circle", { r: 10, fill: "#e0702b", stroke: "#fff", "stroke-width": 2, opacity: 0 }, s);
      const ctl = controls(root);
      toggleGroup(ctl, PROGRESSIONS.map((p) => p.label), (i) => { prog = i; run(); });
      button(ctl, "▶ Play", () => run());
      function run() {
        timer.forEach(clearTimeout);
        timer = [];
        clearPath();
        const chords = PROGRESSIONS[prog].chords.map(parseTriad);
        let tri = nearestTri(L.tris, chords[0], 330, 140);
        const route = [tri];
        for (let i = 1; i < chords.length; i++) {
          tri = nearestTri(L.tris, chords[i], tri.cx, tri.cy);
          route.push(tri);
        }
        const lines = [];
        route.forEach((t, i) => {
          timer.push(setTimeout(() => {
            if (i > 0) {
              arrow(L.pathLayer, route[i - 1], t, "#e0702b");
              tokenFrom = route[i - 1]; tokenTo = t; tokenT = 0;
              const vl = voiceLeading(route[i - 1].triad, t.triad);
              lines.push(`${triadName(route[i - 1].triad)} → ${triadName(t.triad)}: ${vl.common} common tone${vl.common === 1 ? "" : "s"}, voices move <b>${vl.semis}</b> semitone${vl.semis === 1 ? "" : "s"}`);
            } else {
              tokenFrom = tokenTo = t; tokenT = 1;
            }
            highlight.add(t);
            paint();
            M.chord(voicing(t.triad), { dur: 1.1 });
            readout.innerHTML = lines.slice(-3).join("<br>") || `Start on <b>${triadName(t.triad)}</b>`;
          }, i * 1300));
        });
      }
      M.animate(root, (t, dt) => {
        if (!tokenTo) return;
        tokenT = Math.min(1, tokenT + dt * 2.4);
        const e = M.ease(tokenT);
        token.setAttribute("cx", M.lerp(tokenFrom.cx, tokenTo.cx, e));
        token.setAttribute("cy", M.lerp(tokenFrom.cy, tokenTo.cy, e));
        token.setAttribute("opacity", 1);
      });
      readout.innerHTML = "Pick a progression and press Play.";
      caption(root, "Smooth progressions take short steps on the lattice. Each step of the hexatonic cycle flips a triangle across one edge, so only one voice moves, by a single semitone. Moving by fifths (C–G–D–A) also crosses the lattice, but every step changes two notes.");
    }
  });

  // ------------------------------------------------------------------
  // V7 → I: voice-leading and shared overtones.
  // ------------------------------------------------------------------
  const VOICES = [
    { from: 43, to: 48, label: "bass: root down a 5th", color: "#52606d" },
    { from: 59, to: 60, label: "leading tone rises +1", color: "#e0702b", dy: 10 },
    { from: 62, to: 60, label: "D steps down −2", color: "#2a9d6f", dy: -6 },
    { from: 65, to: 64, label: "7th falls −1", color: "#a347c4" },
  ];

  M.register("resolution", (root) => {
    const W = 720, H = 320;
    const s = canvas(root, W, H);
    const ym = (m) => 300 - (m - 40) * 9.6;
    // left: voices on a pitch axis
    svg("text", { x: 20, y: 16, "font-size": 12, fill: "#6b7785", text: "voices (height = pitch)" }, s);
    for (let m = 41; m <= 66; m++) {
      if ([0, 4, 7].includes(mod(m, 12))) {
        svg("line", { x1: 40, y1: ym(m), x2: 300, y2: ym(m), stroke: "#eef0f3" }, s);
        svg("text", { x: 34, y: ym(m) + 4, "font-size": 10, "text-anchor": "end", fill: "#9aa5b1", text: M.midiName(m) }, s);
      }
    }
    svg("text", { x: 90, y: 38, "font-size": 16, "font-weight": 700, "text-anchor": "middle", text: "G⁷ (V⁷)" }, s);
    svg("text", { x: 230, y: 38, "font-size": 16, "font-weight": 700, "text-anchor": "middle", text: "C (I)" }, s);
    const movers = VOICES.map((v) => {
      svg("line", { x1: 90, y1: ym(v.from), x2: 230, y2: ym(v.to), stroke: v.color, "stroke-dasharray": "3 4", opacity: 0.6 }, s);
      svg("text", { x: 90 - 16, y: ym(v.from) + 4, "font-size": 11, "text-anchor": "end", fill: v.color, text: M.midiName(v.from) }, s);
      svg("text", { x: 230 + 16, y: ym(v.to) + 4 + (v.dy || 0), "font-size": 11, fill: v.color, text: v.label }, s);
      return { v, dot: svg("circle", { r: 8, fill: v.color, stroke: "#fff", "stroke-width": 2 }, s) };
    });

    // right: overtone ticks on a log-frequency axis
    const lx = (f) => 360 + (Math.log2(f / 90) / Math.log2(1800 / 90)) * 340;
    svg("text", { x: 360, y: 16, "font-size": 12, fill: "#6b7785", text: "overtones 1–6 of each chord (log frequency)" }, s);
    const rowV = 110, rowI = 220;
    svg("text", { x: 360, y: rowV - 50, "font-size": 13, "font-weight": 700, text: "G⁷" }, s);
    svg("text", { x: 360, y: rowI + 50, "font-size": 13, "font-weight": 700, text: "C" }, s);
    svg("line", { x1: 360, y1: rowV, x2: 700, y2: rowV, stroke: "#d9dee4" }, s);
    svg("line", { x1: 360, y1: rowI, x2: 700, y2: rowI, stroke: "#d9dee4" }, s);
    const partials = (midis) => midis.flatMap((m) => [1, 2, 3, 4, 5, 6].map((n) => ({ f: M.midiToHz(m) * n, n }))).filter((p) => p.f < 1800);
    const pv = partials(VOICES.map((v) => v.from));
    const pi = partials(VOICES.map((v) => v.to));
    const shareLayer = svg("g", {}, s);
    let shared = 0;
    const sharedFreqs = new Set();
    pv.forEach((a) => pi.forEach((b) => {
      if (Math.abs(M.cents(a.f / b.f)) < 15) {
        const key = Math.round(b.f);
        if (sharedFreqs.has(key)) return;
        sharedFreqs.add(key);
        shared++;
        svg("line", { x1: lx(a.f), y1: rowV, x2: lx(b.f), y2: rowI, stroke: "#2a9d6f", "stroke-width": 2, opacity: 0.5 }, shareLayer);
      }
    }));
    pv.forEach((p) => svg("line", { x1: lx(p.f), y1: rowV, x2: lx(p.f), y2: rowV - 36 / p.n - 4, stroke: "#2f6fdf", "stroke-width": 2 }, s));
    pi.forEach((p) => svg("line", { x1: lx(p.f), y1: rowI, x2: lx(p.f), y2: rowI + 36 / p.n + 4, stroke: "#e0702b", "stroke-width": 2 }, s));
    svg("text", { x: 530, y: (rowV + rowI) / 2 + 4, "font-size": 12, "text-anchor": "middle", fill: "#2a9d6f", text: `${shared} overtone pitches in common` }, s);
    svg("rect", { x: 470, y: (rowV + rowI) / 2 - 10, width: 120, height: 20, fill: "#f7f8fa", opacity: 0.8 }, shareLayer);

    const ctl = controls(root);
    let t0 = performance.now();
    button(ctl, "▶ Play V⁷ → I", () => {
      t0 = performance.now();
      M.chord(VOICES.map((v) => M.midiToHz(v.from)), { dur: 1.5, gain: 0.3 });
      M.chord(VOICES.map((v) => M.midiToHz(v.to)), { at: 1.6, dur: 2.2, gain: 0.3 });
    });
    caption(root, "B rises a half step to C and F falls a half step to E: the two dissonant notes of G⁷ each take the shortest way home. Green lines join overtones that G⁷ and C share, so part of the dominant's sound carries on into the tonic.");

    M.animate(root, () => {
      // loop: hold V (1.2s) → move (0.6s) → hold I (1.8s)
      const age = ((performance.now() - t0) / 1000) % 3.6;
      const p = M.ease(Math.max(0, Math.min(1, (age - 1.4) / 0.4)));
      movers.forEach(({ v, dot }) => {
        dot.setAttribute("cx", M.lerp(90, 230, p));
        dot.setAttribute("cy", M.lerp(ym(v.from), ym(v.to), p));
      });
    });
  });
})();
