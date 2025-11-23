---
marp: true
theme: default
---

<style>
  body {
    background: #fafafa;
    font-family: sans-serif;
    width: 800px;
    margin: 0 auto; /* centers the page */
  }
  h1 {
    color: red;
  }
</style>

Below is a **minimal, clean version of the notes** following your refined outline, with the *toroidal geometry section removed*.
I’ve added **placeholders** for equations, diagrams, and interactive HTML widgets — clearly labeled so you can fill them later.

Everything is written to preserve the narrative flow and avoid unnecessary elaboration.

---

# **Music Theory Fundamentals: A Minimal Narrative**

---

# **0. Why Music Has Structure**

Music may feel like cultural invention, but its foundations come directly from:

* **physics** (vibration & overtones)
* **mathematics** (simple ratios → stable intervals)
* **geometry** (how chords relate in space)
* **perception** (why tension & release feel natural)

This set of notes follows how these ideas build into scales, modes, triads, tuning, harmonic motion, and practical musicianship.

---

# **1. Sound, Overtones, and Generating Intervals**

## **1.1 The harmonic series**

Every musical tone contains multiple frequencies vibrating together.
These frequencies occur at integer multiples:

> **f, 2f, 3f, 4f, 5f, …**
> *(Insert: diagram of harmonic series here)*

Important resulting intervals:

* **Octave**: 2:1
* **Perfect 5th**: 3:2
* **Perfect 4th**: 4:3

These are the first *highly consonant* intervals.
They are stable because their waveforms align with minimal beating.

*(Placeholder for simple beats visualization HTML widget)*

---

## **1.2 Stacking perfect 5ths → the Pythagorean scale**

If we repeatedly multiply by 3/2 and fold results into one octave:

> ( f \times (3/2)^n \mod 2 )

we generate the **circle of fifths**.

*(Insert: circle of fifths diagram here)*

Selecting seven fifths in order gives the familiar diatonic notes.
This is the origin of the **Pythagorean scale**.

### Triads emerge automatically

The overtone ratios 4:5:6 produce a **major triad**.
Thus, consonant chords are *not invented* — they are discovered within the harmonic series.

*(Placeholder for diagram of 4:5:6 stacking into major chord)*

---

# **2. Tuning Systems and the Need for Temperament**

## **2.1 Why tuning is impossible to perfect**

Stack twelve perfect 5ths:

> ( (3/2)^{12} \neq 2^7 )

This mismatch is the **Pythagorean comma**.
As a consequence:

> **We cannot tune all intervals perfectly at once.**

*(Insert: equation comparison + graph of accumulating error)*

---

## **2.2 Equal Temperament (ET) as the compromise**

ET divides the octave into 12 equal ratios:

> ( 2^{1/12} )

Its benefits:

* every key sounds the same
* transposition and modulation become seamless
* geometric relationships between notes become uniform

Downside:
none of the intervals except the octave are perfectly pure.

*(Insert: table comparing pure vs ET interval ratios)*

---

# **3. Tetrachords and Scale Construction**

## **3.1 Modern pedagogical tetrachords**

We adopt four patterns (not ancient Greek ones):

* **Ionian:** W–W–H
* **Dorian:** W–H–W
* **Phrygian:** H–W–W
* **Lydian:** W–W–W

*(Insert: diagram of whole/half steps inside a tetrachord)*

A **scale** = tetrachord + whole step + tetrachord.

---

## **3.2 Two fundamental generative sequences**

### **A. The Moving Window**

Take a major scale and begin on each degree:

> Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian.

*(Insert: interactive HTML keyboard/mouse-over showing each mode)*

This is the **modal perspective** familiar today.

---

### **B. Combining Tetrachord Types**

Scale = lower tetrachord + upper tetrachord.

Examples:

* Ionian + Ionian → **Major**
* Lydian + Ionian → **Lydian**
* Ionian + Dorian → **Mixolydian**
* Dorian + Phrygian → **Minor**

This reveals the **architectural symmetry** inside the diatonic system.

*(Insert: diagram of tetrachord stacking, maybe a matrix)*

---

# **4. Geometry of Chords and Voice-Leading**

## **4.1 The Tonnetz (triads as geometric objects)**

Arrange pitches so:

* horizontal direction = fifths
* diagonal directions = major/minor thirds

Then each major/minor triad forms a small triangle.

*(Insert: Tonnetz grid diagram)*

This gives a **visual map of harmonic space**.

---

<iframe src="https://www.madmusicalscience.com/tradtonnetz.html"
    title="Iframe title"
    style="width:100%;height:600px;border:1px solid #ccc;border-radius:4px;"
    loading="lazy"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups">
  Your browser does not support iframes — view it here:
  <a href="https://www.madmusicalscience.com/tradtonnetz.html" target="_blank" rel="noopener noreferrer">Iframe title</a>
</iframe>

---

[Open interactive Tonnetz](https://www.madmusicalscience.com/tradtonnetz.html)


---

## **4.2 Smooth voice-leading as geometric proximity**

Chord changes sound smooth when their notes move short distances.
On the Tonnetz, close-position triads are literally **adjacent**.

This shows why certain progressions feel natural — they follow short geometric paths.

*(Insert: arrows showing common chord moves on Tonnetz)*

---

# **5. The Resolution Principle**

## **5.1 Why dominant → tonic resolves**

Three factors:

1. **Leading tone** moves by the smallest melodic interval
2. **Chordal 7th** falls downward
3. **Overtones of V** overlap with **overtones of I**, reducing beating

*(Insert: overtone overlap diagram)*

---

## **5.2 Tension as “distance”**

Consonant chords = small distances in harmonic space
Dissonant chords = larger distances
Harmonic motion = navigating this space efficiently

*(Placeholder for simple interactive Tonnetz walk-through)*

---

# **6. Application to Violin (Minimal but Essential)**

## **6.1 Tetrachords = Left-Hand Frames**

Each tetrachord corresponds to a repeatable 4-finger pattern.
Mastering these patterns improves:

* shifting
* scale fluency
* intonation consistency

*(Insert: hand-frame diagrams for the four tetrachords)*

---

## **6.2 Intonation on a violin**

String players often tune:

* 4ths & 5ths **pure** for resonance
* 3rds **just** when harmonizing
* melodic intervals **expressively**, not rigidly ET

Understanding the underlying acoustics helps maintain good intonation.

*(Insert: audio comparison pure vs ET intervals)*

