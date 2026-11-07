# DangerNode — Design Spec v0.3

Supersedes v0.2 (and the original `antinode-calculator-spec.md` v0.1 draft).
Carries forward everything from v0.2 unless noted below; this doc records the
decisions made during project kickoff and the course corrections since.

**What changed in v0.3 (2026-11-07)** — the physics polarity was inverted and
the scope was narrowed. See "Model correction" below. In short: the danger
zones are the neighbourhoods of **half-wave multiples (integer n)**, not even
n; the separate EFHW tab is gone (an EFHW is just a random wire whose length
happens to be a half-wave multiple on its lowest band); the chart is bounded
to the user's selected bands; fonts are embedded.

## One-liner
A browser tool that takes a wire length and the bands you plan to work, and
shows — graphically — the frequencies where that wire's feedpoint will be
**high impedance** (a half-wave multiple: hard or impossible for a tuner to
match) so you can choose a length, or a switching scheme, that keeps those
"danger nodes" out of your bands before you're standing in a field with a
NanoVNA.

## Name
**DangerNode**. Tagline: "Know your antinodes before you cut the wire."
Chosen over Antinodeikon (too hard to say/spell for a tool people need to
find again) and plain "Danger Zone" (fun but generic, collides with a dozen
other tools/media). DangerNode reads clearly, types cleanly as a repo/PWA
slug, and is built directly from the tool's own core vocabulary (node =
the thing you're trying to avoid).

## Usage pattern
Not a continuously-running field instrument — a one-shot sanity check the
operator runs once before or during setup, to check candidate wire lengths
against the day's operations plan (which bands they intend to work). Works
offline, fast to open, fast to get an answer from, readable outdoors.

## Audience and scope for v1
**End-fed random-wire (EFRW) owners.** The goal is to show them which
lengths to *avoid* for the bands they've selected, where "avoid" means
"close to a half-wave multiple on one of those bands."

- One calculator view (plus a Settings view). There is no EFHW/Random Wire
  split: an end-fed half-wave is simply the special case where the wire is
  one half-wave on its lowest band — and therefore sits *on* a danger node
  on that band (and on its harmonics) as far as this tool is concerned. That
  is correct for what the tool measures (high feedpoint Z, which is exactly
  why an EFHW needs its 49:1 transformer) but it means DangerNode is not an
  EFHW design aid. Someone building an EFHW wants the opposite of what this
  tool highlights.
- Counterpoise-length *reference* number is shown always, informational
  only (see decision 5).

Center-fed dipoles remain a v2 addition (different feedpoint mapping), not
in v1.

## Core physics model
- Effective half-wavelength of the wire: `hw = (492 * VF) / f_MHz` (feet), or
  metric equivalent. VF (velocity factor) defaults ~0.95 for bare wire,
  lower for insulated wire, **globally adjustable** — see decision 4.
- For a fixed wire length `L`, electrical length in half-waves at frequency
  `f`: `n = L / hw(f)`
- The far end of the wire is open, so it is a voltage antinode. The feedpoint
  is `L` back from that end:
  - **Integer n** (the wire is an exact multiple of a half-wave) → the
    feedpoint is also a voltage antinode → **high Z** (up to several kΩ),
    hard for a tuner to match. This is the *danger node*. It applies to every
    integer — odd and even alike.
  - **Half-integer n** (odd quarter-waves: n = ½, 1½, 2½…) → the feedpoint is
    near a current antinode → **low Z, high current**. This is where a
    random wire is happiest.
- "Danger zone" = proximity of `n` to the nearest **integer**, within a
  user-adjustable tolerance, default ±0.07 in n, exposed as a slider.
  The largest possible distance from an integer is 0.5. The amber "marginal"
  buffer is 2× the tolerance.
- Chart curve (display only): `|cos(nπ)|` — 1 at integer n ("High Z"), 0 at
  half-integer n ("Low Z"). Smooth, standing-wave-envelope shaped. It conveys
  *where along the spectrum* a given length is high-Z versus high-current;
  it is not a computed impedance value. Verdicts use the distance metric, not
  the curve.
- First-order model (open-wire standing-wave assumption). No claim to
  replace NanoVNA measurement.

### Model correction (2026-11-07)
v0.2 had the polarity backwards: it treated *even* n as the low-Z danger
case and *odd* n as the good, high-Z case. That is the mapping for a
center-fed dipole. For an end-fed wire every integer n is high-Z. The
visible symptom was that the "sanity check" flagged the 2nd harmonic of a
68 ft wire on 20m as a node — the exact opposite of how an EFHW behaves
there. The three things that changed: `distanceToNearestEven` became
`distanceToNearestHalfWave`; the straddle test in `bandVerdict` became
`ceil(lo) <= hi`; and the chart curve flipped from `|sin(nπ/2)|` to
`|cos(nπ)|`. Suggested lengths moved from odd n to half-integer n.

