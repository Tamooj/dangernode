# DangerNode — Design Spec v0.2

Supersedes the original `antinode-calculator-spec.md` v0.1 draft. Carries
forward everything from v0.1 unless noted below; this doc records the
decisions made during project kickoff.

## One-liner
A browser tool that takes a wire length (or a target band) and shows where
along the ham bands that wire's feedpoint impedance will be favorable
(antinode, high-Z, good match) vs. unfavorable (node, low-Z/reactive, poor
match) — so you can choose a wire length, or a switching scheme, before
you're standing in a field with a NanoVNA.

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

## Scope for v1
End-fed configurations, presented as tabs (same UX pattern as the
[pota-wire-geometry-calc](https://github.com/Tamooj/pota-wire-geometry-calc)
antenna coordinates tool):
- **EFHW tab** — single wire, fed at the end, generally intended to be cut
  near resonance. Emphasizes the "find a length that lands my target bands
  on antinodes" workflow.
- **Random Wire tab** — end-fed, not necessarily cut for resonance, always
  used with a tuner. Adds a counterpoise-length *reference* input (see
  Counterpoise decision below — informational only, not part of the n-calc).
  Emphasizes the "here's where the danger zones fall for whatever length
  I've actually got" sweep workflow.
- Both tabs share the same underlying `n = L / hw(f)` math — the difference
  is which workflow/inputs are foregrounded, not the physics.

Center-fed dipoles remain a v2 tab addition (different feedpoint
node/antinode mapping), not in v1.

## Core physics model
- Effective half-wavelength of the wire: `hw = (492 * VF) / f_MHz` (feet), or
  metric equivalent. VF (velocity factor) defaults ~0.95–0.98 for
  insulated/silicone-jacketed wire, **globally adjustable** — see decision 4,
  amended after v1 playtesting.
- For a fixed wire length `L`, electrical length in half-waves at frequency
  `f`: `n = L / hw(f)`
- Odd integer `n` → feedpoint at voltage antinode → high Z, good match.
- Even integer `n` → feedpoint at current antinode → low Z, poor match.
- "Danger zone" = proximity of `n` to the nearest even integer, within a
  user-adjustable tolerance band, default ~±0.07 in n, exposed as a slider.
  Ship with this default rather than forcing a blank-state choice; revisit
  the exact default only if it proves to get in the way in practice — don't
  over-engineer this up front.
- First-order model (open-wire standing wave assumption). No claim to
  replace NanoVNA measurement.

## Resolved decisions (was "Open decisions" in v0.1)

1. **Default band list**: Full US General/Extra allocations (not
   phone-only sub-bands) as a fixed default set. Keep the band table as a
   plain data array so adding WARC or phone-only sub-bands later is a
   one-line change, not a redesign.

2. **Danger-zone tolerance**: Ship with a default (~±0.07 in n) and a
   visible slider, rather than forcing the user to pick with no default.
   Try it as-is first; only add fidelity (e.g. asymmetric tolerance,
   per-band tolerance) if the flat default demonstrably gets in the way.
   **Addendum, 2026-07-28**: added a "Tuner Comfort Zone" radio group
   (Settings tab) as a labeled shortcut into this same slider — "No tuner
   (must be resonant)" / "Basic tuner" / "Wide-range tuner (G90-class)",
   currently 0.03 / 0.07 / 0.18. No new metric or calculation; the
   underlying tolerance value and everything driven by it (shading,
   verdicts, Quick Check) is unchanged. **These three numbers are
   placeholder estimates, not derived from any real impedance model** —
   there's no principled n-to-SWR conversion (that would require an actual
   R+jX model, explicitly out of scope, see decision on Smith-chart
   modeling below). The user intends to empirically cross-check a few
   lengths against a NanoVNA and their tuner's actual match range, then
   report back real numbers to replace these three. Don't treat 0.03/0.07/
   0.18 as validated — they're only there so the UI has something
   reasonable to show before that calibration happens.

3. **Multi-wire / switching comparison**: **In v1.** This means 2–3
   *simultaneous* length sliders on the same chart for comparing candidate
   wire lengths side by side (the actual multiband-switching use case) —
   NOT a saved/persisted inventory of named wires. Presets/saved-wire
   persistence is a reasonable v1.1 feature, deferred. Since the chart-first
   UI already supports multiple marker sets structurally, this is cheap to
   include now.

