# Plan: an AI-generated hero and background image library

Status: draft for a coding agent (Codex), 2026-10-13. Companion to `BACKGROUNDS_STUDIO.md`. Nothing is built yet.

## 1. Idea and a change of approach

Do **not** generate images when a visitor asks. Generate a curated library **once, offline**, review it by eye, and ship it as static files. That removes per-visitor cost, abuse and moderation risk, and the library is higher quality because every image is hand-picked.

Target: 240 to 360 images (12 categories x 20 to 30) shown in the Studio section as **Images**: hero backgrounds, textures, abstract scenes, product surfaces.

Can ChatGPT or Codex produce them? Both routes below work. Check the current model names, pricing and terms on OpenAI's pages before starting, because they change.

- **Route A (scripted):** a script calls the OpenAI Images API with an API key. This is billed per image, separately from a ChatGPT or Codex plan. Repeatable and resumable.
- **Route B (manual):** generate in ChatGPT in batches, drop the files in a folder, and run the same processing script. Uses ChatGPT plan allowance and needs more human time.

Both end in the same folder format, so Route A can be tried on a pilot and Route B used for the rest (or the reverse).

## 2. Rules for every image

- No real people, no recognisable faces, no logos, brands, trademarks, copyrighted characters or artists' names in prompts. No text in the image.
- No "in the style of <named artist or product>". Describe materials, light, colour and composition instead.
- Landscape 16:9 for heroes (generate at the largest supported size), plus a small square set for textures.
- One consistent house look per category so the grid feels designed (palette, grain, lighting).
- Keep a safe zone: the left third or the centre should be calm, so text can sit on top.

## 3. Categories (starting list)

Soft gradients and mesh; grain and noise textures; aurora and light trails; glass and frosted surfaces; paper and fabric; abstract 3D shapes; minimal landscapes; night sky and space; architecture lines; tech and circuit abstracts; water and liquid; organic patterns. Adjust after the pilot.

## 4. Build steps

### Step 1: prompts
`scripts/images/prompts.json`: an array of `{id, category, title, prompt, orientation}`. Generate 5 prompt variations per category with a template, then hand-edit. ids are `[a-z0-9-]{1,80}`.

### Step 2: generator (Route A)
`scripts/images/generate.mjs`:
- Reads `OPENAI_API_KEY` from the environment only. Never logs or stores it.
- Resumable: skips ids already present in `work/images/manifest.json`.
- Flags: `--dry-run` (print count and estimated spend), `--limit N`, `--category X`, `--max-spend N` (stop at the cap).
- Concurrency of 2 to 3, retries with backoff, saves originals to `work/images/raw/<id>.png`. `work/` is git-ignored.
- Start with a pilot of 20 images, one per category, and review before the full run.

### Step 3: manual drop (Route B)
`work/images/incoming/<id>.png` plus the prompt used in `prompts.json`. `scripts/images/ingest.mjs` validates names and registers them in the manifest.

### Step 4: review
`scripts/images/contact-sheet.mjs` makes contact sheets per category. A human accepts or rejects each id into `work/images/review.json`. Reject: text artefacts, odd shapes, banding, anything resembling a real logo or person, near-duplicates.

### Step 5: process
`scripts/images/process.mjs` (uses `sharp`): from each accepted raw file make
- `thumb` 640 px wide WebP, about 25 KB;
- `web` 1600 px wide WebP (or AVIF);
- `full` 2560 px wide WebP, plus the original PNG.
Strip metadata but record provenance (`ai: true`, model, date) in the index.

### Step 6: data and storage
- Public, in the repo: `dist/studio/images/index.json` (id, title, category, tags, colours, dominant colour, size) and `dist/studio/images/thumbs/<id>.webp`. Budget under about 10 MB.
- Gated, outside the repo: `web` and `full` files in a **private Supabase Storage bucket**. Signed-in members get a short-lived signed URL from the server. Do not put the large files in git.
- Add the download as a new `area` inside `api/prompts.mjs` (for example `image-download`), member-gated like `ui-detail`. The project is at the 12-function Hobby limit, so no new function file.
- Saved images reuse My collection with the `ss:img/<id>` namespace: widen `user_likes_project_id_check` and `prompt_events_prompt_key_check` in a new migration (follow `supabase/migrations/202610130034_ui_library.sql`), and update `api/collection.mjs`, `api/analytics.mjs` and `dist/collection-prompts.js` the same way.

### Step 7: front end
Add an **Images** tab in `dist/studio.html` (or a separate `dist/images.html` if Studio is not built yet): grid of thumbnails with category and colour filters, a preview dialog, and sign-in for downloads. Reuse the shared profile menu and the layout in `dist/ui.html` and `dist/ui.js`.

### Step 8: tests and docs
- `tests/images.mjs`: index complete, thumbnails present, guests cannot get a signed URL, member can, input validated (follow `tests/ui.mjs`).
- `docs/IMAGE_LIBRARY.md`: how to add more, the cap and spend rules, review rules.
- Add the page to `scripts/build-seo.mjs` and the new script to `scripts/check.mjs`.

## 5. Legal and disclosure (do before launch)

- Confirm the provider's current terms on ownership and commercial use of generated images, and on any required disclosure or embedded provenance data.
- Label every image "AI-generated" in the interface and in `index.json`.
- Add a short "Images" section to the Terms: use in personal and commercial projects is allowed, no resale or redistribution as standalone images, no use implying endorsement, and a takedown contact.
- Do not claim exclusivity: the same prompt may produce similar images for others.

## 6. Acceptance

- Pilot of 20 reviewed before the full run, with spend shown in the dry run first.
- At least 240 accepted images, none with text, logos or faces.
- Thumbnails total under 10 MB; the page lists 240+ images with no console errors.
- Guests see thumbnails and previews only; downloads need sign-in and the current legal acceptance.
- No API key anywhere in the repo, logs or output.

## 7. Decisions for the owner

1. **Route A, B or both?** Recommended: pilot with A (cheap, 20 images), then decide.
2. **Spend cap.** Set `--max-spend` before the first run.
3. **Gated downloads or fully free?** Recommended: gated, as with the other sections.
4. **Size of first release.** Recommended: 120, then add more.
5. **Hosting of large files.** Recommended: private Supabase Storage bucket, not git.
