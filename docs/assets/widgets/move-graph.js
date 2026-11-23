// The move graph: guitar-harmony "tricks" as a graph of voice-leading moves.
// Nodes are moves, grouped in clusters by how the voices move; edges say what builds on
// what; paths are curated walks; songs highlight the moves they use and play their chords.
// Needs guitar.js and guitar-chords.js (for the embedded progression players).
(function () {
  "use strict";
  const M = window.Musifold;
  const { svg, el, canvas, controls, button, toggleGroup } = M;

  // ---------------------------------------------------------------- clusters
  const CLUSTERS = {
    space: { name: "Space", sub: "where notes live", color: "#52606d", box: [10, 34, 140, 426] },
    hold: { name: "Hold & step", sub: "2 voices hold, 1 steps", color: "#2a9d6f", box: [165, 34, 170, 426] },
    fifth: { name: "Fifth motion", sub: "the root falls a 5th", color: "#2f6fdf", box: [350, 34, 260, 262] },
    sym: { name: "Symmetry moves", sub: "nearly even chords", color: "#a347c4", box: [350, 306, 260, 154] },
    par: { name: "Parallel slides", sub: "the whole shape moves", color: "#e0702b", box: [625, 34, 165, 426] },
  };

  // ---------------------------------------------------------------- nodes
  // sig = voice-leading signature; demo = a progression that shows the move.
  const NODES = [
    // Space
    { id: "intervals", label: "String intervals", c: "space", x: 80, y: 90, lesson: "space.html#string-intervals",
      sig: "geometry", idea: "Strings are a 4th apart except G→B (a major 3rd). Any shape crossing G→B moves up one fret.", neck: "Same fret, next string = a 4th up." },
    { id: "octaves", label: "Octaves & 10ths", c: "space", x: 80, y: 160, lesson: "space.html#interval-shapes",
      sig: "geometry", idea: "Octave = skip a string, +2 frets (+3 across G→B). Tenths = three strings over: same fret for minor, +1 for major (one more across G→B).", neck: "Two-finger shapes you can slide anywhere." },
    { id: "keymap", label: "Key map", c: "space", x: 80, y: 230, lesson: "space.html#key-map",
      sig: "orientation", idea: "Once you know the tonic, I–IV–V form an L across two strings, ii and vi sit two frets above I and V, and vi is three frets below I.", neck: "Tonic on the 5th string: V is directly above it, same fret.", demo: "C F G7 C | I IV V7 I" },
    { id: "caged", label: "CAGED", c: "space", x: 80, y: 300, lesson: "space.html#caged",
      sig: "orientation", idea: "Every chord in five interlocking positions, from the open C, A, G, E and D shapes.", neck: "The top of one shape is the bottom of the next." },
    { id: "roles", label: "One note, 3 roles", c: "space", x: 80, y: 370, lesson: "space.html#one-note-three-roles",
      sig: "orientation", idea: "Any note is the root, 3rd or 5th of six major/minor chords, so every melody note can be harmonized six ways.", neck: "Keep the melody note, change the shape around it." },

    // Hold & step
    { id: "plr", label: "Neighbour triads", c: "hold", lesson: "hold-step.html#neighbour-triads", x: 250, y: 90,
      sig: "2 hold · 1 moves 1–2", idea: "Each major triad has three minor neighbours sharing two notes: its parallel (C–Cm), relative (C–Am) and leading-tone exchange (C–Em). These are the shortest moves between triads.", neck: "One finger moves, the rest stay.", demo: "C Am C Em C Cm C | I vi I iii I i I" },
    { id: "thirdsub", label: "Third substitution", c: "hold", lesson: "hold-step.html#third-substitution", x: 250, y: 150,
      sig: "2 hold · 1 steps", idea: "Swap a chord for the one a third away that shares two notes: vi for I (deceptive), ii for IV. Tymoczko calls this classical 'third substitution'.", neck: "The same two fingers stay.", demo: "C F G7 Am | I IV V7 vi" },
    { id: "iv", label: "Borrowed iv", c: "hold", x: 250, y: 210, lesson: "hold-step.html#borrowed-iv",
      sig: "1 voice −1", idea: "Turn IV into iv (F → Fm in C): one note drops a half step, borrowed from the parallel minor. It's the bittersweet 'minor plagal' sound.", neck: "Change the IV shape from major to minor.", demo: "C F Fm C | I IV iv I" },
    { id: "cliche", label: "Line cliché", c: "hold", x: 250, y: 270, lesson: "hold-step.html#line-cliches",
      sig: "1 voice chromatic", idea: "Hold a chord and walk one inner voice by half steps: Am, Am(maj7), Am7, Am6.", neck: "One finger walks down one string.", demo: "Am@x07555 Ammaj7@x06555 Am7@x05555 Am6@x04555 | i i(maj7) i7 i6" },
    { id: "sus", label: "Sus & 4–3", c: "hold", x: 250, y: 330, lesson: "hold-step.html#suspended-chords",
      sig: "1 held, then −1", idea: "The 7th of V7 is held into the tonic as its 4th, then falls to the 3rd. In minor, landing on a major I is the Picardy third.", neck: "Lift one finger to resolve.", demo: "G7 Csus4 C | V7 Isus4 I" },
    { id: "popaxis", label: "Pop axis loop", c: "hold", lesson: "hold-step.html#pop-axis-loop", x: 250, y: 390,
      sig: "mixed loop", idea: "I–V–vi–IV: a fifth move, a deceptive step and a third substitution, looped. Its rotations (vi–IV–I–V) power countless pop songs.", neck: "Four barre shapes that stay in one area of the neck.", demo: "C G Am F | I V vi IV" },

    // Fifth motion
    { id: "cadence", label: "V→I & cadences", c: "fifth", x: 415, y: 90, lesson: "fifth-motion.html#cadences",
      sig: "root −5th", idea: "V→I is the strongest close, IV→I the 'amen', V→vi deceptive, and ending on V a half cadence.", neck: "Root: same fret, one string over.", demo: "C F G7 C | I IV V7 I" },
    { id: "guide", label: "Guide tones", c: "fifth", x: 545, y: 90, lesson: "fifth-motion.html#guide-tones",
      sig: "7th → 3rd, −1", idea: "The 3rd and 7th carry a 7th chord. Moving by fifths, each chord's 7th falls a half step to the next chord's 3rd, and the other guide tone holds.", neck: "Three-note shells that move by one fret.", demo: "Dm7 G7 Cmaj7 | ii7 V7 Imaj7", shell: true },
    { id: "iiVI", label: "ii–V–I", c: "fifth", x: 545, y: 145, lesson: "fifth-motion.html#ii-v-i",
      sig: "2 fifth moves", idea: "The core of functional harmony. In minor, ii is half-diminished: iiø7–V7–i.", neck: "Roots: A string, then E string, then A string.", demo: "Dm7 G7 Cmaj7 | ii7 V7 Imaj7" },
    { id: "secdom", label: "Secondary dominants", c: "fifth", x: 545, y: 200, lesson: "fifth-motion.html#secondary-dominants",
      sig: "+1 leading tone", idea: "Any chord can be approached by its own V7. That adds one note from outside the key, which leads into the target.", neck: "Make the chord a fifth above the target dominant.", demo: "C E7 Am A7 Dm G7 C | I V7/vi vi V7/ii ii V7 I" },
    { id: "circle", label: "Circle sequences", c: "fifth", x: 415, y: 150, lesson: "fifth-motion.html#circles-of-fifths",
      sig: "chain of 5ths", idea: "Chained fifth moves (iii–vi–ii–V–I) pull steadily toward home.", neck: "Roots zig-zag between the E and A strings, drifting down.", demo: "Em7 Am7 Dm7 G7 Cmaj7 | iii7 vi7 ii7 V7 Imaj7" },
    { id: "chain", label: "Dominant chain", c: "fifth", x: 545, y: 255, lesson: "fifth-motion.html#dominant-chain",
      sig: "V7→I→I7→…", idea: "Turn each tonic into a dominant 7th and resolve again, through all twelve keys.", neck: "Alternate E-string and A-string 7th shapes.", demo: "G7 C C7 F F7 B♭ B♭7 E♭ | V7 I V7/IV IV V7/♭VII ♭VII V7 I" },
    { id: "blues", label: "12-bar blues", c: "fifth", x: 415, y: 210, lesson: "fifth-motion.html#twelve-bar-blues",
      sig: "all dominant 7ths", idea: "I7, IV7 and V7 over twelve bars. Even the tonic is a dominant 7th, so the usual rules are broken on purpose.", neck: "Three 7th shapes in one position." },
    { id: "neapolitan", label: "Neapolitan ♭II", c: "fifth", x: 415, y: 270, lesson: "fifth-motion.html#ii-v-i",
      sig: "♭II for ii", idea: "A major triad on the lowered 2nd (D♭ in C minor) in place of ii, usually with the 3rd in the bass (N6).", neck: "A barre a half step above the tonic.", demo: "Cm D♭ G7 Cm | i ♭II V7 i" },

    // Symmetry
    { id: "mediant", label: "Chromatic mediants", c: "sym", x: 415, y: 358, lesson: "symmetry.html#mediant-moves",
      sig: "1 hold · 2 step", idea: "Triads are closest to their major-third transpositions (Tymoczko §3.10). I→III and I→♭VI keep one note and move two by step, which gives a cinematic lift.", neck: "Slide the same barre shape ±4 or −3 frets.", demo: "C E C A♭ C | I III I ♭VI I" },
    { id: "tritone", label: "Tritone sub", c: "sym", x: 545, y: 358, lesson: "symmetry.html#tritone-substitution",
      sig: "keeps the tritone", idea: "7th chords are closest to their minor-third and tritone transpositions. D♭7 keeps G7's B and F, so it can replace it, and the bass slides down a half step.", neck: "Same 7th shape, six frets away.", demo: "Dm7 D♭7 Cmaj7 | ii7 ♭II7 Imaj7", shell: true },
    { id: "dim7", label: "°7: 4 resolutions", c: "sym", x: 415, y: 428, lesson: "symmetry.html#symmetric-chords",
      sig: "every 3 frets", idea: "Stacked minor thirds: the same four notes every 3 frets, and each can be a leading tone, so it resolves to four keys. B° is G7 without the G.", neck: "Slide the shape by 3 frets." , demo: "G G♯dim7 Am7 | I ♯i°7 ii7" },
    { id: "aug", label: "Aug: 3 resolutions", c: "sym", x: 545, y: 428, lesson: "symmetry.html#symmetric-chords",
      sig: "every 4 frets", idea: "Stacked major thirds repeat every 4 frets. As V+, the raised 5th pushes up to the tonic's 3rd.", neck: "Slide the shape by 4 frets.", demo: "C G Gaug C | I V V+ I" },

    // Parallel slides
    { id: "flat7", label: "♭VII rock", c: "par", x: 707, y: 90, lesson: "parallel.html#flat-vii-and-flat-vi",
      sig: "shape slides −2", idea: "B♭ in C: a whole step below the tonic, borrowed from Mixolydian or minor. It's the classic rock move.", neck: "Slide the tonic shape down two frets.", demo: "C B♭ F C | I ♭VII IV I" },
    { id: "flat67", label: "♭VI–♭VII–I", c: "par", x: 707, y: 160, lesson: "parallel.html#flat-vii-and-flat-vi",
      sig: "shape slides +2, +2", idea: "Two borrowed major chords climbing in whole steps to the tonic: a triumphant cadence.", neck: "The same barre, up two frets, twice.", demo: "C A♭ B♭ C | I ♭VI ♭VII I" },
    { id: "andalusian", label: "Andalusian", c: "par", x: 707, y: 230, lesson: "parallel.html#andalusian-cadence",
      sig: "bass steps down", idea: "i–♭VII–♭VI–V: a bass stepping down the minor scale to a major V whose leading tone pulls home.", neck: "The same shape stepping down the neck.", demo: "Am G F E | i ♭VII ♭VI V" },
  ];

  // Parked (not on the published map until they have a lesson): Common-tone °7 (C → C°7 → C),
  // Modal swaps (Dorian i–IV, Lydian I–II, Phrygian i–♭II), Backdoor (iv7 → ♭VII7 → I).

  // ---------------------------------------------------------------- edges
  // n = needs (prerequisite → move), v = variant of, s = same mechanism
  const EDGES = [
    ["intervals", "octaves", "n"], ["intervals", "keymap", "n"], ["keymap", "caged", "n"], ["caged", "roles", "n"],
    ["keymap", "cadence", "n"], ["keymap", "plr", "n"], ["cadence", "iiVI", "n"], ["guide", "iiVI", "n"],
    ["iiVI", "secdom", "n"], ["secdom", "chain", "n"], ["cadence", "circle", "n"], ["circle", "chain", "n"],
    ["cadence", "blues", "n"], ["cadence", "sus", "n"], ["plr", "thirdsub", "n"], ["plr", "iv", "n"], ["plr", "mediant", "n"],
    ["roles", "cliche", "n"], ["guide", "tritone", "n"], ["cadence", "dim7", "n"], ["keymap", "andalusian", "n"],
    ["keymap", "flat7", "n"], ["thirdsub", "popaxis", "n"], ["cadence", "popaxis", "n"], 
    ["iiVI", "neapolitan", "v"], ["dim7", "aug", "v"], ["flat7", "flat67", "v"], ["iv", "flat67", "v"],
    ["mediant", "tritone", "s"], ["tritone", "dim7", "s"], ["mediant", "aug", "s"], ["thirdsub", "tritone", "s"],
    ["iv", "cliche", "s"], ["secdom", "mediant", "s"], ["sus", "guide", "s"], ["neapolitan", "tritone", "s"],
  ];
  const EDGE_STYLE = {
    n: { stroke: "#9aa5b1", dash: null, label: "builds on" },
    v: { stroke: "#9aa5b1", dash: "5 4", label: "variant of" },
    s: { stroke: "#a347c4", dash: "2 4", label: "same mechanism" },
  };

  // ---------------------------------------------------------------- paths
  const PATHS = [
    { name: "Foundations", nodes: ["intervals", "octaves", "keymap", "caged", "roles"], note: "Learn the neck as a grid before learning moves." },
    { name: "Rock & pop", nodes: ["keymap", "cadence", "flat7", "flat67", "iv", "secdom", "mediant", "popaxis", "blues", "andalusian"], note: "Three-chord songs, borrowed chords and the loops behind pop." },
    { name: "Jazz", nodes: ["keymap", "cadence", "guide", "iiVI", "secdom", "circle", "tritone", "dim7", "cliche", "chain"], note: "Guide tones first, then substitutions." },
    { name: "Classical & film", nodes: ["cadence", "sus", "iiVI", "neapolitan", "plr", "thirdsub", "mediant", "dim7", "aug"], note: "Cadences, suspensions and the cinematic third relations." },
  ];

  // ---------------------------------------------------------------- songs
  // Progressions are the documented chords; "shown in" marks a transposition.
  const SONGS = [
    { title: "Creep", artist: "Radiohead", where: "verse loop, G major", chords: "G B C Cm", labels: "I III IV iv", nodes: ["secdom", "mediant", "iv"],
      note: "B is III (the V of vi) and a chromatic mediant; C → Cm is the borrowed iv. Three moves in one loop." },
    { title: "La Bamba", artist: "Ritchie Valens", where: "chorus, C major", chords: "C F G", labels: "I IV V", nodes: ["cadence", "keymap"] },
    { title: "Autumn Leaves", artist: "Kosma / Prévert", where: "A section, G minor", chords: "Cm7 F7 B♭maj7 E♭maj7 Am7b5 D7 Gm", labels: "iv7 ♭VII7 ♭IIImaj7 ♭VImaj7 iiø7 V7 i", nodes: ["circle", "iiVI", "guide"],
      note: "A full circle of fifths: two ii–V–I's, one major and one minor." },
    { title: "In My Life", artist: "The Beatles", where: "verse, A major", chords: "A E F♯m A7 D Dm A", labels: "I V vi I7 IV iv I", nodes: ["iv", "secdom", "cadence"],
      note: "A7 is the V of IV; D → Dm is the borrowed iv." },
    { title: "My Funny Valentine", artist: "Rodgers & Hart", where: "opening, C minor", chords: "Cm Cmmaj7 Cm7 Cm6", labels: "i i(maj7) i7 i6", nodes: ["cliche"] },
    { title: "Bennie and the Jets", artist: "Elton John", where: "around 0:33, G major", chords: "G G♯dim7 Am7", labels: "I ♯i°7 ii7", nodes: ["dim7"],
      note: "A passing diminished 7th: G♯ is the leading tone into A." },
    { title: "April in Paris", artist: "Vernon Duke", where: "bars 11–12 (shown in C)", chords: "Dm7 D♭7 Cmaj7", labels: "ii7 ♭II7 Imaj7", nodes: ["tritone", "iiVI"] },
    { title: "The Girl from Ipanema", artist: "Jobim", where: "A section, F major (medium confidence)", chords: "Fmaj7 G7 Gm7 G♭7 Fmaj7", labels: "Imaj7 V7/V ii7 ♭II7 Imaj7", nodes: ["tritone", "secdom"] },
    { title: "Sweet Georgia Brown", artist: "Bernie & Pinkard", where: "opening (shown in C)", chords: "A7 D7 G7 C", labels: "V7/V/V V7/V V7 I", nodes: ["secdom", "chain", "circle"] },
    { title: "Island in the Sun", artist: "Weezer", where: "loop (shown in C)", chords: "Am Dm G C", labels: "vi ii V I", nodes: ["circle"] },
    { title: "Super Mario Bros. fanfare", artist: "Koji Kondo", where: "level complete (shown in C)", chords: "A♭ B♭ C", labels: "♭VI ♭VII I", nodes: ["flat67"] },
    { title: "Sultans of Swing", artist: "Dire Straits", where: "verse, D minor", chords: "Dm C B♭ A", labels: "i ♭VII ♭VI V", nodes: ["andalusian"] },
    { title: "Hit the Road Jack", artist: "Ray Charles", where: "loop (shown in A minor)", chords: "Am G F E", labels: "i ♭VII ♭VI V", nodes: ["andalusian"] },
    { title: "Johnny B. Goode", artist: "Chuck Berry", where: "12-bar form, B♭", chords: "B♭7 B♭7 B♭7 B♭7 E♭7 E♭7 B♭7 B♭7 F7 E♭7 B♭7 F7", labels: "I7 I7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7", nodes: ["blues"] },
    { title: "With or Without You", artist: "U2", where: "loop, D major", chords: "D A Bm G", labels: "I V vi IV", nodes: ["popaxis"] },
    { title: "Someone Like You", artist: "Adele", where: "loop, A major", chords: "A E F♯m D", labels: "I V vi IV", nodes: ["popaxis"] },
  ];
  // Mentions without playback (documented, but the exact chords are not encoded here).
  const MENTIONS = {
    // Confirmed by the user, 2026-11-19: each chord's plucking pattern is in 10ths.
    octaves: ["10ths: Red Hot Chili Peppers, Road Trippin' (the plucked pattern in each chord)"],
    neapolitan: ["Beethoven, Moonlight Sonata I (opening)", "John Williams, Raiders March"],
    sus: ["Picardy third: The Zombies, Time of the Season; Mozart, Lacrimosa", "Sus4 strums: Pinball Wizard, Free Fallin'"],
    mediant: ["♭III: Linus and Lucy", "♭VI: Brahms, Symphony No. 3, II"],
    andalusian: ["California Dreamin'", "Bach, Chaconne in D minor"],
    tritone: ["Schubert, String Quintet (final cadence)"],
    cliche: ["Stairway to Heaven intro (the line is in the bass)"],
    cadence: ["Deceptive V→vi: Bach, WTC II F-minor Prelude"],
    blues: ["Hound Dog", "Rock Around the Clock"],
    flat7: ["Sweet Child o' Mine (Mixolydian)"],
  };

  // ---------------------------------------------------------------- widget
  M.moveGraph = { NODES, EDGES, PATHS, SONGS };

  // Songs for one lesson: <div class="mf-widget" data-widget="songs" data-moves="cadence,keymap">
  M.register("songs", (root, opts) => {
    const ids = (opts.moves || "").split(",").map((x) => x.trim());
    const songs = SONGS.filter((x) => x.nodes.some((id) => ids.includes(id)));
    const mentions = ids.flatMap((id) => MENTIONS[id] || []);
    el("p", { html: "<b>Heard in:</b>" }, root);
    const bar = controls(root);
    const box = el("div", { class: "mf-graph-card" }, root);
    box.style.display = "none";
    songs.forEach((x) => button(bar, `▶ ${x.title}`, () => {
      box.style.display = "";
      box.innerHTML = "";
      const head = el("div", { class: "mf-graph-head" }, box);
      el("b", { text: x.title, class: "mf-graph-title" }, head);
      el("span", { class: "mf-graph-sig", text: `${x.artist} · ${x.where}` }, head);
      if (x.note) el("p", { text: x.note }, box);
      const d = el("div", { class: "mf-widget", "data-widget": "progression", "data-chords": x.chords, "data-labels": x.labels || "", "data-position": "5" }, box);
      d.dataset.note = "Our synth plays the chord progression only, not the recording.";
      M.mountAll();
    }));
    if (mentions.length) el("p", { class: "mf-readout", text: mentions.join(" · ") }, root);
  });

  M.register("move-graph", (root) => {
    const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
    let mode = 0, sel = null, path = null, song = null, step = 0;

    const ctl = controls(root);
    el("span", { class: "mf-readout", text: "View:" }, ctl);
    toggleGroup(ctl, ["Explore", ...PATHS.map((p) => p.name)], (i) => {
      mode = i; path = i ? PATHS[i - 1] : null; song = null; songSel.value = ""; step = 0;
      sel = path ? path.nodes[0] : null;
      draw(); card();
    });
    const ctl2 = controls(root);
    el("span", { class: "mf-readout", text: "Song:" }, ctl2);
    const songSel = el("select", {}, ctl2);
    el("option", { value: "", text: "— pick a song to see its moves —" }, songSel);
    SONGS.forEach((s, i) => el("option", { value: i, text: `${s.title} (${s.artist})` }, songSel));
    songSel.addEventListener("change", () => {
      song = songSel.value === "" ? null : SONGS[Number(songSel.value)];
      draw(); card();
    });

    const W = 800, H = 470;
    const s = canvas(root, W, H);
    s.style.maxHeight = "520px";
    const panel = el("div", { class: "mf-graph-card" }, root);

    function neighbours(id) {
      const out = new Set();
      EDGES.forEach(([a, b]) => { if (a === id) out.add(b); if (b === id) out.add(a); });
      return out;
    }

    function draw() {
      s.innerHTML = "";
      const defs = svg("defs", {}, s);
      const mk = svg("marker", { id: "mg-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, defs);
      svg("path", { d: "M0 0 L10 5 L0 10 z", fill: "#9aa5b1" }, mk);

      Object.values(CLUSTERS).forEach((c) => {
        const [x, y, w, h] = c.box;
        svg("rect", { x, y, width: w, height: h, rx: 12, fill: c.color, opacity: 0.06 }, s);
        svg("text", { x: x + 10, y: y + 18, "font-size": 12, "font-weight": 700, fill: c.color, text: c.name }, s);
        svg("text", { x: x + 10, y: y + 32, "font-size": 10, fill: c.color, opacity: 0.85, text: c.sub }, s);
      });

      const active = new Set(song ? song.nodes : path ? path.nodes : sel ? [sel, ...neighbours(sel)] : NODES.map((n) => n.id));
      const focus = song || path || sel;

      EDGES.forEach(([a, b, t]) => {
        const A = byId[a], B = byId[b], st = EDGE_STYLE[t];
        const on = !focus || (sel && !path && !song ? a === sel || b === sel : active.has(a) && active.has(b));
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        const bend = t === "s" ? 28 : 10;
        const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
        const cx = mx - (dy / L) * bend, cy = my + (dx / L) * bend;
        // stop short of the pill so the arrowhead is visible
        const ex = B.x - (dx / L) * 18, ey = B.y - (dy / L) * 14;
        svg("path", {
          d: `M${A.x} ${A.y} Q${cx} ${cy} ${t === "n" ? ex : B.x} ${t === "n" ? ey : B.y}`,
          fill: "none", stroke: st.stroke, "stroke-width": on && focus ? 2 : 1.2, "stroke-dasharray": st.dash,
          opacity: on ? (focus ? 0.9 : 0.45) : 0.08, "marker-end": t === "n" ? "url(#mg-arrow)" : null,
        }, s);
      });

      if (path) {
        const pts = path.nodes.map((id) => `${byId[id].x},${byId[id].y}`).join(" ");
        svg("polyline", { points: pts, fill: "none", stroke: "#e0a82b", "stroke-width": 4, opacity: 0.5, "stroke-linejoin": "round" }, s);
      }

      NODES.forEach((n) => {
        const c = CLUSTERS[n.c];
        const on = active.has(n.id);
        const g = svg("g", { class: "mf-clickable", opacity: on ? 1 : 0.25 }, s);
        const w = 118, h = 26;
        const isSel = n.id === sel;
        svg("rect", {
          x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: 13,
          fill: isSel ? c.color : "#fff", stroke: c.color,
          "stroke-width": isSel ? 2.5 : 1.5,         }, g);
        svg("text", { x: n.x, y: n.y + 4, "font-size": 11, "font-weight": 600, "text-anchor": "middle", fill: isSel ? "#fff" : "#1f2933", text: n.label }, g);
        if (path && path.nodes.includes(n.id)) {
          const k = path.nodes.indexOf(n.id);
          svg("circle", { cx: n.x - w / 2 + 2, cy: n.y - h / 2 + 2, r: 10, fill: k === step ? "#e0a82b" : "#1f2933", stroke: "#fff", "stroke-width": 1.5 }, g);
          svg("text", { x: n.x - w / 2 + 2, y: n.y - h / 2 + 6.5, "font-size": 12, "font-weight": 800, "text-anchor": "middle", fill: "#fff", text: k + 1 }, g);
        }
        g.addEventListener("click", () => {
          if (path && path.nodes.includes(n.id)) step = path.nodes.indexOf(n.id);
          sel = n.id; if (!path) song = null; if (!path) songSel.value = "";
          draw(); card();
        });
      });

      // legend
      let lx = 14;
      Object.entries(EDGE_STYLE).forEach(([t, st]) => {
        svg("line", { x1: lx, y1: H - 6, x2: lx + 26, y2: H - 6, stroke: st.stroke, "stroke-width": 2, "stroke-dasharray": st.dash }, s);
        svg("text", { x: lx + 32, y: H - 2, "font-size": 10, fill: "#52606d", text: st.label }, s);
        lx += 130;
      });
    }

    // An embedded progression player for a node demo or a song.
    function player(parent, chords, labels, note, shell) {
      const d = el("div", { class: "mf-widget", "data-widget": "progression", "data-chords": chords, "data-labels": labels || "", "data-position": "5" }, parent);
      if (note) d.dataset.note = note;
      if (shell) { d.dataset.voicing = "shell"; d.dataset.shells = "toggle"; }
      M.mountAll();
    }

    function chip(parent, id) {
      const n = byId[id];
      const b = el("button", { type: "button", text: n.label }, parent);
      b.style.borderColor = CLUSTERS[n.c].color;
      b.addEventListener("click", () => { sel = id; if (path && path.nodes.includes(id)) step = path.nodes.indexOf(id); draw(); card(); });
    }

    function card() {
      panel.innerHTML = "";
      if (song && !sel) return songCard();
      if (song) return songCard();
      if (!sel) {
        el("p", { class: "mf-readout", html: "Each box is a <b>move</b>: a way of getting from one chord to the next. Boxes are grouped by <b>how the voices move</b>. Click a move to see how it works, hear it, and find songs that use it, or pick a <b>path</b> or a <b>song</b> above." }, panel);
        return;
      }
      const n = byId[sel], c = CLUSTERS[n.c];
      if (path && !path.nodes.includes(sel)) {
        const nav = el("div", { class: "mf-controls" }, panel);
        el("span", { class: "mf-readout", html: `Off the <b>${path.name}</b> path.` }, nav);
        button(nav, "Back to the path", () => { sel = path.nodes[step]; draw(); card(); });
      } else if (path) {
        const nav = el("div", { class: "mf-controls" }, panel);
        el("span", { class: "mf-readout", html: `<b>${path.name}</b> path, step ${step + 1} of ${path.nodes.length}. ${path.note}` }, nav);
        button(nav, "◀ Back", () => { step = Math.max(0, step - 1); sel = path.nodes[step]; draw(); card(); });
        button(nav, "Next ▶", () => { step = Math.min(path.nodes.length - 1, step + 1); sel = path.nodes[step]; draw(); card(); });
      }
      const head = el("div", { class: "mf-graph-head" }, panel);
      el("span", { class: "mf-graph-tag", text: c.name, style: `background:${c.color}` }, head);
      el("b", { text: n.label, class: "mf-graph-title" }, head);
      el("span", { class: "mf-graph-sig", text: n.sig }, head);
      el("p", { text: n.idea }, panel);
      if (n.neck) el("p", { html: `<b>On the neck:</b> ${n.neck}` }, panel);
      if (n.demo) {
        const [ch, lb] = n.demo.split("|").map((x) => x.trim());
        player(panel, ch, lb, null, n.shell);
      }
      const songs = SONGS.filter((x) => x.nodes.includes(n.id));
      const mentions = MENTIONS[n.id] || [];
      if (songs.length || mentions.length) {
        const sp = el("div", { class: "mf-controls" }, panel);
        el("span", { class: "mf-readout", html: "<b>Heard in:</b>" }, sp);
        songs.forEach((x) => button(sp, `▶ ${x.title}`, () => { song = x; songSel.value = SONGS.indexOf(x); draw(); card(); }));
        mentions.forEach((m) => el("span", { class: "mf-readout", text: "· " + m }, sp));
      }
      const other = ([a, b]) => (a === n.id ? b : a);
      const touching = EDGES.filter(([a, b]) => a === n.id || b === n.id);
      const groups = [
        ["Builds on:", touching.filter(([a, b, t]) => t === "n" && b === n.id).map(other)],
        ["Leads to:", touching.filter(([a, b, t]) => t === "n" && a === n.id).map(other)],
        ["Variants:", touching.filter(([, , t]) => t === "v").map(other)],
        ["Same mechanism as:", touching.filter(([, , t]) => t === "s").map(other)],
      ];
      groups.forEach(([label, ids]) => {
        if (!ids.length) return;
        const r = el("div", { class: "mf-controls" }, panel);
        el("span", { class: "mf-readout", text: label }, r);
        ids.forEach((id) => chip(r, id));
      });
      if (n.lesson) el("p", { html: `<a href="${n.lesson}">Open the full lesson →</a>` }, panel);
    }

    function songCard() {
      const head = el("div", { class: "mf-graph-head" }, panel);
      el("span", { class: "mf-graph-tag", text: "Song", style: "background:#1f2933" }, head);
      el("b", { text: `${song.title}`, class: "mf-graph-title" }, head);
      el("span", { class: "mf-graph-sig", text: `${song.artist} · ${song.where}` }, head);
      if (song.note) el("p", { text: song.note }, panel);
      const r = el("div", { class: "mf-controls" }, panel);
      el("span", { class: "mf-readout", text: "Moves used:" }, r);
      song.nodes.forEach((id) => chip(r, id));
      player(panel, song.chords, song.labels, "Our synth plays the chord progression only, not the recording.");
    }

    draw();
    card();
  });
})();
