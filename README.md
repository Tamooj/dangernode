# DangerNode

Know your antinodes before you cut the wire.

A browser tool for end-fed wire antennas (EFHW and random wire) that shows
where along the ham bands a given wire length's feedpoint will land on a
voltage antinode (good match) vs. a current antinode/node (poor match) — so
you can pick a length, or a switched-length scheme, before you're standing in
a field with a NanoVNA.

Offline-first PWA, no backend, no login, no framework. Static HTML/CSS/JS.

See [docs/spec.md](docs/spec.md) for the full design spec.

## Try it

Open [`dangernode.html`](dangernode.html) directly in any browser — no
build step, no dependencies, no server required. It's a single
self-contained file (see CLAUDE.md for why), so it's also the only file
you need if you're copying it onto a phone for offline field use.

## Status

Core physics module (inlined in `dangernode.html`'s own `<script>` — see
CLAUDE.md for why) plus the full v1
UI — tabs, a Settings tab (global VF), the live SVG antinode/node chart
with vertical danger-zone shading, wire-length/tolerance sliders (each
paired with a synced number input), band toggle chips, Quick Check,
Suggest Lengths, counterpoise reference, unit conversion, localStorage
persistence — are implemented, covered by `tests/unit-physics.html`
(27/27 passing). See [CLAUDE.md](CLAUDE.md) for the current-status detail
and [docs/spec.md](docs/spec.md) for the full spec.

## License

MIT — see [LICENSE](LICENSE).