## Resolved decisions

1. **Default band list**: Full US General/Extra allocations (not
   phone-only sub-bands) as a fixed default set. Keep the band table as a
   plain data array so adding WARC or phone-only sub-bands later is a
   one-line change, not a redesign. 60m (channelized) is deliberately
   omitted.

2. **Danger-zone tolerance**: Ship with a default (~±0.07 in n) and a
   visible slider, rather than forcing the user to pick with no default.
   Slider range is 0.01–0.20 (v0.3; was 0.01–0.30 when the metric ran 0–1
   — the new metric runs 0–0.5, so 0.20 already leaves only n within 0.1 of a
   half-integer as "good"). Only add fidelity (asymmetric tolerance,
   per-band tolerance) if the flat default demonstrably gets in the way.
   **Addendum — "Tuner Comfort Zone"**: a radio group (Settings tab) that is
   a labeled shortcut into this same slider: "No tuner (must be resonant)" /
   "Basic tuner" / "Wide-range tuner (G90-class)", currently **0.15 / 0.07 /
   0.03** (rescaled from 0.18 / 0.07 / 0.03 for the 0–0.5 metric).
   No new calculation. **These three numbers are placeholder estimates, not
   derived from any real impedance model** — there is no principled
   n-to-SWR conversion without an actual R+jX model (explicitly out of scope).
   The user intends to cross-check a few lengths against a NanoVNA and their
   tuner's actual match range, then replace these with measured values.
   Don't treat them as validated.
   *Direction note*: `tolerance` is the radius of the danger zone, so a
   larger tolerance = a wider red zone. No tuner can't compensate for
   mismatch, so it wants a wide zone (large tolerance); a wide-range tuner
   only fails very close to the node (small tolerance).

3. **Multi-wire comparison**: **In v1.** 2–3 simultaneous length sliders on
   the same chart for comparing candidate lengths side by side — NOT a
   saved/persisted inventory of named wires (deferred to v1.1). With several
   wires, full-height shading would overlap into noise, so each wire gets a
   thin danger-only tick row in its own color along the bottom of each
   band panel.

4. **VF handling**: a single **global** setting (Settings tab); length stays
   per-wire. Originally per-wire; amended after v1 playtesting because the
   per-wire VF sliders added clutter disproportionate to how often
   bare-vs-jacketed comparison is actually needed. Quick Check follows the
   global VF too (v0.3 — it used to carry its own VF field, which
   contradicted this decision). Per-wire VF can be reinstated if needed.

5. **Counterpoise length**: **Informational only** — not fed into the
   n-calculation. A simple quarter-wave reference number,
   `counterpoise_ft = 246 * VF / f_MHz`, labeled as a rule-of-thumb starting
   point. Consistent with the "no ground/counterpoise coupling effects"
   out-of-scope line below. Always visible (v0.3 — it was previously tied to
   the Random Wire tab, which no longer exists).

## Prior art note — hamdeck.com Random Wire Antenna Calculator

Investigated `https://hamdeck.com/tools/random-wire-antenna/` as a
comparable existing tool (web-based, not offline, includes a chart) to see
how they derive suggested lengths and counterpoise values, before deciding
DangerNode's own counterpoise handling (decision 5 above).

Findings, reverse-engineered from live tool output (40m lowest band,
f = 7.15 MHz):
- **Suggested wire length** (107.0 ft): `984 / f_MHz * 0.78` — free-space
  full wavelength (984/f, no VF applied) times a fixed fraction (0.78)
  pulled from what the site itself describes as "a curated list of common
  non-resonant wire lengths." Not a live sweep against a node/antinode
  formula across bands — a lookup table of pre-vetted length ratios.
- **Counterpoise** (34.4 ft): `246 / f_MHz` — classic free-space
  quarter-wave constant (VF = 1.0), computed completely independently of
  the wire length. Their own copy calls the VF-vs-length relationship a
  "note," not an input to any formula.
- Their counterpoise UI is a 3-option dropdown (Quarter wavelength / Short
  counterpoise-portable / No dedicated counterpoise), not a continuous
  calculation — reinforcing that a simple reference number is the norm for
  this feature, not a red flag that DangerNode is under-modeling it.

Conclusion: DangerNode's core `n = L/hw(f)` sweep across the user's bands is
already more rigorous than this comparable's length-suggestion logic. No
need to chase counterpoise-coupling fidelity to match them — a labeled
`246/f_MHz` reference number matches or exceeds their approach honestly.

## Input modes (all three required)
1. **Wire length → check the selected bands.** User enters length (ft or m);
   VF is global. Tool computes `n` at both edges of every selected band and
   flags each as good / marginal / danger (worst point across the band).
