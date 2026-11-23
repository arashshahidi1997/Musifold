// Acoustics widgets: harmonic series, beats, stacking fifths, the Pythagorean comma,
// the 4:5:6 triad, and pure vs equal-tempered intonation.
(function () {
  "use strict";
  const M = window.Musifold;
  const { svg, el, canvas, controls, button, toggleGroup, slider, caption } = M;

  // Calls stop() when the widget leaves the screen: scrolled out of view on the page, or another slide in a deck
  // (reveal.js keeps hidden slides "intersecting", so listen for its slidechanged event as well).
  function onLeave(root, stop) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => entries.forEach((e) => { if (!e.isIntersecting) stop(); })).observe(root);
    }
    const slide = root.closest(".reveal .slides section");
    if (slide) slide.closest(".reveal").addEventListener("slidechanged", () => { if (!slide.classList.contains("present")) stop(); });
  }

  const C3 = M.midiToHz(48);
  const C4 = M.midiToHz(60);

  // Nearest equal-tempered note name for a frequency, with the deviation in cents.
  function nearestNote(freq) {
    const m = 69 + 12 * Math.log2(freq / 440);
    const r = Math.round(m);
    const off = Math.round((m - r) * 100);
    return { name: M.midiName(r), off };
  }

  const fmtCents = (c) => (c > 0 ? "+" : c < 0 ? "−" : "±") + Math.abs(c).toFixed(1) + "¢";

  // ------------------------------------------------------------------
  // Harmonic series: a vibrating string's first eight modes.
  // ------------------------------------------------------------------
  const SERIES_INTERVALS = {
    2: "2:1 octave", 3: "3:2 fifth", 4: "4:3 fourth", 5: "5:4 major 3rd",
    6: "6:5 minor 3rd", 7: "7:6 (septimal)", 8: "8:7 (septimal)",
  };

  M.register("harmonic-series", (root) => {
    const N = 8, W = 720, rowH = 38, top = 26, H = top + N * rowH + 8;
    const x0 = 60, x1 = 440;
    const s = canvas(root, W, H);

    svg("text", { x: x0, y: 16, "font-size": 12, fill: "#6b7785", text: "string modes (click a row to hear it)" }, s);
    svg("text", { x: 470, y: 16, "font-size": 12, fill: "#6b7785", text: "freq." }, s);
    svg("text", { x: 548, y: 16, "font-size": 12, fill: "#6b7785", text: "nearest note" }, s);
    svg("text", { x: 640, y: 16, "font-size": 12, fill: "#6b7785", text: "vs. row above" }, s);

    const rows = [];
    for (let n = 1; n <= N; n++) {
      const yc = top + (n - 0.5) * rowH;
      const g = svg("g", { class: "mf-clickable" }, s);
      const bg = svg("rect", { x: 4, y: yc - rowH / 2 + 2, width: W - 8, height: rowH - 4, rx: 6, fill: "#2f6fdf", opacity: 0 }, g);
      svg("text", { x: 22, y: yc + 5, "font-size": 15, "font-weight": 600, text: `${n}` }, g);
      svg("line", { x1: x0, y1: yc, x2: x1, y2: yc, stroke: "#d9dee4" }, g);
      svg("circle", { cx: x0, cy: yc, r: 3, fill: "#6b7785" }, g);
      svg("circle", { cx: x1, cy: yc, r: 3, fill: "#6b7785" }, g);
      const path = svg("path", { fill: "none", stroke: "#2f6fdf", "stroke-width": 2 }, g);
      const freq = C3 * n;
      const note = nearestNote(freq);
      svg("text", { x: 470, y: yc + 5, "font-size": 13, text: `${n}f = ${Math.round(freq)} Hz` }, g);
      svg("text", {
        x: 548, y: yc + 5, "font-size": 13,
        text: note.name + (Math.abs(note.off) > 3 ? ` (${note.off > 0 ? "+" : "−"}${Math.abs(note.off)}¢)` : ""),
      }, g);
      if (SERIES_INTERVALS[n]) {
        svg("text", { x: 640, y: yc - rowH / 2 + 4, "font-size": 12, fill: n <= 6 ? "#e0702b" : "#6b7785", text: SERIES_INTERVALS[n] }, g);
      }
      g.addEventListener("click", () => {
        M.tone(freq, { dur: 1.4, partials: [1], gain: 0.25 });
        flash(n, 1.4);
      });
      rows.push({ n, yc, path, bg, hot: 0 });
    }

    function flash(n, seconds) {
      rows[n - 1].hot = Math.max(rows[n - 1].hot, seconds);
    }

    const ctl = controls(root);
    button(ctl, "▶ Play the full tone", () => {
      M.tone(C3, { dur: 2.5, partials: [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8], gain: 0.3 });
      rows.forEach((r) => flash(r.n, 2.5));
    });
    button(ctl, "▶ Climb the series", () => {
      rows.forEach((r, i) => {
        M.tone(C3 * r.n, { at: i * 0.45, dur: 0.6, partials: [1], gain: 0.25 });
        setTimeout(() => flash(r.n, 0.6), i * 450);
      });
    });
    caption(root, "Every mode fits a whole number of half-waves on the string, so its frequency is a whole-number multiple of the fundamental (here C3). Neighbouring modes form the simple ratios 2:1, 3:2, 4:3, 5:4…");

    M.animate(root, (t, dt) => {
      rows.forEach((r) => {
        const amp = 12 * Math.cos(2 * Math.PI * 0.35 * r.n * t);
        let d = "";
        for (let k = 0; k <= 96; k++) {
          const u = k / 96;
          const x = x0 + (x1 - x0) * u;
          const y = r.yc - amp * Math.sin(Math.PI * r.n * u);
          d += (k ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        }
        r.path.setAttribute("d", d);
        r.hot = Math.max(0, r.hot - dt);
        r.bg.setAttribute("opacity", Math.min(0.14, r.hot * 0.3));
      });
    });
  });

  // ------------------------------------------------------------------
  // Beats: two tones, their overtone spectra, and the beating of near-matches.
  // ------------------------------------------------------------------
  const BEAT_INTERVALS = [
    { label: "Unison 1:1", ratio: 1 },
    { label: "Octave 2:1", ratio: 2 },
    { label: "Fifth 3:2", ratio: 3 / 2 },
    { label: "Fourth 4:3", ratio: 4 / 3 },
    { label: "Major 3rd 5:4", ratio: 5 / 4 },
  ];

  M.register("beats", (root) => {
    const f1 = 220, P = 6, amps = M.RICH;
    const state = { iv: 2, detune: 6 };
    let drones = null;

    const ctl = controls(root);
    toggleGroup(ctl, BEAT_INTERVALS.map((b) => b.label), (i) => { state.iv = i; update(); }, state.iv);
    const ctl2 = controls(root);
    const detuneInput = slider(ctl2, "Mistune upper note", { min: -30, max: 30, step: 1, value: state.detune, oninput: (v) => { state.detune = v; update(); } });
    const detuneLabel = el("span", { class: "mf-readout" }, ctl2);
    const listen = button(ctl2, "▶ Listen", () => {
      if (drones) { drones.forEach((d) => d.stop()); drones = null; }
      else { drones = [M.drone(f1, { gain: 0.1 }), M.drone(upper(), { gain: 0.1 })]; }
      listen.textContent = drones ? "■ Stop" : "▶ Listen";
      listen.classList.toggle("mf-on", !!drones);
    });
    // A held tone must not keep sounding once the widget is off screen (another slide, scrolled away).
    onLeave(root, () => { if (drones) listen.click(); });
    button(ctl2, "Make it pure", () => { detuneInput.value = 0; state.detune = 0; update(); });

    const W = 720, H = 300;
    const s = canvas(root, W, H);
    const fx = (f) => 40 + (f / 1500) * 660;
    // frequency axis
    svg("line", { x1: 40, y1: 130, x2: 700, y2: 130, stroke: "#9aa5b1" }, s);
    for (let f = 0; f <= 1500; f += 250) {
      svg("line", { x1: fx(f), y1: 130, x2: fx(f), y2: 135, stroke: "#9aa5b1" }, s);
      svg("text", { x: fx(f), y: 148, "font-size": 11, "text-anchor": "middle", fill: "#6b7785", text: `${f} Hz` }, s);
    }
    svg("text", { x: 40, y: 18, "font-size": 12, fill: "#2f6fdf", text: "lower note: overtones" }, s);
    svg("text", { x: 40, y: 124, "font-size": 12, fill: "#e0702b", text: "upper note: overtones" }, s);
    const matchLayer = svg("g", {}, s);
    const lowLayer = svg("g", {}, s);
    const upLayer = svg("g", {}, s);

    svg("text", { x: 40, y: 178, "font-size": 12, fill: "#6b7785", text: "loudness of the matching overtones over the last 2 seconds (wobble = beating)" }, s);
    svg("line", { x1: 40, y1: 240, x2: 700, y2: 240, stroke: "#d9dee4" }, s);
    const env = svg("path", { fill: "rgba(42,157,111,0.25)", stroke: "#2a9d6f", "stroke-width": 1.5 }, s);
    const readout = el("div", { class: "mf-readout" }, root);
    caption(root, "When an overtone of one note lands close to an overtone of the other, the two interfere and the sound wobbles in loudness at their difference frequency. At a pure ratio the matching overtones coincide exactly and the wobble disappears.");

    let pairs = [];
    function upper() {
      return f1 * BEAT_INTERVALS[state.iv].ratio * Math.pow(2, state.detune / 1200);
    }

    function update() {
      const f2 = upper();
      if (drones) drones[1].set(f2);
      detuneLabel.textContent = `${state.detune > 0 ? "+" : ""}${state.detune}¢`;
      lowLayer.innerHTML = upLayer.innerHTML = matchLayer.innerHTML = "";
      for (let k = 1; k <= P; k++) {
        const h = 70 * amps[k - 1];
        svg("line", { x1: fx(f1 * k), y1: 30, x2: fx(f1 * k), y2: 30 + h, stroke: "#2f6fdf", "stroke-width": 3, "stroke-linecap": "round" }, lowLayer);
        const xu = fx(f2 * k);
        if (xu < 700) svg("line", { x1: xu, y1: 112, x2: xu, y2: 112 - h * 0.85, stroke: "#e0702b", "stroke-width": 3, "stroke-linecap": "round" }, upLayer);
      }
      pairs = [];
      for (let k = 1; k <= P; k++) {
        for (let m = 1; m <= P; m++) {
          const d = Math.abs(f1 * k - f2 * m);
          if (d < 30 && f1 * k < 1500) {
            const a1 = amps[k - 1], a2 = amps[m - 1];
            const band = svg("rect", { x: Math.min(fx(f1 * k), fx(f2 * m)) - 7, y: 26, width: Math.abs(fx(f1 * k) - fx(f2 * m)) + 14, height: 90, rx: 6, fill: "#2a9d6f", opacity: 0.15 }, matchLayer);
            pairs.push({ k, m, d, a1, a2, band });
          }
        }
      }
      const iv = BEAT_INTERVALS[state.iv];
      const lines = pairs.slice(0, 3).map((p) => `${p.k}×lower vs ${p.m}×upper: <b>${p.d < 0.05 ? "0" : p.d.toFixed(1)} Hz</b>`);
      readout.innerHTML = `Upper note ${f2.toFixed(1)} Hz (${iv.label.split(" ").pop()}, ${state.detune > 0 ? "+" : ""}${state.detune}¢). Beat rates: ${lines.join(" · ") || "no overtones close enough to beat"}`;
    }
    update();

    M.animate(root, (t) => {
      let d = "";
      const N = 240, span = 2;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const tt = t - span + (span * i) / N;
        let a = 0;
        pairs.forEach((p) => {
          a += Math.abs(Math.hypot(p.a1 + p.a2 * Math.cos(2 * Math.PI * p.d * tt), p.a2 * Math.sin(2 * Math.PI * p.d * tt)));
        });
        pts.push(a);
      }
      const max = pairs.reduce((acc, p) => acc + p.a1 + p.a2, 0) || 1;
      pts.forEach((a, i) => {
        d += (i ? "L" : "M") + (40 + (660 * i) / N).toFixed(1) + " " + (240 - (a / max) * 50).toFixed(1);
      });
      for (let i = N; i >= 0; i--) d += "L" + (40 + (660 * i) / N).toFixed(1) + " " + (240 + (pts[i] / max) * 50).toFixed(1);
      env.setAttribute("d", d + "Z");
      pairs.forEach((p) => {
        p.band.setAttribute("opacity", (0.12 + 0.2 * (0.5 + 0.5 * Math.cos(2 * Math.PI * Math.min(p.d, 12) * t))).toFixed(3));
      });
    });
  });

  // ------------------------------------------------------------------
  // Stacking fifths around the pitch circle.
  // ------------------------------------------------------------------
  const FIFTH_NAMES = ["C", "G", "D", "A", "E", "B", "F♯", "C♯", "G♯", "D♯", "A♯", "E♯", "B♯"];

  function foldedFifth(n) {
    let r = Math.pow(1.5, n), k = 0;
    while (r >= 2) { r /= 2; k++; }
    return { ratio: r, k };
  }

  M.register("fifths-circle", (root) => {
    const W = 720, H = 360, cx = 180, cy = 180, R = 140;
    const s = canvas(root, W, H);
    const pos = (c, rr = R) => {
      const a = (2 * Math.PI * c) / 1200 - Math.PI / 2;
      return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
    };
    svg("circle", { cx, cy, r: R, fill: "none", stroke: "#d9dee4", "stroke-width": 2 }, s);
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = pos(i * 100, R - 6), [x2, y2] = pos(i * 100, R + 6);
      svg("line", { x1, y1, x2, y2, stroke: "#c3cad3" }, s);
      const [tx, ty] = pos(i * 100, R + 22);
      svg("text", { x: tx, y: ty + 4, "font-size": 11, "text-anchor": "middle", fill: "#9aa5b1", text: M.pcName(i) }, s);
    }
    svg("text", { x: cx, y: cy - 6, "font-size": 12, "text-anchor": "middle", fill: "#6b7785", text: "one octave" }, s);
    svg("text", { x: cx, y: cy + 10, "font-size": 12, "text-anchor": "middle", fill: "#6b7785", text: "folded into a circle" }, s);
    const pathLayer = svg("g", {}, s);
    const dotLayer = svg("g", {}, s);

    // table
    const tx = 380;
    const head = ["n", "note", "ratio (folded)", "cents", "vs. equal"];
    const cols = [tx, tx + 30, tx + 82, tx + 205, tx + 270];
    head.forEach((h, i) => svg("text", { x: cols[i], y: 22, "font-size": 12, fill: "#6b7785", text: h }, s));
    const tableLayer = svg("g", {}, s);

    const ctl = controls(root);
    const play = button(ctl, "▶ Play", () => (st.playing ? st.pause() : st.play()));
    button(ctl, "Step ›", () => { st.pause(); st.go(st.index + 1); });
    button(ctl, "Reset", () => st.reset());
    const soundLabel = el("label", {}, ctl);
    const sound = el("input", { type: "checkbox", checked: "" }, soundLabel);
    soundLabel.append(" sound");
    const note = el("div", { class: "mf-readout" }, root);

    let anim = null; // {from, to, t}
    const st = M.stepper({
      count: 13, interval: 1.1,
      onstep(i) {
        pathLayer.innerHTML = dotLayer.innerHTML = tableLayer.innerHTML = "";
        for (let n = 0; n <= i; n++) drawStep(n, n === i);
        if (i >= 0 && sound.checked) {
          const { ratio } = foldedFifth(i);
          M.tone(C4 * ratio, { dur: 0.7 });
          if (i === 12) M.tone(C4, { at: 0.75, dur: 1.2, gain: 0.12 }), M.tone(C4 * ratio, { at: 0.75, dur: 1.2, gain: 0.12 });
        }
        note.innerHTML = message(i);
      },
    });
    st.onchange = () => { play.textContent = st.playing ? "⏸ Pause" : "▶ Play"; };
    // Stop stepping (and sounding) once the widget is off screen.
    onLeave(root, () => { if (st.playing) st.pause(); });

    function drawStep(n, fresh) {
      const { ratio, k } = foldedFifth(n);
      const c = M.cents(ratio);
      const [x, y] = pos(c);
      if (n > 0) {
        const [px, py] = pos(M.cents(foldedFifth(n - 1).ratio));
        const line = svg("line", { x1: px, y1: py, x2: x, y2: y, stroke: n === 12 ? "#e0702b" : "#2f6fdf", "stroke-width": 2, opacity: 0.7 }, pathLayer);
        if (fresh) anim = { line, px, py, x, y, t: 0 };
      }
      const special = n === 12;
      svg("circle", { cx: x, cy: y, r: special ? 7 : 6, fill: special ? "#e0702b" : n <= 6 ? "#2f6fdf" : "#7fa3e8", stroke: "#fff", "stroke-width": 1.5 }, dotLayer);
      const [lx, ly] = pos(c, R - 22 - (special ? 14 : 0));
      svg("text", { x: lx, y: ly + 4, "font-size": 12, "font-weight": 600, "text-anchor": "middle", text: FIFTH_NAMES[n] }, dotLayer);
      // table row
      const y0 = 44 + n * 23;
      const frac = n <= 5 ? `${Math.pow(3, n)}/${Math.pow(2, n + k)}` : ratio.toFixed(4);
      const drift = c - Math.round(c / 100) * 100 + (n === 12 ? 0 : 0);
      const vals = [n, FIFTH_NAMES[n], frac, c.toFixed(1), n === 12 ? "+23.5¢ past C" : fmtCents(drift)];
      vals.forEach((v, i) => svg("text", { x: cols[i], y: y0, "font-size": 13, fill: special ? "#e0702b" : n <= 6 ? "#1f2933" : "#52606d", "font-weight": fresh ? 700 : 400, text: v }, tableLayer));
    }

    function message(i) {
      if (i < 0) return "Press <b>Play</b> to stack perfect fifths (×3/2) starting from C, folding each result back into one octave (÷2).";
      if (i === 0) return "Start on <b>C</b>.";
      if (i === 6) return "Seven notes so far — <b>C G D A E B F♯</b> are exactly the notes of G major: a run of seven consecutive fifths is a diatonic scale.";
      if (i === 11) return "Twelve notes: every key on the piano has been visited once.";
      if (i === 12) return "The 12th fifth should bring us home to C, but <b>B♯ lands 23.5 cents sharp</b> of it. That gap is the <b>Pythagorean comma</b>.";
      return `Up a fifth to <b>${FIFTH_NAMES[i]}</b>${foldedFifth(i).k > foldedFifth(i - 1).k ? " (folded down an octave)" : ""}.`;
    }

    st.go(-1);
    M.animate(root, (t, dt) => {
      if (!anim) return;
      anim.t = Math.min(1, anim.t + dt * 2.5);
      const e = M.ease(anim.t);
      anim.line.setAttribute("x2", M.lerp(anim.px, anim.x, e));
      anim.line.setAttribute("y2", M.lerp(anim.py, anim.y, e));
      if (anim.t >= 1) anim = null;
    });
  });

  // ------------------------------------------------------------------
  // The Pythagorean comma as accumulated error.
  // ------------------------------------------------------------------
  M.register("comma", (root) => {
    const W = 720, H = 300, x0 = 70, y0 = 250, bw = 40;
    const COMMA = M.cents(Math.pow(1.5, 12) / Math.pow(2, 7)); // 23.46
    const s = canvas(root, W, H);
    const ys = (c) => y0 - c * 8.5;
    for (let c = 0; c <= 25; c += 5) {
      svg("line", { x1: x0, y1: ys(c), x2: x0 + 13 * bw, y2: ys(c), stroke: "#e6e9ed" }, s);
      svg("text", { x: x0 - 8, y: ys(c) + 4, "font-size": 11, "text-anchor": "end", fill: "#6b7785", text: `${c}¢` }, s);
    }
    svg("text", { x: 14, y: 18, "font-size": 12, fill: "#6b7785", text: "how far the stack of pure fifths has drifted from equal temperament" }, s);
    svg("line", { x1: x0, y1: y0, x2: x0 + 13 * bw, y2: y0, stroke: "#9aa5b1" }, s);
    const bars = [];
    for (let n = 0; n <= 12; n++) {
      const x = x0 + n * bw + 6;
      const bar = svg("rect", { x, y: y0, width: bw - 12, height: 0, rx: 3, fill: n === 12 ? "#e0702b" : "#2f6fdf" }, s);
      svg("text", { x: x + (bw - 12) / 2, y: y0 + 16, "font-size": 12, "text-anchor": "middle", text: FIFTH_NAMES[n] }, s);
      bars.push({ bar, target: (COMMA * n) / 12, h: 0 });
    }
    svg("text", { x: x0 + 6.5 * bw, y: y0 + 36, "font-size": 11, "text-anchor": "middle", fill: "#6b7785", text: "number of fifths stacked →" }, s);
    const brace = svg("g", { opacity: 0 }, s);
    svg("text", { x: x0 + 13 * bw + 10, y: ys(COMMA) + 4, "font-size": 13, "font-weight": 700, fill: "#e0702b", text: "23.46¢" }, brace);
    svg("text", { x: x0 + 13 * bw + 10, y: ys(COMMA) + 20, "font-size": 11, fill: "#e0702b", text: "≈ ¼ semitone" }, brace);

    const box = svg("g", {}, s);
    svg("rect", { x: x0 + 10, y: 34, width: 300, height: 74, rx: 8, fill: "#fff", stroke: "#d9dee4" }, box);
    svg("text", { x: x0 + 24, y: 58, "font-size": 14, text: "(3/2)¹² = 129.746" }, box);
    svg("text", { x: x0 + 24, y: 78, "font-size": 14, text: "2⁷ = 128" }, box);
    svg("text", { x: x0 + 24, y: 98, "font-size": 14, fill: "#e0702b", text: "ratio 1.01364 = 23.46 cents" }, box);

    const ctl = controls(root);
    button(ctl, "▶ Stack the fifths", () => { start = clock; });
    button(ctl, "▶ Hear the comma", () => {
      const r = Math.pow(1.5, 12) / Math.pow(2, 7);
      M.tone(C4, { dur: 0.8 });
      M.tone(C4 * r, { at: 0.9, dur: 0.8 });
      M.tone(C4, { at: 1.9, dur: 2.2, gain: 0.13 });
      M.tone(C4 * r, { at: 1.9, dur: 2.2, gain: 0.13 });
    });
    caption(root, "Each pure fifth is 1.955 cents wider than an equal-tempered one. The error is tiny per step but never cancels, so after twelve fifths it has grown to a quarter of a semitone. Played together, C and B♯ beat about 3.5 times per second.");

    // `t` only advances while the chart is on screen, so the bars grow when it is first seen.
    let start = 0, clock = 0;
    M.animate(root, (t) => {
      clock = t;
      const el_ = t - start;
      bars.forEach((b, n) => {
        const k = Math.max(0, Math.min(1, (el_ - n * 0.18) / 0.4));
        const h = (b.target * 8.5) * M.ease(k);
        b.bar.setAttribute("y", y0 - h);
        b.bar.setAttribute("height", h);
      });
      brace.setAttribute("opacity", Math.max(0, Math.min(1, el_ - 2.6)));
    });
  });

  // ------------------------------------------------------------------
  // 4:5:6 — the major triad inside the harmonic series.
  // ------------------------------------------------------------------
  M.register("triad-456", (root) => {
    const W = 720, H = 320, yb = 290, k = 88; // y = yb - log2(n) * k
    const s = canvas(root, W, H);
    const yOf = (n) => yb - Math.log2(n) * k;
    svg("text", { x: 40, y: 16, "font-size": 12, fill: "#6b7785", text: "harmonics of C3 (spaced by pitch)" }, s);
    svg("text", { x: 400, y: 16, "font-size": 12, fill: "#6b7785", text: "harmonics 4, 5, 6 as a chord" }, s);
    const COLORS = { 4: "#2f6fdf", 5: "#e0702b", 6: "#2a9d6f" };
    const lines = {};
    for (let n = 1; n <= 8; n++) {
      const y = yOf(n), hot = COLORS[n];
      lines[n] = svg("line", { x1: 70, y1: y, x2: 250, y2: y, stroke: hot || "#9aa5b1", "stroke-width": hot ? 4 : 2, "stroke-linecap": "round" }, s);
      svg("text", { x: 56, y: y + 4, "font-size": 12, "text-anchor": "end", text: `${n}` }, s);
      const nn = nearestNote(C3 * n);
      svg("text", { x: 262, y: y + 4, "font-size": 12, fill: hot ? hot : "#6b7785", text: nn.name + (Math.abs(nn.off) > 3 ? ` ${nn.off > 0 ? "+" : "−"}${Math.abs(nn.off)}¢` : "") }, s);
    }
    const movers = [4, 5, 6].map((n) => ({
      n, y: yOf(n),
      bar: svg("line", { x1: 70, y1: yOf(n), x2: 250, y2: yOf(n), stroke: COLORS[n], "stroke-width": 6, "stroke-linecap": "round", opacity: 0 }, s),
    }));
    const brackets = svg("g", { opacity: 0 }, s);
    const bx = 556;
    const br = (n1, n2, label, dx) => {
      const y1 = yOf(n1) - 2, y2 = yOf(n2) + 2;
      svg("path", { d: `M${bx + dx - 6} ${y1} H${bx + dx} V${y2} H${bx + dx - 6}`, fill: "none", stroke: "#52606d" }, brackets);
      svg("text", { x: bx + dx + 6, y: (y1 + y2) / 2 + 4, "font-size": 12, text: label }, brackets);
    };
    br(4, 5, "5:4 major 3rd", 0);
    br(5, 6, "6:5 minor 3rd", 0);
    br(4, 6, "3:2 fifth", 94);
    const chordLabel = svg("text", { x: 470, y: yOf(6) - 26, "font-size": 15, "font-weight": 700, "text-anchor": "middle", opacity: 0, text: "C major triad" }, s);

    const ctl = controls(root);
    let t0 = -10, pulse = {};
    button(ctl, "▶ Play harmonics 1–8", () => {
      for (let n = 1; n <= 8; n++) {
        M.tone(C3 * n, { at: (n - 1) * 0.35, dur: 0.5, partials: [1], gain: 0.25 });
        setTimeout(() => (pulse[n] = performance.now()), (n - 1) * 350);
      }
    });
    button(ctl, "▶ Pure 4:5:6", () => {
      t0 = performance.now();
      M.sequence([4, 5, 6].map((n) => C3 * n), { step: 0.4, dur: 0.5 });
      M.chord([4, 5, 6].map((n) => C3 * n), { at: 1.3, dur: 2 });
    });
    button(ctl, "▶ Equal-tempered C–E–G", () => {
      M.chord([72, 76, 79].map(M.midiToHz), { dur: 2 });
    });
    caption(root, "Harmonics 4, 5 and 6 of any note are a root, major third and fifth. Nobody had to invent the major triad: it is sitting in the overtones of every low C. (The equal-tempered E is 14 cents higher than harmonic 5; listen for the faint beating.)");

    M.animate(root, () => {
      const now = performance.now();
      const p = Math.max(0, Math.min(1, (now - t0) / 1200));
      const e = M.ease(p);
      movers.forEach((m) => {
        m.bar.setAttribute("opacity", p > 0 && p < 1 ? 1 : p >= 1 ? 1 : 0);
        m.bar.setAttribute("x1", M.lerp(70, 400, e));
        m.bar.setAttribute("x2", M.lerp(250, 540, e));
      });
      brackets.setAttribute("opacity", Math.max(0, (now - t0 - 1100) / 400) > 1 ? 1 : Math.max(0, (now - t0 - 1100) / 400));
      chordLabel.setAttribute("opacity", brackets.getAttribute("opacity"));
      for (let n = 1; n <= 8; n++) {
        const age = (now - (pulse[n] || -1e9)) / 500;
        const w = (COLORS[n] ? 4 : 2) + Math.max(0, 1 - age) * 5;
        lines[n].setAttribute("stroke-width", w.toFixed(1));
      }
    });
    // show the finished chord before anyone presses a button
    t0 = performance.now() - 5000;
  });

  // ------------------------------------------------------------------
  // Pure vs equal-tempered intervals, by ear and by cents.
  // ------------------------------------------------------------------
  const IV = [
    { name: "Major 3rd", p: 5, q: 4, st: 4 },
    { name: "Minor 3rd", p: 6, q: 5, st: 3 },
    { name: "Perfect 4th", p: 4, q: 3, st: 5 },
    { name: "Perfect 5th", p: 3, q: 2, st: 7 },
    { name: "Major 6th", p: 5, q: 3, st: 9 },
  ];

  M.register("intonation", (root) => {
    let cur = 0, playing = null, playStart = 0;
    const ctl = controls(root);
    toggleGroup(ctl, IV.map((v) => v.name), (i) => { cur = i; draw(); });
    const ctl2 = controls(root);
    button(ctl2, "▶ Pure", () => play("pure"));
    button(ctl2, "▶ Equal-tempered", () => play("et"));
    button(ctl2, "▶ Pure, then ET", () => { play("pure"); setTimeout(() => play("et"), 2600); });

    const W = 720, H = 220;
    const s = canvas(root, W, H);
    const layer = svg("g", {}, s);
    const pulses = { pure: null, et: null };
    const readout = el("div", { class: "mf-readout" }, root);
    caption(root, "Pure intervals have overtones that coincide exactly, so they ring without beating. Equal temperament nudges every interval except the octave; the thirds and sixths move most and beat audibly. A violinist tunes open fifths pure and adjusts thirds by ear.");

    function freqs(kind) {
      const v = IV[cur];
      return [C4, kind === "pure" ? (C4 * v.p) / v.q : C4 * Math.pow(2, v.st / 12)];
    }
    function beatRate(kind) {
      const v = IV[cur];
      const [a, b] = freqs(kind);
      return Math.abs(v.p * a - v.q * b);
    }
    function play(kind) {
      M.chord(freqs(kind), { dur: 2.4, gain: 0.25 });
      playing = kind;
      playStart = performance.now();
    }

    function draw() {
      layer.innerHTML = "";
      const v = IV[cur];
      const pureC = M.cents(v.p / v.q), etC = v.st * 100;
      // full octave ruler
      const rx = (c) => 40 + (c / 1200) * 640;
      svg("line", { x1: rx(0), y1: 40, x2: rx(1200), y2: 40, stroke: "#9aa5b1" }, layer);
      for (let i = 0; i <= 12; i++) {
        svg("line", { x1: rx(i * 100), y1: 34, x2: rx(i * 100), y2: 46, stroke: "#9aa5b1" }, layer);
        svg("text", { x: rx(i * 100), y: 26, "font-size": 10, "text-anchor": "middle", fill: "#9aa5b1", text: M.pcName(i) }, layer);
      }
      svg("circle", { cx: rx(pureC), cy: 40, r: 6, fill: "#2a9d6f" }, layer);
      svg("rect", { x: rx(etC) - 4, y: 36, width: 8, height: 8, fill: "#2f6fdf" }, layer);
      // zoomed window ±30 cents around the ET note
      const zx = (c) => 360 + ((c - etC) / 30) * 300;
      svg("path", { d: `M${rx(etC - 30)} 48 L60 90 M${rx(etC + 30)} 48 L660 90`, stroke: "#d9dee4", fill: "none" }, layer);
      svg("rect", { x: 60, y: 90, width: 600, height: 60, rx: 8, fill: "#fff", stroke: "#d9dee4" }, layer);
      for (let c = -30; c <= 30; c += 10) {
        svg("line", { x1: zx(etC + c), y1: 140, x2: zx(etC + c), y2: 146, stroke: "#9aa5b1" }, layer);
        svg("text", { x: zx(etC + c), y: 166, "font-size": 10, "text-anchor": "middle", fill: "#6b7785", text: `${c > 0 ? "+" : ""}${c}¢` }, layer);
      }
      const gx = zx(pureC), bx = zx(etC);
      svg("line", { x1: gx, y1: 98, x2: gx, y2: 142, stroke: "#2a9d6f", "stroke-width": 3 }, layer);
      svg("line", { x1: bx, y1: 98, x2: bx, y2: 142, stroke: "#2f6fdf", "stroke-width": 3 }, layer);
      svg("text", { x: gx, y: 186, "font-size": 12, "text-anchor": "middle", fill: "#2a9d6f", text: `pure ${v.p}:${v.q}` }, layer);
      svg("text", { x: bx, y: 200, "font-size": 12, "text-anchor": "middle", fill: "#2f6fdf", text: "equal-tempered" }, layer);
      pulses.pure = svg("circle", { cx: gx, cy: 120, r: 10, fill: "#2a9d6f", opacity: 0 }, layer);
      pulses.et = svg("circle", { cx: bx, cy: 120, r: 10, fill: "#2f6fdf", opacity: 0 }, layer);
      readout.innerHTML = `${v.name} above C4: pure ${v.p}:${v.q} = <b>${pureC.toFixed(1)}¢</b>, equal-tempered = <b>${etC}¢</b>, difference ${fmtCents(etC - pureC)}. Overtone beating: pure <b>0 Hz</b>, equal-tempered <b>${beatRate("et").toFixed(1)} Hz</b>.`;
    }
    draw();

    M.animate(root, () => {
      ["pure", "et"].forEach((k) => {
        const p = pulses[k];
        if (!p) return;
        const age = (performance.now() - playStart) / 1000;
        if (playing !== k || age > 2.4) { p.setAttribute("opacity", 0); return; }
        const rate = beatRate(k);
        const o = rate < 0.1 ? 0.5 : 0.1 + 0.45 * (0.5 + 0.5 * Math.cos(2 * Math.PI * Math.min(rate, 14) * age));
        p.setAttribute("opacity", o.toFixed(3));
        p.setAttribute("r", (10 + 8 * o).toFixed(1));
      });
    });
  });
})();
