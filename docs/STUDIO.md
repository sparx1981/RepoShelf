# Studio

`/studio.html` extends RepoShelf with three original tools and 100 procedural backgrounds. It uses vanilla JavaScript, local SVG/canvas rendering and the existing shared profile menu. No new paid service, generation API or serverless function is required.

## Access

Browsing, previews and editing are public. All supported downloads, code-copy actions and saves require sign-in. `/api/prompts?area=studio-access` authorises tool exports; `studio-background` returns an accepted background's export package. Both reuse the existing session and current legal acceptance check. The account/legal return paths preserve Studio settings for up to one hour.

Recipes and preview code are intentionally public. The gate controls supported export actions, not the secrecy of mathematical recipes or pixels already shown to visitors. AI image originals and download variants use a private storage bucket and a server-issued 60-second link.

## Tools

- Gradients: linear, radial, conic, mesh, aurora and waves; two to six colours; three to nine mesh points; seeded grain and optional slow drift. Mesh points can be dragged or changed with labelled keyboard sliders. Exports include PNG, SVG, CSS, React and Tailwind. Radial CSS and complex backgrounds reuse the SVG renderer to match previews. Reduced-motion settings disable drift.
- Colour ramps: eleven 50–950 steps, with the supplied brand colour retained at 500. OKLCH lightness, gamut mapping and measured black/white text contrast produce CSS variables, a Tailwind theme or JSON.
- ASCII: local text or PNG/JPEG/WebP input, luminance mapping, character ramps and Floyd–Steinberg dithering. Uploaded files are bounded to 12 MB and 20 megapixels before decoding. Fit and actual-size previews retain full-resolution text/SVG/PNG exports.

Shared links include tool settings and text, never uploaded image data. Preview contrast is sampled from the headline area; it does not certify arbitrary content placed on the background.

## UI components

The UI components tab contains the existing searchable component library, live previews, member-only prompts/code/ZIP downloads and saves. It shares Studio’s account menu. Old UI links redirect with the component id preserved; saved components open directly in Studio.

## Background catalogue

Run `npm run studio:build`. The deterministic builder produces 1,500 candidates, selects 100 distinct recipes and writes five contact sheets to `artifacts/studio/`. Review the sheets before accepting changes. The first release was visually reviewed; near-identical grain pairs were corrected by varying their focal position. Thumbnails are under 20 KB each and total approximately 0.5 MB.

Public files are `dist/studio/index.json` and `dist/studio/thumbs/`. Saved resources use `ss:bg/<id>` and appear as Saved resources in My collection. Analytics reuse the existing resource action store.

## Release order and setup

Studio tools and procedural backgrounds launch first. The Images tab stays hidden while `dist/studio/images/index.json` is empty; image production follows the offline workflow in [IMAGE_LIBRARY.md](IMAGE_LIBRARY.md).

Apply the new `studio_library` migration before deploying the matching application. It widens saved-resource keys, creates the private `studio-images` bucket with a restrictive server-only policy, and allows legal version `2026-10-13-v4` while retaining older accepted versions for the deployment transition. No catalogue database tables or new functions are added. Use the existing RepoShelf Supabase project, `jccogltqhkffuderukrj`.

Validate with `npm run studio:test`, the existing prompts/UI/account/legal tests, and `npm run build`. Browser checks are in `scripts/verify-studio-ui.mjs`; run against `scripts/serve.mjs` with Playwright available. They cover guest return, member PNG/JSON/text exports, keyboard tabs, local editing offline, filtering, reduced motion and mobile layout. External account/storage services are fixtures in these tests; deployment checks still need the configured project.

Studio's root entry script is fingerprinted into `/assets/` during deployment. Its imports must use `/studio/` URLs so that relocating the entry does not break module loading. `tests/studio-assets.mjs` checks that the minified entry and its complete import graph resolve from their production locations; pass `--built` after `node scripts/build-public-assets.mjs --assets` to check the emitted files. Set `REPOSHELF_STUDIO_BUILT=1` when running the browser checks to serve those actual built files through Playwright, with no separate development server. This still uses account/API fixtures, not a real member session.

Animation speed ranges from ¼× to 4×. At 1×, a drift takes four seconds each way; recipes and shared links retain the speed, and CSS/React/Tailwind exports use it. Reduced-motion settings disable the animation. PNG and SVG exports are still images. ASCII text fitting uses measured glyph bounds for accents and descenders; preview and SVG rows include extra vertical spacing, and editing resets the preview to its first row.

Selected AI images include optional 8-second animations derived locally from their reviewed still artwork. The editor starts with a still and offers Play/Pause for a small preview, plus a signed-in MP4 download. No visitor generation API or paid video service is used.

## Patterns, motion and typography

Three further local editors use the same member/legal gate and compact shared links. Reference research is recorded in [STUDIO_TOOL_REFERENCES.md](research/STUDIO_TOOL_REFERENCES.md); catalogue states and unavailable reference sources are explicit. Original implementation, no new runtime dependency.

