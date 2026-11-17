// Musifold widget core: DOM/SVG helpers, music math, Web Audio synth, animation loop
// and the registry that mounts every `.mf-widget[data-widget]` on the page.
// Widget files call `Musifold.register(name, (root, opts) => { ... })`.
(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";

  // ---------- DOM helpers ----------

  function svg(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    setAttrs(node, attrs);
    if (parent) parent.appendChild(node);
    return node;
  }

  function el(tag, attrs, parent) {
    const node = document.createElement(tag);
    setAttrs(node, attrs);
    if (parent) parent.appendChild(node);
    return node;
  }

  function setAttrs(node, attrs) {
    if (!attrs) return node;
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null) continue;
      if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "class") node.setAttribute("class", v);
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    return node;
  }

  function canvas(root, width, height) {
    return svg("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" }, root);
  }

  function controls(root) {
    return el("div", { class: "mf-controls" }, root);
  }

  function button(parent, label, onclick) {
    return el("button", { type: "button", text: label, onclick }, parent);
  }

  // A group of buttons where exactly one is "on".
  function toggleGroup(parent, labels, onselect, initial = 0) {
    const buttons = labels.map((label, i) =>
      button(parent, label, () => select(i, true))
    );
    function select(i, fire) {
      buttons.forEach((b, j) => b.classList.toggle("mf-on", i === j));
      if (fire) onselect(i);
    }
    select(initial, false);
    return { buttons, select };
  }

  function slider(parent, label, { min, max, step = 1, value, oninput }) {
    const wrap = el("label", { text: label }, parent);
    const input = el("input", { type: "range", min, max, step, value }, wrap);
    input.addEventListener("input", () => oninput(Number(input.value)));
    return input;
  }

  function caption(root, text) {
    return el("div", { class: "mf-caption", html: text }, root);
  }

  // ---------- music math ----------

  const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

  const mod = (n, m) => ((n % m) + m) % m;
  const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const cents = (ratio) => 1200 * Math.log2(ratio);
  const pcName = (pc) => NOTE_NAMES[mod(pc, 12)];
  const midiName = (m) => pcName(m) + (Math.floor(m / 12) - 1);

  // ---------- audio ----------

  let ctx = null;
  let master = null;

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createDynamicsCompressor();
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Amplitudes of the first partials for a soft, string-like timbre.
  const RICH = [1, 0.5, 0.33, 0.25, 0.2, 0.16];

  // Play one note. `partials` is a list of amplitudes for harmonics 1, 2, 3, ...
  function tone(freq, { at = 0, dur = 1, gain = 0.18, partials = RICH, attack = 0.02, release = 0.25 } = {}) {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime + at;
    const env = ac.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + attack);
    env.gain.setValueAtTime(gain, t0 + Math.max(attack, dur - release));
    env.gain.linearRampToValueAtTime(0, t0 + dur);
    env.connect(master);
    const total = partials.reduce((a, b) => a + b, 0);
    partials.forEach((amp, i) => {
      const f = freq * (i + 1);
      if (f > 10000 || amp === 0) return;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.frequency.value = f;
      g.gain.value = amp / total;
      osc.connect(g).connect(env);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
  }

  function chord(freqs, opts = {}) {
    const gain = (opts.gain || 0.22) / Math.sqrt(freqs.length);
    freqs.forEach((f) => tone(f, { ...opts, gain }));
  }

  function sequence(freqs, { step = 0.35, dur = 0.5, at = 0, ...opts } = {}) {
    freqs.forEach((f, i) => tone(f, { ...opts, at: at + i * step, dur }));
    return at + (freqs.length - 1) * step + dur;
  }

  // A held tone whose frequency can be changed while it sounds.
  function drone(freq, { gain = 0.12, partials = RICH } = {}) {
    const ac = audio();
    if (!ac) return null;
    const env = ac.createGain();
    env.gain.setValueAtTime(0, ac.currentTime);
    env.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.05);
    env.connect(master);
    const total = partials.reduce((a, b) => a + b, 0);
    const oscs = partials.map((amp, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.frequency.value = freq * (i + 1);
      g.gain.value = amp / total;
      osc.connect(g).connect(env);
      osc.start();
      return osc;
    });
    return {
      set(f) {
        oscs.forEach((o, i) => o.frequency.setTargetAtTime(f * (i + 1), ac.currentTime, 0.02));
      },
      stop() {
        const t = ac.currentTime;
        env.gain.cancelScheduledValues(t);
        env.gain.setValueAtTime(env.gain.value, t);
        env.gain.linearRampToValueAtTime(0, t + 0.15);
        oscs.forEach((o) => o.stop(t + 0.2));
      },
    };
  }

  // ---------- timing ----------

  // Calls frame(timeSeconds, dt) on every animation frame while root is on screen.
  function animate(root, frame) {
    let raf = null;
    let last = null;
    let elapsed = 0;
    function tick(now) {
      const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      elapsed += dt;
      frame(elapsed, dt);
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (raf === null) { last = null; raf = requestAnimationFrame(tick); }
    }
    function stop() {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? start() : stop()));
      }).observe(root);
    } else {
      start();
    }
    return { start, stop };
  }

  // Run a step-by-step "player": calls step(i) every `interval` seconds while playing.
  function stepper({ count, interval, onstep, loop = false }) {
    let i = -1;
    let timer = null;
    const api = {
      get index() { return i; },
      get playing() { return timer !== null; },
      play() {
        if (timer) return;
        if (i >= count - 1) api.reset();
        timer = setInterval(() => {
          if (i >= count - 1) {
            if (loop) i = -1;
            else { api.pause(); return; }
          }
          api.go(i + 1);
        }, interval * 1000);
        api.go(i + 1);
      },
      pause() { clearInterval(timer); timer = null; api.onchange && api.onchange(); },
      go(n) { i = Math.max(-1, Math.min(count - 1, n)); onstep(i); api.onchange && api.onchange(); },
      reset() { api.pause(); api.go(-1); },
    };
    return api;
  }

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- registry ----------

  const registry = {};

  function register(name, fn) {
    registry[name] = fn;
  }

  function mount(root) {
    if (root.dataset.mfMounted) return;
    const name = root.dataset.widget;
    const fn = registry[name];
    if (!fn) {
      console.warn(`Musifold: unknown widget "${name}"`);
      return;
    }
    root.dataset.mfMounted = "1";
    root.innerHTML = "";
    try {
      fn(root, { ...root.dataset });
    } catch (err) {
      console.error(`Musifold: widget "${name}" failed`, err);
      root.textContent = `This interactive figure (${name}) failed to load.`;
    }
  }

  function mountAll() {
    document.querySelectorAll(".mf-widget[data-widget]").forEach(mount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    setTimeout(mountAll, 0);
  }

  window.Musifold = {
    register, mountAll,
    svg, el, canvas, controls, button, toggleGroup, slider, caption,
    NOTE_NAMES, mod, midiToHz, cents, pcName, midiName,
    audio, tone, chord, sequence, drone, RICH,
    animate, stepper, ease, lerp,
  };
})();
