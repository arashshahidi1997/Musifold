---
marp: true
---

## 1. Single image: basic positioning

### 1.1 Center an image (most common)

Marp themes often center block elements already, but this is the **explicit & reliable** way:

![Harmonic series](image.png){style="display:block; margin: 0 auto;"}

You can also combine with size:

![Harmonic series](image.png){style="display:block; margin: 1.5rem auto; width: 60%;"}

---

### 1.2 Left / right alignment

#### Left-aligned with some text below/above

![Harmonic series](image.png){style="display:block; margin: 0 0 1rem 0;"}

Some explanatory text below the image…


#### Float left with text wrapping

![Harmonic series](image.png){style="float:left; width:40%; margin:0 1rem 1rem 0;"}

This text will wrap around the image on the right side. Useful for diagrams
with a paragraph-style explanation beside them.


#### Float right with text wrapping

![Harmonic series](image.png){style="float:right; width:40%; margin:0 0 1rem 1rem;"}

Text wraps on the left of the image now.


> Tip: if layout looks weird, clear the float later:
>
> > <divstyle="clear:both;"></div>
> 

---

### 1.3 Control size: width / height

#### By width (most common)

![Harmonic series](image.png){style="width:50%; max-width:600px;"}


#### By height

![Harmonic series](image.png){style="height:250px; object-fit:contain;"}


---

### 1.4 Add margin, border, radius

![Harmonic series](image.png){
 style="display:block; margin:1.5rem auto; width:60%; border-radius:8px; border:1px solid #ccc;"
}


---

### 1.5 Absolute positioning (more advanced, precise placement)

Use when you want the image at an exact spot and text elsewhere:

![Harmonic series](image.png){
 style="position:absolute; top:120px; right:40px; width:35%;"
}

# 1.1 The harmonic series

Main text stays in the normal flow here…


> Works best in themes where the slide content is relatively positioned.

---

## 2. Multiple images on one slide

### 2.1 Simple side-by-side (flexbox)

Use HTML + CSS (Marp supports this):

<divstyle="display:flex; justify-content:space-between; align-items:center; gap:1rem;">

  <img src="image1.png"style="width:48%;">

  <img src="image2.png"style="width:48%;">

</div>


* `gap` controls spacing.
* Adjust widths so the sum + gaps ≈ 100%.

---

### 2.2 Centered row of small icons / images

<divstyle="display:flex; justify-content:center; gap:2rem;">

  <img src="img1.png"style="width:80px;">
  <img src="img2.png"style="width:80px;">
  <img src="img3.png"style="width:80px;">

</div>


Great for quick comparisons or “three key ideas” slides.

---

### 2.3 Two-column layout: image + text

<divstyle="display:flex; align-items:flex-start; gap:1.5rem;">

  <divstyle="flex:1;">
    <h2>The harmonic series</h2>
    <p>Short explanation goes here…</p>
  </div>

  <divstyle="flex:1;">
    <img src="image.png"style="width:100%; border-radius:8px;">
  </div>

</div>


---

### 2.4 Image grid (2×2, etc.)

<divstyle="display:flex; flex-wrap:wrap; gap:1rem;">

  <img src="img1.png"style="width:48%;">
  <img src="img2.png"style="width:48%;">
  <img src="img3.png"style="width:48%;">
  <img src="img4.png"style="width:48%;">

</div>


---

## 3. Slide background images (special but very useful)

For when the **image *is* the slide background**, not inline content:

![bg](image.png)

# Title on top

Some text over the background.


Common variations:

![bg fit](image.png)      <!-- contain-like -->
![bg cover](image.png)    <!-- cover entire slide -->
![bg left](image.png)     <!-- anchored left -->
![bg right](image.png)    <!-- anchored right -->

---

You can also combine:

![bg cover](image.png)

# Text on top of full-screen background
