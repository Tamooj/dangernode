# DangerNode

Know your antinodes before you cut the wire.

A browser tool for end-fed random-wire antennas that shows which wire
lengths put a **half-wave multiple** — where the feedpoint is high-impedance
and hard for a tuner to match — inside the bands you plan to work. Pick the
bands, set a length, and the chart zooms to just those bands and marks the
danger zones, so you can choose a length (or a switched-length scheme)
before you're standing in a field with a NanoVNA.

Offline-first, no backend, no login, no framework, no network requests —
one static HTML file with the fonts embedded.

See [docs/spec.md](docs/spec.md) for the full design spec.

## Try it

Open [`dangernode.html`](dangernode.html) directly in any browser — no
build step, no dependencies, no server required. It's a single
self-contained file (see CLAUDE.md for why), so it's also the only file
you need if you're copying it onto a phone for offline field use.

## Status

v0.2.0. One calculator view with a band-bounded antinode/node chart (a
panel per selected band, red/amber danger shading, optional half-wave
multiple markers), band verdict table, up to three comparison wires, a
Settings tab (global VF, danger-zone tolerance, tuner presets), Quick
Check, Suggest Lengths, a counterpoise reference, ft/m units and
localStorage persistence. Covered by `tests/unit-physics.html` (41 tests)
and `tests/system-app.html` (39 tests) — both passing; serve the repo with
`python -m http.server` and open them. Not yet built: a PWA manifest and
service worker. See [CLAUDE.md](CLAUDE.md) for current-status detail.

This is a first-order model (open-wire standing waves) for deciding which
lengths to avoid; it doesn't replace measuring with a NanoVNA, and the
tuner-comfort presets are placeholder estimates.

## License

MIT — see [LICENSE](LICENSE). Embedded IBM Plex fonts are under the SIL
Open Font License 1.1.
