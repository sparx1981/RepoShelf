# Further Studio tool references

Reviewed 14 October 2026 against 53278 saved catalogue records. Catalogue membership, descriptions, licence labels and source-read blob IDs are recorded in STUDIO_TOOLS_FOLLOWUP.json. A catalogue licence label is not a completed upstream licence audit. No third-party code was copied in this stage.

The implemented colour wheel, HSL harmonies and WCAG checker use original small modules. React Colorful’s interaction source handles touch identity, relative coordinates and parent-window scrolling; its framework dependency is unnecessary here. Vanilla Colorful is the closer framework-free fallback if a larger picker is later justified. Both emphasise keyboard alternatives, which the current wheel provides through native labelled sliders.

| Listed repository | Suitable direction / reuse decision |
|---|---|
| [VincentGarreau/particles.js](https://github.com/VincentGarreau/particles.js) | Lightweight particle interaction reference; inspect maintenance/accessibility before choosing it over tsParticles. |
| [tsparticles/tsparticles](https://github.com/tsparticles/tsparticles) | Potential emitter, particle shape, interaction and trail presets; choose a small module set and protect reduced-motion/visibility behaviour. |
| [omgovich/react-colorful](https://github.com/omgovich/react-colorful) | Keyboard/touch interaction and colour input patterns. Source inspected; React runtime not needed for Studio. |
| [web-padawan/vanilla-colorful](https://github.com/web-padawan/vanilla-colorful) | Framework-free accessible picker reference. Keep native sliders and pointer input; custom element could be evaluated if a richer picker is needed. |
| [collidingScopes/particular-drift](https://github.com/collidingScopes/particular-drift) | Potential image-to-particle tool. Upstream README fetch currently returns404; verify source availability before reuse. |
| [KumarSashank/motiscope](https://github.com/KumarSashank/motiscope) | Potential timeline/easing inspector; investigate local-first export and avoid adding paid AI processing. |
| [radial-color-picker/vue-color-picker](https://github.com/radial-color-picker/vue-color-picker) | Wheel geometry and hue interaction reference; Vue dependency unnecessary for the current native SVG wheel. |
| [johnowhitaker/inkwash](https://github.com/johnowhitaker/inkwash) | Potential wet/dry ink, pressure-sensitive brushes and fix-to-paper controls. WebGL2 requirement needs a bounded fallback. |
| [georgedoescode/fluid-design-system-on-demand-builders](https://github.com/georgedoescode/fluid-design-system-on-demand-builders) | Potential fluid spacing/type token generator; licence not declared in catalogue, so reference only until clarified. |
| [BIAsia/oreo-design-avatar](https://github.com/BIAsia/oreo-design-avatar) | Potential geometric SVG avatars with OKLCH controls; licence and source require review before bundling. |

Recommended next additions: image-to-particle drawing, pressure-sensitive wet/dry ink and fluid spacing token exports. These are research recommendations, not claims that the tools have been implemented. The current change adds the colour tools requested by the user. No demo-site requirement was applied to the search; the saved catalogue itself may favour demo-backed listings.
