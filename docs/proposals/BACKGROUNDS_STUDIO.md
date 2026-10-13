# Proposal: a Backgrounds & Effects section ("Studio") for RepoShelf

Status: draft for review, 2026-10-13. Written so a coding agent (for example Codex) can implement it in phases. Nothing here is built yet.

## 1. Why this fits

RepoShelf already offers open-source Projects, Prompts and UI components to people who build with AI assistants. Backgrounds and visual effects are the next thing they reach for: a gradient, a grain texture, an animated shader behind a hero, an ASCII headline, a colour scale. They are small, copy-ready and visual, so they suit the same pattern: browse for free, sign in for the code.

## 2. What we reviewed, and what we may do with it

We looked at each site's `robots.txt`, licence or terms and homepage. **None of the commercial libraries can be imported.** The workable route is to build our own generators and our own library, using these sites only to see what good looks like.

| Site | What it is | Licence position | Use |
|---|---|---|---|
| backgrounds.supply | Paid library of gradient and AI backgrounds | Licence bans reselling, redistributing, offering as downloads, or including the assets in another library or competing product | Inspiration only. No import. |
| grainient.supply, gradientora.com | Paid gradient libraries (same family and template as above) | Same restrictions: no resale, no re-upload, no competing use | Inspiration only. No import. |
| ascii-magic.com | Commercial ASCII, dither and shader tool | Own code; paid plans; credits one open-source shader package (Apache-2.0) | Inspiration. Build our own converter. |
| pryzm.design | Background and visual studio | Terms: exports are yours, but you may not use its code to build a competing background generator | Inspiration only. |
| feralui.dev/gradients | Free gradient builder (SVG, PNG, MP4) | No code licence or terms found | Inspiration only until a licence is confirmed. |
| reactbits.dev | Animated React components and backgrounds | "MIT + Commons Clause": free to use inside an app or site, but not to sell. Distributing the components as a catalogue is too close to selling | Do not import. Inspiration only. |
| studio.zoxilsi.cc | Mesh gradient studio | MIT, in a public repository | **May be reused with its MIT notice** (add to `dist/licences.html`). Prefer our own build; reuse only if it saves real time. |
| ramps.studio | Colour ramp and semantic token generator | No licence stated. The maths (OKLCH ramps, contrast checks) is standard | Build our own. Do not copy code. |

Rule for everything below: **we build original code and original presets.** Algorithms (noise, mesh blending, dithering, OKLCH) are not copyrightable. Another site's presets, images and code are.

## 3. Product shape

A new top-level page, **Studio** (`/studio.html`), with a header link beside Prompts and UI. It has two parts.

1. **Tools (run in the browser, no server cost)**
   - **Gradient and mesh builder:** linear, radial, conic and mesh gradients, grain and noise overlay, optional slow animation. Exports: CSS, SVG, PNG, and a small React/Tailwind snippet.
   - **Colour ramp generator:** brand colour in, 50-950 ramps out, with WCAG contrast checks. Exports: CSS variables, Tailwind theme, JSON.
   - **ASCII and dither converter:** image or text in, ASCII or dithered output. Exports: text, SVG, PNG.
2. **Backgrounds library (our own):** a few hundred ready backgrounds generated from our own seeded generator, each with a live preview, a still thumbnail and copy-ready code.

Access, matching the other sections: browsing, tools and previews are open to everyone. **Copy code, high-resolution export (above 1080p) and the library downloads need sign-in.** *(Decision 1 below.)*

## 4. Build phases

### Phase 1: Tools (about a week of agent work)

Files to add: `dist/studio.html`, `dist/studio.js`, `dist/studio.css`, plus one module per tool under `dist/studio/` (`gradient.js`, `ramps.js`, `ascii.js`).

- Vanilla JS and canvas/WebGL 2 with a 2D canvas fallback. No framework, to match the rest of `dist/`.
- State lives in the URL hash so a look can be shared. Do not store anything server-side.
- Gradient builder: up to 6 colour stops, a type switch, a mesh mode of 3 to 9 draggable points, grain strength, an animation toggle that respects `prefers-reduced-motion`.
- Ramps: convert to OKLCH, generate 11 steps, report contrast against white and black, output the three formats above.
- ASCII: character-ramp mapping from luminance, with a few ramps, optional dithering, size limits to protect the browser.
- Reuse the shared profile menu (`dist/profile-menu.js`) and the sign-in return rule (add `/studio.html` to `authReturn` in `lib/accounts.mjs`).
- Add the page to `scripts/build-seo.mjs` (nav link and the indexable list) and `scripts/check.mjs` (syntax list).

