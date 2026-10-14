# Studio effects: source review and recommended roadmap

Reviewed 14 October 2026. This is an implementation recommendation, not a claim that these effects are already in Studio.

## Recommendation

Keep Typography's current readable type-system editor and add a **Text effects** workspace for expressive headings. Build it from three composable parts: **layout** (straight, arc, circle, wave), **appearance** (fill, outline, glow, shadow, lighting) and **animation** (reveal, stagger, sweep, pulse, scramble). This lets a designer combine curved type with a soft glow and a slow reveal instead of choosing from unrelated fixed demos.

Improve Motion with shared timing controls, springs, paths and noise-driven movement. Improve Patterns with seeded variation, organic geometry, more tile families and multi-layer composition. The same palette, seed and timeline should work across these editors.

The first release can use native CSS/SVG and small, locally bundled utilities. Add fluid simulations and enamel/chrome text as a separately loaded advanced renderer after browser/device testing. None of the recommendations requires a generation API or paid hosting service; GPU effects run on the visitor's device.

## Research scope and evidence

- Searched the union of `dist/catalog.json` and `data/browse/index.json`: **53,292 unique catalogue entries**. Searched descriptions, names and topics, without excluding pending, unavailable or quarantined entries.
- Every entry in this stored snapshot has a demo URL. This reflects RepoShelf's existing demo-only discovery policy; it does not establish that those demos work. There is no retained no-demo inventory in these two files.
- Followed useful source/dependency references outside that inventory without requiring a working demo. External references are identified below and should not be described as existing RepoShelf listings.
- Read source excerpts and licence files covering **43 file inspections across 15 repositories**, in addition to README/package discovery. [The source audit](STUDIO_EFFECTS_SOURCE_AUDIT.json) records paths, URLs and blob hashes. Excerpts are not a complete audit of each repository.
- Read native SVG documentation for [text paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/textPath) and [specular lighting](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feSpecularLighting).
- This pass did not execute upstream packages, benchmark GPU code or test demos in a browser. Effort/performance assessments below are engineering estimates from source structure, not measured results.

Catalogue publication status is recorded for provenance; it does not determine whether source code is useful for our own tool. Licence text and integration suitability are assessed separately.

## Typography: the strongest additions

