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
