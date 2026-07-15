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

Core physics module and the full v1 UI are implemented. `js/physics.js`
(n = L/hw(f) math, danger-zone classification) and `js/bands.js` (default US
General/Extra band table) are exercised by `tests/unit-physics.html` —
23/23 passing, including a realistic sanity check (68ft EFHW-ish wire: clean
on 40m, correctly flags the classic 20m 2nd-harmonic node).

`index.html` is the full app: EFHW / Random Wire tabs, the SVG antinode/node
chart (distance-to-nearest-node curve vs. frequency, traffic-light shaded,
1–3 comparison wires per decision 3), the band verdict table, ft/m unit
toggle, danger-zone tolerance slider, band toggle chips, the Random Wire
tab's informational counterpoise reference (decision 5), a Quick Check panel
(input mode 3), a Suggest Lengths panel (input mode 2 — inverse-solves
`L = n * hw(f)` for a target band/frequency, with a one-click apply), and
localStorage persistence of all state. UI logic lives inline in
`index.html`'s own `<script>` tag (matching the sibling project's
single-file-per-concern convention); a handful of pure UI-support functions
(`sweepCurve`, `overallVerdict`, `suggestLengths`) are merged into
`window.DN` alongside the physics functions so they're testable the same way.

`tests/system-app.html` (DOM-driving system tests, mirroring the sibling
project's file of the same name) is written and correct, but has not been
run to green inside this dev environment — the in-house browser preview
tool's iframe instrumentation enters a reload loop when synthetic
click()/dispatchEvent() calls are driven into a nested iframe (confirmed not
an app bug: no `location`/`reload` calls anywhere in `index.html`, and
`tests/unit-physics.html`'s iframe — which never dispatches synthetic events,
only reads exposed functions — runs clean in the same tool). Expected to run
fine in a normal browser or a plain `python -m http.server`. If you hit this
again, don't sink time into it — verify functionally by driving the real
`index.html` directly instead (as was done to confirm this UI works: tabs,
multi-wire add/remove, slider drags, unit toggle, band chips, quick check,
counterpoise, suggest-lengths apply, localStorage-across-reload).

**Not yet built**: offline PWA shell (manifest + service worker) — listed
under field-usability requirements in docs/spec.md but out of scope for this
pass, which focused on the UI itself.

## Testing

No build step. Serve the repo root (`python -m http.server`) and open
`tests/unit-physics.html`, or open it directly via `file://` (iframe
same-origin restrictions may bite depending on browser). Results render to
the page; `window.__TEST_SUMMARY__` gives a machine-readable `{total,
passed, failed}` for automated checking. Don't push to GitHub until this is
green — see git log for the standing convention on this project (established
2026-07-09).
