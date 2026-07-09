# DangerNode

Know your antinodes before you cut the wire.

A browser tool for end-fed wire antennas (EFHW and random wire) that shows
where along the ham bands a given wire length's feedpoint will land on a
voltage antinode (good match) vs. a current antinode/node (poor match) — so
you can pick a length, or a switched-length scheme, before you're standing in
a field with a NanoVNA.

Offline-first PWA, no backend, no login, no framework. Static HTML/CSS/JS.

See [docs/spec.md](docs/spec.md) for the full design spec.

## Status

Core physics module (`js/physics.js`, `js/bands.js`) is implemented and
covered by `tests/unit-physics.html` (17/17 passing). UI — tabs, the live
chart, sliders — is not yet built. See [CLAUDE.md](CLAUDE.md) for the
current-status detail and [docs/spec.md](docs/spec.md) for the full spec.

## License

MIT — see [LICENSE](LICENSE).
