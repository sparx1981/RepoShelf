# Offline image library

Collection: **120 reviewed images across twelve categories**, published in reviewed batches after Studio's tools and procedural backgrounds. Images are generated with the image tool available in the conversation, registered locally and uploaded to existing private Supabase Storage. There is no paid Images API, API key or visitor-triggered generation route.

The collection launched with 20 reviewed images and now contains ten images in each of twelve categories. Three images also offer optional motion previews and private MP4 downloads. Each batch becomes public only after every private download has been uploaded and verified. Do not add placeholder AI images or expose originals under `dist/`.

## Production workflow

1. `scripts/images/prompts.json` contains ten original prompts in each category. Generate each independently through the conversation's image tool. Save a copy as `work/images/incoming/<id>.png`; leave the tool's original file in place. Keep people, faces, logos, text, trademarks and named-artist imitation out of prompts and results.
2. Run `node scripts/images/ingest.mjs`. It validates IDs, PNG dimensions and size, records an original SHA-256 hash, provenance and pending-review status, and resumes without duplicating unchanged files. Optional `--id <id> --source <path>` registers one file. Specify `--model` only if the generation tool reports the actual model; otherwise it remains unknown rather than being invented.
3. Run `node scripts/images/contact-sheet.mjs` and inspect the contact sheets in `artifacts/images/`. Review at least a 24-image pilot, two per category, before expanding. The assistant handles curation as requested by the owner. Reject text, logo/face resemblance, malformed geometry, banding, near-duplicates and poor composition.
4. Record accepted IDs in `work/images/review.json`, for example `{ "soft-gradients-01": { "accepted": true, "hash": "<manifest hash>", "notes": "Reviewed: calm left third; no text, faces or logos." } }`. Acceptance applies only to the exact reviewed original; changed files require another review.
5. Run `node scripts/images/process.mjs --max-bytes 800000000`. It preserves original PNG bytes, including embedded provenance, and creates 1600- and 2560-pixel WebPs and public thumbnails. Larger exports can be enlarged; catalogue metadata discloses this. Square textures retain square download variants. All output is staged under `work/images/processed/`, with a byte report. An exceeded budget stops processing without uploading or publishing.
6. Check the existing project's plan, used storage and current free allowance. Run `node scripts/images/upload.mjs --available-bytes <verified remaining free bytes>` for a dry run. Reviewed batches can contain fewer than 120 entries. Add `--complete` to require all 120 entries across twelve categories.
7. Apply the Studio migration first, then run the same command with `--upload` using `SUPABASE_URL` and the existing service key in the environment only. Never put a key in chat, command arguments, public files or Git. The uploader accepts only RepoShelf's existing project URL, verifies a private bucket, resumes by object hash, and verifies every private object before copying the public catalogue and thumbnails into `dist/studio/images/`.

## Storage and membership

The private bucket is `studio-images`; each asset has `<id>/web.webp`, `<id>/full.webp` and `<id>/original.png`. A restrictive policy denies direct client access even if another broad permissive policy exists. `/api/prompts?area=image-download&id=<id>&variant=<web|full|original>` validates the catalogue item, checks sign-in/current legal acceptance, and issues a private, non-cacheable 60-second signed link. Saved images use `ss:img/<id>`.

Keep all original PNGs, review records and processed private files out of Git. `work/` is ignored. Public thumbnails must total less than 10 MB. Remaining free capacity is a hard limit; do not upgrade the plan, enable paid generation or exceed a verified allowance automatically. Free storage and transfer allowances are finite, so check current provider limits before launch or expansion.

## Disclosure and rights

Selected reviewed stills also have locally rendered, silent 8-second H.264 MP4 loops at 1280 × 720. These use gentle repeating framing movement derived from the artwork; they are not AI-generated video. Run `node scripts/images/animate.mjs --ids <comma-separated-reviewed-ids>`, review the loop and its 320 × 180 animated WebP preview, and record their exact hashes and acceptance in `work/images/animations.json` before processing again. MP4s stay private behind the existing member/legal download gate. Small motion previews are public alongside thumbnails; Studio starts still and provides explicit Play/Pause controls. Full MP4s stay out of Git. The combined public preview budget remains 10 MB.

Every published item is marked AI-generated. Metadata includes the reported provider/model, date, original dimensions/hash and enlargement status. Preserve embedded provenance in originals. Verify the provider's current ownership/commercial-use and provenance terms before launching the collection. RepoShelf's asset terms allow non-exclusive personal/commercial project use, prohibit standalone resale/redistribution and implied endorsement, and provide the existing operator's takedown contact. Do not claim copyright exclusivity or guaranteed rights for every intended use.

## Checks

`node tests/images.mjs` validates prompts, the resumable reviewed pipeline, unchanged original bytes, enlargement disclosure, private signed downloads, guest refusal and stale legal acceptance. Add `--release` when completing the full collection to require all 120 public entries. Browser/image downloads must also be checked against the configured storage project before release.

## First-batch import

The first batch uses the connected Supabase management tools for a temporary, single-purpose import job. Each invocation requires a short-lived random ticket and can write only its embedded, reviewed files to the private bucket. The job checks local hashes before upload and downloads each stored file to verify its hash afterward. The temporary HTTP transport is restricted to the database operator and removed after the import; the import function is closed and JWT protection is enabled. Original PNGs and download WebPs stay out of the public repository. Later batches may use the environment-based uploader with the same private-storage checks.

Provider terms checked on 2026-10-13: [OpenAI Europe Terms of Use](https://openai.com/policies/eu-terms-of-use/), Content section. Output ownership is assigned to the user as between OpenAI and the user, subject to applicable law; output can be similar to other users' output. The collection retains AI disclosure and non-exclusive project-use terms.
