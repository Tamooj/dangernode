# DangerNode

Wire antinode/node danger-zone calculator for end-fed ham antennas (EFHW,
random wire). Offline-first static PWA — no backend, no build step, no
framework. Full design spec lives in [docs/spec.md](docs/spec.md); read that
before making product/scope decisions, it's the source of truth, not this
file.

## Sibling project

`../pota-wire-geometry-calc` is the same author's other antenna tool.
DangerNode intentionally matches its conventions:
- Vanilla HTML/CSS/JS, single-file-per-concern, no dependencies
- Dark khaki/amber "field gear" visual theme (CSS custom properties in
  `index.html`: `--bg`, `--khaki`, `--amber`, `--green-signal`, `--red-warn`)
- Pure functions exposed on a `window` namespace inside `index.html`
  (`window.DN` here, `window.WGC` there) so unit tests can load the real
  `index.html` via a hidden iframe instead of keeping a parallel copy of the
  logic that can drift out of sync
- `tests/harness.js` is copied verbatim from that repo — same
  zero-dependency `suite()`/`test()`/`assert` pattern

When in doubt about a convention (file layout, test structure, naming), check
how the sibling project does it first rather than inventing a new pattern.

## Current status (as of 2026-07-09)

Core physics module is implemented and tested: `js/physics.js` (n = L/hw(f)
math, danger-zone classification) and `js/bands.js` (default US
General/Extra band table), exercised by `tests/unit-physics.html` — 17/17
passing, including a realistic sanity check (68ft EFHW-ish wire: clean on
40m, correctly flags the classic 20m 2nd-harmonic node).

**Not yet built**: the actual UI — tabs (EFHW / Random Wire), the live SVG or
Canvas antinode/node chart, length/VF sliders, band toggle chips, unit
conversion, localStorage persistence. `index.html` is currently just a
placeholder shell that loads the two JS modules. See "Input modes" and
"Output / visualization" in docs/spec.md for what's still to build.

## Testing

No build step. Serve the repo root (`python -m http.server`) and open
`tests/unit-physics.html`, or open it directly via `file://` (iframe
same-origin restrictions may bite depending on browser). Results render to
the page; `window.__TEST_SUMMARY__` gives a machine-readable `{total,
passed, failed}` for automated checking. Don't push to GitHub until this is
green — see git log for the standing convention on this project (established
2026-07-09).