- **SVG patterns:** dots, rings, lines, grid, waves and diamonds; spacing, mark size, opacity, palette, transparency and repeating-safe orientation. Export a repeating SVG tile, full-preview PNG or CSS background.
- **Motion:** waves, aurora ribbons and deterministic orbiting particles, plus interface cubic Bézier easing with presets and four editable coordinates. Speed, palette, detail, movement, play/pause and timeline scrubbing. Starts paused; background geometry deforms in place. Playback suspends in hidden tabs/documents and respects reduced motion. Export dependency-free animated HTML, current-frame PNG or (in interface mode) timing CSS. The HTML begins paused and retains its reduced-motion guard. These are mathematical animations, not generated video.
- **Typography:** heading/body font pairs, modular scale, fluid sizes, base size, leading, tracking, reading measure, preview width and editable specimen text. Export scoped responsive CSS or type tokens JSON. Preview width simulates available viewport width; exported sizes interpolate over 360–1440px at a 16px root and retain rem bounds. Existing Manrope/DM Sans are self-hosted; local Georgia/system families require no new font download. Font loading remains the recipient project’s responsibility.

The three tools have no network dependency after loading except the existing export authorisation. Sharing includes settings/text for the selected experiment. Motion links restore a still phase, never autoplay. PNG exports are still images; no video encoding or paid service is introduced.

### Typography text effects

Typography now has separate Type system and Text effects workspaces. Effects combine straight/arc/circle/wave layouts with glow, neon, spotlight, embossed or enamel-style SVG relief and grapheme/word animation. Duration, stagger, weight, light position and timeline are editable; exports include SVG/PNG snapshots and a paused, self-contained animated HTML page. Fonts use documented fallbacks. These are native SVG material treatments, not a full 3D physical renderer. Existing type-system exports and links remain supported. Pointer spotlight input has matching X/Y sliders. All supported exports use the existing member/legal gate.

### Seeded organic patterns and mosaics

Patterns additionally include organic blobs, Truchet arcs, flowing contours, periodic Voronoi cells and triangular mosaics. Seed/shuffle, variation, density and secondary colour controls share the existing recipe and export gate. The optional 2×2 view repeats the actual SVG tile. Voronoi uses bounded half-plane clipping over a periodic neighbourhood; triangular mosaics use a jittered periodic grid. Tile/full raster comparison and area coverage tests verify the repeat construction. No geometry package or new runtime dependency is added.

### Motion effects and interactive ink
Motion now includes seeded harmonic flow fields, deforming plasma fields, an adjustable damped spring and ellipse/figure-eight path previews. Flow, plasma, paths and other procedural backgrounds repeat over the timeline; springs use two opposing damped responses. Playback starts paused, supports speed changes and stops when hidden or reduced motion is requested.

Fluid ink is an original bounded CPU simulation (32 × 32 velocity/dye grid), with pointer painting plus keyboard-accessible Add/Clear ink buttons, brush radius, drag force, curl and dye dissipation controls. This intentionally avoids GPU setup and paid APIs. It is a simulation, not a promised seamless loop. Shared links save seed/settings; exported offline HTML preserves the current field and supports further painting. Current-frame PNG uses the actual preview canvas. Research references are documented in `docs/research/STUDIO_EFFECTS_ROADMAP.md`; no third-party source is bundled in these new renderers.

Typography text-effect controls now follow the selected renderer: radius for arc/circle, relief depth for embossed/enamel, relevant light/glow colour controls, duration/timeline for animation and stagger only for multi-unit reveal/rise. Automatic light sweep owns Light X; its pointer hint is hidden. Inapplicable fields are hidden and disabled while their values remain in settings. Hidden stagger values do not extend non-reveal animation cycles.

### Preview and control repairs
UI component cards retain the complete thumbnail aspect ratio. Gallery selection brings the selected preview heading into view; Back to gallery returns to its filters. Sparse shared looks apply only their included tool settings. Missing ramp settings no longer crash restoration; malformed URLs quietly return to a fresh workspace.

Text size is bounded to the current phrase/layout fit envelope, with its actual maximum shown in the slider tooltip. Wave typography adds height, cycle count, offset and interpolated start/middle/end font scales. Embossed/enamel have explicit relief edges and reflective faces; moving light uses a travelling colour band and weight breathing adds a visible stroke alongside font-weight changes. Pattern stroke limits, grid/contour density steps, motion layer counts and available type-preview width now match their renderers. Gradient angle/point/speed controls already depend on relevant modes. ASCII width, type scale, lighting, brush and timing ranges were checked against their consumers.

### Colour wheel and harmony tools
Colour Ramps includes a clearly labelled button opening its wheel and contrast tools. The SVG hue wheel supports pointer dragging, with equivalent hue/saturation/lightness sliders for keyboard use. Complementary, analogous, split-complementary, triadic, tetradic and monochrome palettes feed the existing OKLCH ramp. Harmony CSS/JSON exports use the existing member/legal gate. A foreground/background checker reports WCAG normal AA, large AA and normal AAA with colour swapping and base-colour reuse. Harmonies use conventional HSL hue angles; they do not promise perceptual uniformity or accessibility without contrast checks. No new dependency or service is used.