Acceptance: every tool works with no network after load; exports open in a browser, Figma and a code editor; a 1080p PNG exports in under 3 seconds on a mid-range laptop; keyboard operable; contrast-checked UI; no console errors in the Playwright check.

### Phase 2: Backgrounds library (about a week)

- A deterministic generator (seed in, parameters out) that produces gradient, mesh, grain, aurora and wave variants. Curate by hand: generate 1,500, keep the best 300 to 500 after a visual review.
- Store each as a tiny JSON recipe. Static files, as with UI: `dist/studio/index.json`, `dist/studio/thumbs/<id>.webp`, a preview renderer reused from Phase 1. No new database table is needed for browsing.
- Gated code: serve CSS, React and shader code from the server only to signed-in members. Either generate it on the client from the recipe (simplest, no DB) or add a table as in `supabase/migrations/202610130034_ui_library.sql`. Prefer client generation unless the code becomes large.
- Saved items reuse My collection with a new namespace such as `ss:bg/<id>`. This needs a migration that widens `user_likes_project_id_check` and `prompt_events_prompt_key_check` exactly as the UI migration did, plus the same edits in `api/collection.mjs` (`promptId` regex and the PUT lookup), `api/analytics.mjs` (`promptKey`) and `dist/collection-prompts.js` (link target).
- Licence: our own work, so add a short "Backgrounds" section to the Terms of Service stating the allowed use (personal and commercial; no resale as standalone assets).

Acceptance: 300+ backgrounds, each with a thumbnail under 20 KB; a no-duplicates check on recipes; a test like `tests/ui.mjs` (list complete, thumbnails present, guests refused code, member served).

### Phase 3: AI image generation (optional, later)

Do this only after Phases 1 and 2 are live and used. It is the only part with running cost and abuse risk.

- A hosted image model behind a server function (an `area` inside an existing function: the project is at the 12-function Hobby limit, see `api/prompts.mjs`). The coding agent writes the integration. **It cannot generate the images itself at runtime**; the provider is an API choice for you.
- Signed-in members only, with a per-user daily quota, a global monthly budget cap, an admin on/off switch, input moderation, and a stored record of each request for abuse review.
- Output saved to storage with an expiry, and the Terms and Privacy Policy updated before launch (images, prompts and provider named).
- Cost and licensing of generated images must be confirmed with the chosen provider before any promise of "commercial use".

## 5. Constraints for the implementer

- Follow the structure in `docs/UI_LIBRARY.md`: static public files, server-only paid or gated content, tests in `tests/`, a docs page.
- Public pages must not name or link to the reviewed sites. Do not copy their wording, presets, images or code.
- Keep every new public file clean of secrets. Seeding, if any, uses the service key from the environment for one command only.
- Large generated assets go under `dist/studio/`; check the build with `node scripts/check.mjs` after `node scripts/data-packing.mjs unpack` and `node scripts/build-app-icons.mjs`.
- Run `node tests/<new test>.mjs`, plus the prompt and UI tests, before committing. `tests/seo.mjs` needs `sharp` installed.

## 6. Decisions for the owner

1. **What is gated?** Recommended: tools and previews free; copy code and exports above 1080p need sign-in. Alternative: everything free (fewer sign-ins) or everything gated (less reach).
2. **Scope of the first release.** Recommended: Phase 1 plus a first 100 backgrounds, then grow. Alternative: all of Phases 1 and 2 before launch.
3. **AI generation.** Recommended: defer. If wanted, choose the provider and set a monthly budget first.
4. **Name.** "Studio" is a placeholder. "Backgrounds" is more searchable; "Studio" covers the tools too.
5. **Reuse the MIT mesh studio?** Recommended: no, write our own, to keep one consistent codebase and one licence story.

## 7. Risks

- **Quality bar.** Thin or generic backgrounds would undermine the section. Mitigation: hand-curate, review in batches, reject duplicates.
- **Look-alike risk.** Keep our presets visibly different from the reviewed libraries. Do not generate "in the style of" a named product.
- **Page weight.** Many animated previews on one grid are heavy. Use still thumbnails in the grid and animate only the open item.
- **Motion and accessibility.** Respect reduced-motion; keep text contrast checks in the tools.
- **AI cost and abuse** (Phase 3 only), as above.