2. **Band select → suggest lengths.** User picks a target band; tool
   suggests lengths that put a reference frequency exactly midway between
   half-wave multiples (n = ½, 1½, 2½…), and shows the resulting verdict
   summary for the other shown bands as a side effect (tradeoff visibility).
   Single-frequency solve — it does not guarantee the whole band is clear.
3. **Direct frequency + length → single-point check.** Quick "is this
   specific length okay on this specific frequency" lookup — the fast
   field-use case.

## Output / visualization
**The chart is the app, not a secondary view.** It is **bounded to the
user's selected bands**: each selected band gets an equal-width panel with
its own local frequency scale, side by side, and the gaps between bands are
left out. (A continuous 1.8–29.7 MHz axis made 30m ~1px wide and 160m ~5px;
as equal panels every band is wide enough to see exactly where a half-wave
multiple falls inside it. Selecting fewer bands makes the remaining panels
wider.)

Each panel shows:
- the wire's envelope curve (`|cos(nπ)|`, High Z at top / Low Z at bottom);
- vertical danger (red) / marginal (amber) shading;
- optionally (checkbox, on by default) **half-wave multiples** as dashed
  vertical lines at `f = k·492·VF/L` (labeled `n=k` for a single wire) —
  the exact center of each red zone. A multiple that sits just *outside* a
  band but whose red zone reaches into it is shown as a triangle on the
  panel edge (with its `n` and frequency for a single wire), so a red zone is
  never unexplained;
- band name and edge frequencies.

Inputs are adjustable directly against the chart:
- Wire length: one slider per candidate wire (1–3 wires), live-updating, no
  submit button, paired with a synced number input. Typed values are never
  rewritten while the user is typing; an unparseable or out-of-range entry
  is flagged red and ignored until it's valid (it snaps back on blur).
- VF: single global slider + number input on the Settings tab.
- Band selection: toggle chips; also the chart's x axis (above).
- Counterpoise reference: informational panel, not a chart input.

A compact table below the chart gives numeric backup (freq range, verdict
per wire). Traffic-light color coding on both table and chart shading,
always paired with a text/icon verdict (not color-only) for
direct-sunlight readability.

## Field-usability requirements
- **Offline-first.** Static site, all computation client-side JS, **zero
  network dependencies** — fonts (IBM Plex Mono / Sans / Sans Condensed,
  Latin subset) are embedded in the HTML as base64 woff2 (v0.3; they used to
  come from Google Fonts). No backend, no login.
- **Single self-contained file, no `<script src>`.** Mobile Chrome opened
  from a file manager can hand off a `content://` URI that silently fails to
  load sibling files. A manifest + service worker (the "PWA" part) are **not
  built yet**, and note that service workers only run over https/localhost —
  not from `file://` or `content://` — so installing it as a PWA means
  hosting it (e.g. GitHub Pages), which is a separate path from the
  "copy the one file to the phone" path.
- **Mobile-first layout**, same page works on a laptop.
- **Sunlight-readable** high-contrast theme by default (known gap: much of
  the text is 9–12px in dim khaki; revisit).
- **Render on input change only** — slider drags should feel instant.
- **Fast cold start** — single HTML file, no framework.
- **State persistence via localStorage** — remember lengths, VF, tolerance,
  band selections and the marker toggle between sessions. Every saved field
  is validated on load; corrupt or old-format state falls back to defaults
  per field instead of crashing the page. (Storage key is `-v2`; v1 saves
  from the two-tab layout are ignored.)
- **Quick single-point check optimized for speed** (input mode 3).

## Stack decision
Vanilla HTML/CSS/JS, no framework — matches the field-usability
requirements (fast cold start, no build-step dependency) and matches the
precedent set by `pota-wire-geometry-calc`. Chart rendered as inline SVG.

Visual theme: reuse the dark khaki/amber "field gear" look from
`pota-wire-geometry-calc/index.html` (CSS custom properties: `--bg`,
`--khaki`, `--amber`, `--green-signal`, `--red-warn`, IBM Plex
Sans/Mono/Sans-Condensed fonts) for visual consistency across the two
antenna tools, adjusted as needed for sunlight-readability.

## Explicitly out of scope for v1
- Center-fed / dipole topology (v2, needs its own feedpoint mapping)
- EFHW design (matching-network / 49:1 transformer selection) — this tool
  shows what to *avoid*, which for an EFHW is its own design point
- Ground/counterpoise coupling effects on impedance (first-order model only)
- Actual Smith-chart / complex-impedance modeling (EZNEC/MMANA's job)
- Non-ham frequency allocations (possible stretch feature)
- Saved/named wire presets (v1.1, see decision 3)
- Scanning the whole length range and ranking lengths across all selected
  bands (a natural v1.1: today's Suggest Lengths is a single-frequency solve)

## Repo
`github.com/Tamooj/dangernode`.