| Addition | Designer controls and useful outputs | Code/reference | Recommended approach |
| --- | --- | --- | --- |
| Letter/word reveals | Fade, rise, rotate, blur-in, stagger, direction, duration, replay and scrubbing | [Movinwords](https://github.com/revueltai/movinwords/blob/main/src/movinwords.ts), [Splitting chars](https://github.com/shshaw/Splitting/blob/master/src/plugins/chars.js) | Small DOM/CSS implementation with a reusable timing recipe. CSS + HTML exports. Preserve the unsplit phrase for accessibility. |
| Glow, neon, outline and layered shadow | Glow colour, spread/softness, intensity, stroke, shadow angle/distance, optional gentle pulse | Native CSS/SVG, with [motion-components spotlight](https://github.com/tgomilar/motion-components/blob/main/src/components/motion-spotlight/motion-spotlight.ts) for interactive-light behaviour | First-release feature. Build layered text shadows and SVG filters; avoid making a framework package a dependency just for a glow. |
| Light sweep and moving highlights | Light position, angle, width, falloff, colour, speed, fixed/pointer/timeline control | [motion-components spotlight source](https://github.com/tgomilar/motion-components/blob/main/src/components/motion-spotlight/motion-spotlight.ts) | Treat as an appearance layer over readable text. A moving highlight is distinct from bump-map lighting. Add keyboard-adjustable light position as well as pointer input. |
| Arc, circle and wave text | Radius, arc direction, path height, text offset, tracking, alignment and motion along the path | [CircleType geometry](https://github.com/peterhry/CircleType/blob/master/src/class.js), native SVG `textPath` | Prefer native SVG paths for the exportable version. CircleType is a useful geometry reference, rather than importing its old `core-js` dependency. Support SVG, PNG and HTML output. |
| Embossed/bevelled/lit type | Surface depth, softness, light X/Y/Z, highlight strength and material colour | Native `feSpecularLighting`; [svelte-fluid enamel shaders](https://github.com/tommyyzhao/svelte-fluid/blob/main/src/lib/engine/enamel/shaders.ts) | Prototype a native SVG bump-map treatment first. It produces a lighting treatment, not full 3D extrusion. Test filter bounds and browser differences before offering an SVG export. |
| Liquid, ripple and lens distortion | Distortion strength, frequency, pointer influence, speed, light/refraction parameters | [SVG shaders implementation](https://github.com/shuding/svg-shaders/blob/main/app/page.js), [svelte-fluid](https://github.com/tommyyzhao/svelte-fluid) | Advanced mode. The SVG-shaders demo builds displacement maps on the CPU; it is not a free performance win over WebGL. Restrict preview resolution and use a still/plain fallback. |
| Enamel/soft 3D-like lettering | Material tone, light direction and interactive indentation | [EnamelText wrapper](https://github.com/tommyyzhao/svelte-fluid/blob/main/src/lib/EnamelText.svelte), [EnamelEngine](https://github.com/tommyyzhao/svelte-fluid/blob/main/src/lib/engine/enamel/EnamelEngine.ts) | Strong visual direction, larger engineering task. Keep as an optional renderer with lazy loading. The engine requires WebGL2 float render targets and several internal modules. |
| Variable-weight animation | Static weight, start/end weight, interpolation and timing | Existing variable-font `@font-face` declarations in `dist/fonts.css`; [vf-clamp](https://github.com/over-punch/vf-clamp) is a related source candidate | Start with the weight ranges already declared: DM Sans 400–700 and Manrope 400–800. Expose width/optical-size controls only when an inspected font supports those axes. Do not add the vf-clamp runtime: its own README specifies Node-only processing. |
| Outlined/exportable letterforms | Stroke/fill layers, controlled distortion, glyph outline export | [opentype-layout source](https://github.com/Experience-Monks/opentype-layout/blob/master/index.js) and its OpenType.js dependency | Later extension. Useful metrics/layout reference, but the inspected code is experimental, has alignment TODOs and iterates UTF-16 characters. A modern shaping-aware solution is needed for general text. |

Suggested initial effect presets: **Soft glow**, **Neon outline**, **Embossed**, **Light sweep**, **Arc**, **Circle badge**, **Wave**, **Word rise**, **Letter cascade**, **Weight breathing**. Presets should fill the same controls, remain editable and have a visible Reset action.

### Typography source findings that affect implementation

- **Movinwords has useful timing and lifecycle patterns**, including duration, delay, reverse order, scrambling and pause/resume. Its inspected `_getSentences()` uses `innerHTML` for the supplied sentence, and its letter splitting uses code points rather than grapheme clusters. Reuse ideas or adapt bounded pieces; retain Studio's text-only insertion and use grapheme-aware segmentation. Combining marks, flags and family emoji must remain intact. Letter splitting can also disrupt connected scripts and ligatures, so word/whole-text animation must remain available.
- **CircleType also splits characters into spans**, with an optional custom splitter. Its source adds an accessibility label and measures letter widths, but its split helper inserts character content as HTML. Native `textPath` is the cleaner first fit for Studio's untrusted editable text and self-contained SVG exports.
- **EnamelText is particularly valuable for progressive enhancement.** Its wrapper keeps DOM text selectable/findable, turns it transparent only after a successful canvas frame, and restores ordinary text when the engine fails. It watches fonts, resize, visibility and reduced motion. Its text rasterizer explicitly refuses unsupported layouts rather than silently drawing the wrong glyphs.
- **Glow and physical-looking lighting are different features.** Soft glow is a shadow/blur layer; specular lighting needs a surface/bump representation. A moving radial gradient alone should be labelled a light sweep/spotlight, not realistic 3D lighting.
- **Morphing arbitrary glyphs needs special care.** Flubber's documented basic interpolation ignores holes/additional shapes in a single path. It is useful for blobs, but cannot be assumed to preserve the counters in O, A or B. It is not a drop-in letter-morph engine.
- Preserve measured glyph bounds, accents and descenders. Curves, strokes, shadows and SVG filters need extra export padding; reuse the clipping lessons from the earlier ASCII fixes.

## Motion: improvements beyond the current sine waves and orbits

| Addition | Useful controls | Source and finding | Integration assessment |
| --- | --- | --- | --- |
| Noise-driven flow fields | Seed, scale, turbulence, flow strength, colour stops, particle trails and speed | [simplex-noise source](https://github.com/jwagner/simplex-noise.js/blob/main/simplex-noise.ts) exposes separately created 2D/3D/4D noise functions and accepts a custom random function | Strong next addition. Small reusable maths layer shared by motion and patterns. A fixed seed is required for repeatable recipes. |
| Rich procedural gradients | Softness, noise scale, warp, contrast, colour grading and speed | [gradient-gl renderer](https://github.com/metaory/gradient-gl/blob/master/index.js), [noise shader](https://github.com/metaory/gradient-gl/blob/master/shaders/n1.glsl.js) | Good source to adapt. Shader combines coordinate warping and multi-octave noise, producing changing artwork rather than camera movement. |
| Interactive fluid/ink | Curl, viscosity-like dissipation, dye retention, splat size/force, bloom, shading and colour | [svelte-fluid](https://github.com/tommyyzhao/svelte-fluid), its [NOTICE](https://github.com/tommyyzhao/svelte-fluid/blob/main/NOTICE), and upstream [WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/script.js) | High visual payoff; higher GPU complexity. Adapt a renderer independent of Svelte. Do not embed the upstream demo shell: its source also contains promo/analytics handlers. |
| Spring motion | Mass/stiffness/damping or duration/bounce, target distance, replay and interruption | [motion-components hover primitive](https://github.com/tgomilar/motion-components/blob/main/src/respond/motion-hover/motion-hover.ts) | Improve the current interface easing experiment. Springs and cubic Bézier timing should be distinct modes. Exports should include an actual usable target, such as a button/card. |
| Path motion and shape morphing | Editable path, speed, direction, auto-rotation, from/to shape and progress | Native SVG motion paths; [Flubber interpolation](https://github.com/veltman/flubber/blob/master/src/interpolate.js) | Useful second wave. Blobshape + Flubber can power evolving shapes, with topology limits made explicit. |
| Composable layers and a common timeline | Individual layer offsets, opacity, blend mode, duration, hold and loop count | Our current renderer already has a normalised phase; upstream timing controls provide reference patterns | Reuse one timeline across typography, shapes and backgrounds. Keep a simple single-layer default; expose composition progressively. |

### Renderer details worth adopting, and details to change

`gradient-gl` has seeded shader selection, static per-shader dynamic imports and WebGL context recovery. However, its inspected entry maintains a **single global active program**, its default canvas styling is full-screen, and document-visibility handling is only a commented suggestion. Adapt it behind a Studio-owned instance/lifecycle API, rather than copying the boot script unchanged. Keep pause, tab visibility, reduced motion and disposal under Studio's control.

`svelte-fluid`'s plain TypeScript engine code is more relevant than the Svelte wrapper. Its enamel engine uses a shared GPU host, multiple framebuffers, jump-flood distance fields and a text-coverage image. Extracting a handful of superficial shader lines will not reproduce its full material treatment. Preserve both original and port notices if deriving code.

A free-running fluid simulation is **not automatically a seamless eight-second loop**. Seeded initial conditions make the start repeatable but do not make the end match. For guaranteed looping presets, use periodic time/noise or an explicitly baked and checked loop. Integrated particles need the same care. Do not promise seamless video exports until endpoint and playback checks exist.

## SVG patterns: expand from six regular motifs into a generative editor

| Addition | Designer benefit | Source/reference | Practical boundary |
| --- | --- | --- | --- |
| Seeded variation | Shuffle a pattern, save its seed, reopen exactly the same design | [css-doodle seed implementation](https://github.com/css-doodle/css-doodle/blob/main/src/lib/seedrandom.js), [Blobshape generator](https://github.com/lokesh-coder/blobshape/blob/master/index.js) | Put the seed and generator version in shared/exported recipes. Plain `Math.random()` at redraw time cannot reproduce a design. |
| New tile families | Truchet arcs, scallops, hexagons, interlocking loops, chevrons, stepped grids and irregular dots | [css-doodle SVG export](https://github.com/css-doodle/css-doodle/blob/main/src/exports/generator/svg.js) and its grid/shape system | Prefer curated native SVG generators first. A complete user-authored CSS language is a separate editor/parser project. |
| Organic blobs and layered contours | Softer editorial backgrounds and brand motifs with controllable complexity | [Blobshape `index.js`](https://github.com/lokesh-coder/blobshape/blob/master/index.js) | Compact radial-point/quadratic-path algorithm is a good candidate to adapt. Its seed is numeric in the inspected implementation; validate our own seed handling and geometry bounds. |
| Voronoi/triangular mosaics | Cell size, irregularity, relaxation, palette and line/fill controls | [d3-delaunay Voronoi renderer](https://github.com/d3/d3-delaunay/blob/main/src/voronoi.js) | Good small-library candidate. Clipped geometry alone does not produce a repeating tile; construct a periodic neighbourhood and clip the central tile. |
| Noise/halftone fields | Density gradients, flowing contours, variable dot size and subtle grain | [simplex-noise](https://github.com/jwagner/simplex-noise.js/blob/main/simplex-noise.ts) | Bound element counts and choose periodic fields for repeats. Offer full artwork exports separately from repeat tiles. |
| Layer composition | Combine a sparse line layer, dots and a background with independent opacity/scale/offset | Our native SVG pipeline, with css-doodle as a generative reference | Keep reusable `<pattern>`/`<defs>` and stable IDs. Provide an obvious 2×2 repeat check before export. |
| Lighting and relief | Engraved, embossed or lit geometric surfaces | Native SVG diffuse/specular filters; shared typography appearance controls | Optional style layer. Give filters enough bounds, and label filtered SVG compatibility separately from flat vector geometry. |

Current 0°/45°/90° repeating-safe orientation should remain valid. Arbitrary rotation must not be added by simply rotating a cropped square and repeating it; that can introduce visible seams. In advanced modes, distinguish a seamless tile from a full-canvas composition.

## Reuse decisions and licence evidence

“Reuse” below means a candidate for a pinned local dependency or adapted, attributed source after an integration test. No upstream source was installed or copied into Studio in this research pass.

| Repository | In local catalogue? | Licence evidence inspected | Decision |
| --- | --- | --- | --- |
| revueltai/movinwords | pending | MIT `LICENSE` | Adapt timing/stagger concepts; replace unsafe text insertion and strengthen segmentation. |
| tgomilar/motion-components | pending | MIT `LICENSE` | Adapt spotlight/spring patterns. Importing wholesale adds Lit + Motion, so avoid that for a small effect. |
| tommyyzhao/svelte-fluid | pending | MIT `LICENSE` + upstream `NOTICE` | Prototype engine extraction for advanced fluid/material modes; preserve both notices. |
| shuding/svg-shaders | pending | MIT `LICENSE`; package metadata says ISC | Experimental displacement reference. Record the metadata mismatch before vendoring; do not silently copy the whole Next/React app. |
| metaory/gradient-gl | pending | MIT `LICENSE` | Good advanced shader source, with Studio lifecycle and instance management added. |
| jwagner/simplex-noise.js | pending | MIT notice in source, package metadata | Best small shared utility candidate for natural movement and procedural patterns. |
| css-doodle/css-doodle | quarantined | MIT `LICENSE` | Strong seed/generator reference. Headless SVG export exists, but pulls in a parser/generator pipeline; evaluate bundle cost before adopting it whole. |
| lokesh-coder/blobshape | pending | MIT `LICENSE` | Good compact blob-geometry candidate; validate inputs and seed handling. |
| Experience-Monks/opentype-layout | unavailable | MIT `LICENSE.md` | Metrics reference rather than preferred modern text-layout dependency. |
| peterhry/CircleType | external | MIT `LICENSE` | Curvature reference; prefer native SVG output and modern grapheme handling. |
| shshaw/Splitting | external | MIT `LICENSE.md` | Useful character-index/CSS-variable pattern; preserve accessible whole text. |
| d3/d3-delaunay | external | ISC-style permissive `LICENSE` | Small geometry dependency candidate for Voronoi/mosaic tools. |
| veltman/flubber | external | MIT `LICENSE` | Candidate for simple shape morphs; not unrestricted glyph morphing. |
| PavelDoGreat/WebGL-Fluid-Simulation | external, followed from NOTICE | MIT `LICENSE` and source header | Useful vanilla engine reference; strip demo-specific UI/analytics when adapting. |

Further candidates considered: `mohamedfrindi/TxtAnime.js` has an inspected dispatcher and useful preset ideas, but this pass did not establish a licence for reuse of its complete effect implementations. `pptt3300/ui-fx-kit` offers source-delivered React effects, but its README claims alone do not justify adopting every effect or its tooling. `over-punch/vf-clamp` is not suitable as the browser runtime for this job. `source-foundry/Slice` is a desktop font-processing direction, not a good fit for Studio's lightweight local editor.

README requests for `collidingScopes/particular-drift` and `luukdv/gooey-react` returned 404 at the tested path. A first guessed GeoPattern source path also returned 404. These results do not prove that the repositories are gone, but they are not enough to recommend directly copying their implementation. They are left as discovery leads.

Code licences and font redistribution rights are separate. Keep third-party code notices with adapted code and downloadable source; keep existing font notices and check any added font's licence before bundling it into an export.

## Build order

1. **Typography effects foundation:** weight control, glow/outline/shadow, arc/circle/wave layouts, word/letter reveal, duration/stagger/easing, replay and static SVG/PNG plus animated HTML/CSS exports. This directly addresses the requested animation, glow, lighting and curves with the least renderer complexity.
2. **Shared motion and pattern foundations:** one seeded random/noise layer, spring and path modes, blob geometry, curated extra tile families, layer controls and the visible 2×2 repeat test. Allow the same colours and timing to move between tools.
3. **Advanced lighting and GPU effects:** native SVG embossed-lighting prototype first, then optional shader gradients, fluid ink, text-mask distortion and enamel type. Add only effects that pass the device and fallback checks.
4. **Richer geometry and export:** periodic Voronoi mosaics, safe shape morphing, outlined-font workflows and optional captured animation downloads. Export formats should reflect the renderer; shader/material effects cannot be assumed to become editable vector SVG.

Suggested first-release controls: content, font/weight, layout/path, colour/fill, appearance strength, animation preset, speed/duration, stagger, easing, play/pause and timeline. Show advanced controls only when an effect uses them.

## Integration and acceptance criteria

- Retain the existing member/legal export gate and public editing. Preserve current `#s=` links; version any expanded recipe format and migrate older recipes.
- Keep real text in the DOM, with decorative duplicates hidden from assistive technology. Prefer word/whole-text effects when character splitting would change shaping. Use text nodes and bounded state; never treat visitor-supplied text as HTML.
- Test accents, descenders, emoji sequences, combined characters, long lines and RTL text. Path/filter exports must include their full painted bounds, with no clipped tops or glow.
- Use one shared timeline definition for preview and export. Reduced motion gets a useful still state; play/pause and keyboard light/path controls remain reachable.
- Lazy-load GPU code only when selected. Pause when hidden, dispose resources on exit, cap quality/resolution, and retain a plain/static fallback after context loss. Performance targets need real device measurements before claims.
- Keep SVGs self-contained where feasible. Live-text SVG depends on font availability; outlined text needs a separately supported, font-licensed path conversion. Effects requiring a browser renderer should export HTML or raster frames with that limitation stated.
- Verify seamless tiles with repeat previews at multiple scales. Verify loop endpoints separately from the still-image checks. Do not equate seeded with seamless.
- Source inspection and renderer tests are not browser verification. The current workspace's Chromium restriction still prevents a fresh desktop/mobile visual pass; that remains an explicit release check for the eventual implementation.
