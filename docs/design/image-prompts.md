# Image generation guide — ВТБ × МСФО practicum

This UI redesign is fully coded with **vector/CSS** for all structural art (logo mark,
icons, graph nodes, gradients, confetti, level ring). The slots below are the **raster
images** the product still needs. None block the UI — every slot has a working CSS/SVG
fallback — but real art makes lesson and marketing surfaces sing.

I cannot generate images, so each slot lists a **ready-to-paste prompt** for an image
model (Midjourney / DALL·E 3 / SDXL / Firefly), the exact **file path** the code expects,
the **size**, and where it is wired in.

---

## 0. Shared house style (paste into every prompt)

Keep all images consistent with the ВТБ identity:

> **Style anchor:** modern flat corporate-fintech illustration, ВТБ bank brand. Calm,
> trustworthy, premium. Deep royal-blue `#071F5C → #1340C0` to bright sky-azure `#03A6E8`
> gradients, accent gold `#FFB547`, lots of clean white space. Soft geometric shapes, a
> subtle "horizon / wing" arc motif. Crisp vector look, gentle long shadows, no clutter.
> No text, no words, no logos, no UI chrome, no charts with fake numbers.

> **Negative / avoid:** photorealism, stock-photo people, harsh neon, purple, drop
> shadows that look 3D-rendered, busy backgrounds, watermarks, lens flare, gibberish text,
> dollar signs, cryptocurrency imagery.

Format: **PNG** (or WEBP), sRGB. Export @2x for retina where noted.

---

## 1. Lesson hero banners  ⭐ highest impact

- **Where:** top of every lesson — `LessonPage.tsx`, `LESSON_HERO_IMAGES` map.
- **Path:** `frontend/public/lesson-images/<name>.png`
- **Size:** **1600 × 640** (2.5:1), safe margins — nothing important in the outer 8%.
- **Wiring:** add `"<lesson-slug>": "/lesson-images/<name>.png"` to `LESSON_HERO_IMAGES`.
  Lessons without an entry fall back to a blue gradient strip, so this is incremental.

Two files already exist (`ifrs-16-lease-hero.png`, `ifrs-15-revenue-hero.png`) and are
currently mapped to the placeholder personal-finance slugs — re-map them to the real IFRS
lessons once content lands. Prompts per flagship standard:

| File | Standard | Prompt (append the house style from §0) |
|---|---|---|
| `ifrs-16-lease-hero.png` | IFRS 16 Leases | "A clean isometric illustration of a small building / office and a delivery truck connected by a flowing azure ribbon that curves like a balance-sheet timeline, symbolising a lease right-of-use asset; minimal, lots of white space, blue-to-azure gradient." |
| `ias-12-tax-hero.png` | IAS 12 Deferred tax | "Two stacked translucent ledger layers slightly offset, one labelled-feel 'book' and one 'tax', with a soft glowing gap between them representing a temporary difference; abstract, geometric, blue gradient, gold spark accent." |
| `ifrs-10-consolidation-hero.png` | IFRS 10 / 3 Consolidation | "Three abstract rounded building blocks merging into one larger unified block via smooth connecting arcs, parent-and-subsidiary metaphor; flat vector, azure gradient, sense of structure and control." |
| `ias-36-impairment-hero.png` | IAS 36 Impairment | "A simple bar/asset shape with its top portion gently dissolving into light particles, value being written down; calm not alarming, blue gradient, subtle downward arc." |
| `ifrs-15-revenue-hero.png` | IFRS 15 Revenue | "A staircase of five ascending rounded steps with a flowing ribbon travelling up them (the 5-step revenue model), a contract scroll abstracted into clean geometry; blue-to-azure, optimistic upward motion." |

---

## 2. Map hero illustration (optional accent)

- **Where:** right side of the gradient hero on the map — `MapPage.tsx` `.vtb-hero`.
- **Now:** a faint `BrandMark` SVG wing sits there. A transparent PNG can replace/augment it.
- **Path:** `frontend/public/brand/map-hero.png`  ·  **Size:** **720 × 560**, transparent background.
- **Prompt:** "Transparent-background flat illustration of an abstract ascending learning
  path: a winding azure ribbon rising from bottom-left to top-right with 4–5 glowing node
  dots along it and a small gold star at the summit; light, airy, sits over a deep-blue
  panel; white and sky-azure tones only." (+ §0)
- To use it, drop an `<img src="/brand/map-hero.png">` absolutely positioned in `.vtb-hero`.

---

## 3. Auth split-screen illustration (optional)

- **Where:** left brand panel of login/register — `AuthLayout.tsx` `.vtb-auth-aside`.
- **Now:** gradient + radial glow + `BrandMark`. A hero illustration deepens it.
- **Path:** `frontend/public/brand/auth-aside.png`  ·  **Size:** **900 × 1000** (portrait), can bleed.
- **Prompt:** "Flat corporate illustration of a confident finance professional's abstract
  workspace seen from above: a spreadsheet grid morphing into a smooth upward azure growth
  arc, a few floating rounded cards and a gold star, no human faces; premium ВТБ blue
  gradient, lots of negative space on the left for text overlay." (+ §0)

---

## 4. Course cover thumbnails (optional)

- **Where:** course cards — `CoursesPage.tsx` (currently a gradient icon tile).
- **Path:** `frontend/public/courses/<course-slug>.png`  ·  **Size:** **640 × 360** (16:9).
- **Prompt template:** "Flat minimal cover for an IFRS module about **<topic>**: one bold
  central geometric metaphor for the standard, blue-to-azure gradient, single gold accent,
  generous margins, no text." (+ §0). Swap `<topic>` per course (leases, deferred tax, …).
- Wire by adding an `<Image>` at the top of the course `Card`.

---

## 5. Level-up medal (optional upgrade to the reward)

- **Where:** the level-up celebration — `reward.tsx`, inside `.vtb-level-badge`.
- **Now:** an animated gold CSS ring with the level number — looks great already. A medal
  PNG can sit *behind* the number for extra flourish.
- **Path:** `frontend/public/brand/level-medal.png`  ·  **Size:** **264 × 264** (@2x of 132), transparent.
- **Prompt:** "Transparent-background flat icon of a premium gold-and-azure achievement
  medal / star badge with soft radial glow and tiny sparkles, centred, symmetrical, empty
  smooth center area to overlay a number; ВТБ blue + gold." (+ §0)

---

## 6. Favicon + social share (recommended for launch)

- **Favicon** — `frontend/public/favicon.svg` (+ `favicon.ico` 32×32 fallback). Add
  `<link rel="icon" href="/favicon.svg">` to `index.html`.
  - Prompt: "A simple app-icon: white ВТБ horizon/wing mark on a deep-blue `#071F5C`
    rounded-square gradient tile, centered, crisp at 32px." (+ §0)
- **Open Graph / share card** — `frontend/public/og-cover.png`, **1200 × 630**. Add
  `<meta property="og:image">`.
  - Prompt: "Wide social banner, deep-blue-to-azure gradient, abstract rising learning
    path with node dots and a gold star on the right third, clean empty left two-thirds for
    a title overlay, premium ВТБ fintech feel, no text." (+ §0)

---

## Production tips

- Generate at **2× the listed size**, then downscale — keeps edges crisp on retina.
- Run finals through `pngquant`/`squoosh`; hero banners should land **< 200 KB**.
- Keep a consistent light source (top-left) and the same gradient direction across the set
  so lessons feel like one family.
- For transparent slots (§2, §3, §5, §6 favicon) export **PNG-24 with alpha**.