4. **VF handling**: ~~Per-wire, not global~~ — **amended 2026-07-16, after
   hands-on use of the v1 build**: VF is a single **global** setting (moved
   to a Settings tab), while length stays per-wire. The original rationale
   (comparing bare vs. insulated wire candidates) still holds in principle,
   but in practice the per-wire VF sliders added UI clutter disproportionate
   to how often that comparison actually gets used — the dominant workflow
   is comparing candidate *lengths* at one known VF, not comparing
   materials. If bare-vs-jacketed comparison turns out to be needed after
   all, per-wire VF can be reinstated; until then, global VF is simpler.

5. **Counterpoise length (Random Wire tab)**: **Informational only** for
   v1 — not fed into the n-calculation. Confirmed against competitive
   research (see Prior art below): even a reasonably sophisticated existing
   tool doesn't model true counterpoise coupling either. Display a simple
   quarter-wave reference number, `counterpoise_ft = 246 / f_MHz`
   (free-space quarter-wave constant, optionally VF-adjustable), labeled
   clearly as a rule-of-thumb starting point, not a computed part of the
   danger-zone math — consistent with the "no ground/counterpoise coupling
   effects" out-of-scope line below.

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

Conclusion: DangerNode's core `n = L/hw(f)` sweep-across-all-bands model is
already more rigorous than this comparable's length-suggestion logic. No
need to chase counterpoise-coupling fidelity to match them — a labeled
`246/f_MHz` reference number matches or exceeds their approach honestly.

## Input modes (all three required)
1. **Wire length → sweep all bands.** User enters length (ft or m) + VF.
   Tool computes `n` at both edges of every US ham band (or a selected
   subset) and flags each band as good / marginal / danger.
2. **Band select → find good lengths.** User picks a target band (or
   multiple). Tool suggests wire lengths that land that band on an odd-n
   antinode, and shows the resulting n-position for other common bands as a
   side effect (tradeoff visibility).
3. **Direct frequency + length → single-point check.** Quick "is this
   specific length okay on this specific frequency" lookup — the fast
   field-use case.

## Output / visualization
**The chart is the app, not a secondary view.** Primary and default screen
is the antinode/node envelope curve with current band selections marked on
it live. Inputs are adjustable directly against that chart:
- Wire length: one slider per candidate wire (1–3 wires, decision 3), live-
  updates the curve's band markers as dragged, no submit button. Paired with
  a synced number input so exact values aren't limited to slider precision.
- VF: single global slider + paired number input on a dedicated Settings
  tab (decision 4, amended after v1 playtesting — was per-wire in the
  original v1 design).
- Band selection: toggle chips (40m / 20m / 10m / etc.) to declutter to
  just today's operations plan.
- Counterpoise length (Random Wire tab only): informational display next to
  the chart, not a chart input (decision 5).

A compact table below the chart gives numeric backup (freq range, n range,
good/marginal/danger verdict). Traffic-light color coding on both table and
chart shading, always paired with a text/icon verdict (not color-only) for
direct-sunlight readability.

## Field-usability requirements
- **Offline-first PWA.** Static site, all computation client-side JS,
  service worker caches the app shell. No backend, no login.
- **Mobile-first layout**, same page works on a laptop.
- **Sunlight-readable** high-contrast theme by default.
- **Render on input change only** — slider drags should feel instant.
- **Fast cold start** — single HTML/JS bundle, no heavy framework.
- **State persistence via localStorage** — remember last-used wire
  lengths/VF/band selections between sessions.
- **Quick single-point check optimized for speed** (input mode 3).

## Stack decision
Vanilla HTML/CSS/JS, no framework — matches the field-usability
requirements (fast cold start, no build-step dependency for a static PWA)
and matches the precedent set by `pota-wire-geometry-calc`. Chart rendered
as inline SVG or Canvas (TBD at implementation time based on which makes
live drag-updates and traffic-light shading easiest).

Visual theme: reuse the dark khaki/amber "field gear" look from
`pota-wire-geometry-calc/index.html` (CSS custom properties: `--bg`,
`--khaki`, `--amber`, `--green-signal`, `--red-warn`, IBM Plex
Sans/Mono/Sans-Condensed fonts) for visual consistency across the two
antenna tools, adjusted as needed for sunlight-readability requirements
above.

## Explicitly out of scope for v1
- Center-fed / dipole topology (v2, needs its own node/antinode mapping)
- Ground/counterpoise coupling effects on impedance (first-order model
  only — see counterpoise decision above)
- Actual Smith-chart / complex-impedance modeling (EZNEC/MMANA's job)
- Non-ham frequency allocations (possible stretch feature)
- Saved/named wire presets (v1.1, see decision 3)

## Repo
Local: `C:\Users\micha\Documents\GitHub\dangernode`. Not yet pushed to
GitHub — push on request.
