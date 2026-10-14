# Studio tool references

Catalogue snapshot: `data/browse/index.json`, inspected 14 October 2026. Catalogue membership does not imply that an entry is currently published or that its demo works. The following are references for interaction and output design; Studio's new tools use original, dependency-free code. No third-party implementation was copied or bundled.

| Reference found in RepoShelf | Catalogue state | Relevant idea | Applied in Studio |
| --- | --- | --- | --- |
| [Textures.js](https://github.com/riccardoscalco/textures) | pending | SVG textures with adjustable density and stroke | Six seamless pattern families; spacing, mark size, orientation, opacity and colour controls; reusable SVG/CSS |
| [GeoPattern](https://github.com/btmills/geopattern) | quarantined | Reusable geometric SVG background tiles | Tile-based exports and repeatability; catalogue description inspected, not treated as an approved dependency |
| [tsParticles](https://github.com/tsparticles/tsparticles) | pending | Configurable animated backgrounds and particle counts | Bounded deterministic particles, palette, movement and density controls |
| [Shifty](https://github.com/jeremyckahn/shifty) | published | Controllable tweens, duration and easing | Interface-motion mode with cubic Bézier controls, playback and phase scrubbing |
| [stripe-gradient](https://github.com/febriliankr/stripe-gradient) | published | Evolving gradient backgrounds | Artwork changes shape and colour over time; catalogue metadata inspected; README fetch returned 404 |
| [Typography.js](https://github.com/KyleAMathews/typography.js) | pending | A coherent typography system configured and exported as CSS | Modular scale, fluid sizes, heading/body font pairing, leading, tracking and measure |
| [Tailwind Typography](https://github.com/tailwindlabs/tailwindcss-typography) | pending | Consistent article hierarchy | Real headline/body specimen alongside the scale rather than isolated font swatches |

Primary READMEs were read for Textures.js, tsParticles, Shifty and Typography.js. Vanta's README was also inspected as an **external** comparison, but `tengbao/vanta` was not found in this local catalogue snapshot. It is not a RepoShelf listing reference.

## Implementation boundaries

- Keep the existing Studio shell, preview/control layout, keyboard tabs and member/legal export gate.
- Patterns export a mathematically repeating tile. Orientation is restricted to 0°, 45° and 90°, with a matching repeat period at 45°, so CSS repeats do not cut arbitrary rotated tiles.
- Motion includes both abstract backgrounds (waves, aurora and particles) and interface easing. Background geometry changes in place, rather than applying a camera pan. Preview playback pauses when hidden and honours reduced motion. Animated backgrounds export as local HTML; interface timing also exports as CSS. PNG/SVG snapshots are stills.
- Typography uses the existing self-hosted Manrope/DM Sans plus local system/serif choices. Exported CSS documents font loading; no external font request is introduced.
- No paid generation service, new visitor API route or new runtime dependency.
