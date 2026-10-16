# UI library

The **UI components** tab inside Studio (`/studio.html#ui`) lists 1,241 copy-ready interface components for React, Tailwind CSS and shadcn/ui. Like Prompts, browsing is open to everyone and the valuable part is for signed-in members.

| | Everyone | Signed in |
|---|---|---|
| Browse, search, filter, thumbnails | yes | yes |
| Live preview (light and dark) | yes | yes |
| Prompt that recreates the component | no | yes |
| Code, supporting files, install line, `.zip` | no | yes |
| Save to My collection | no | yes |

## How it is stored

- **Static, public:** `dist/ui/index.json` (the list), `dist/ui/thumbs/<id>.webp` (thumbnails) and `dist/ui/p/` (a small app that renders one component per `?id=`). The preview runs in a same-origin iframe, so the page can show the real, interactive component. Nothing in it is user content.
- **Server only:** the tables `ui_items` (title, group, prompt, code, file list, install requirements) and `ui_files` (shared supporting files, stored once) from `supabase/migrations/202610130034_ui_library.sql`. Row-level security is on and the browser keys have no grants, so only `/api/prompts?area=ui-detail` can read them, and only for signed-in members who have accepted the current legal terms.
- **Likes:** saved components use the same store as saved prompts, with ids like `ss:ui/c-badge-1`, and appear under Saved prompts in My collection.
- **Analytics:** the same prompt actions (view, reveal, copy, download) are recorded with keys like `ui/c-badge-1`.

## Licence

The components are MIT licensed. The notice (`dist/licences.html`) is shown on the site, added as a comment to code copied from the site, and included as `LICENSE.txt` in each download. Keep it when you change or add components.

## Loading the data

The data was loaded once. To load it again (for example into a fresh database), apply the migration, then:

```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-ui-library.mjs <folder with ui_index.json, ui_db.json, ui_files.json>
```

The script upserts by id, so running it twice only updates rows. Pass the service key through the environment for that one command only.

## Adding or changing components

Add the preview to the runtime under `dist/ui/p/`, a thumbnail to `dist/ui/thumbs/`, an entry to `dist/ui/index.json`, and a row to `ui_items` (and any new shared file to `ui_files`). Keep the public files free of anything that is not meant for visitors.

Existing `/ui.html#ui/<id>` links redirect to the same component in Studio. Browsing, previews, sign-in gates, licence notices and saved component ids are preserved.

## Showcase components (original)

Forty-nine expressive components, micro-interactions and text effects are written by RepoShelf as plain HTML, CSS and JavaScript, and are mixed in alternately with the existing components at the top of the list. They fill four groups: Expressive components (spotlight cards, dock, bento grid, navigation, stepper and more), Micro-interactions (switches, checkboxes, hold-to-confirm, swipe rows, gauges and more), Hover & cursor effects, and Text effects (cipher reveal, particle text, shatter type, word morph, split-flap board, letter cubes, neon sign, vapour type, flashlight text, type wall and more; twenty in all).

- **Source:** `lib/ui-showcase/` (`components.mjs`, `micro.mjs`, `textfx*.mjs`, shared tokens in `base.mjs`). `npm run ui:showcase` writes the preview pages to `dist/ui/s/`, renders thumbnails with Playwright, and puts the rows at the front of `dist/ui/index.json` (rows carry `s:1` and a `p` preview path, so the build is repeatable).
- **Access is unchanged:** previews and thumbnails are public; the prompt and code come from `/api/prompts?area=ui-detail` for signed-in members. Showcase ids start `s-` and are answered from `lib/ui-showcase/` rather than the database. Saves use `ss:ui/s-…` and the existing legal gate.
- **Licence:** these are original code, not MIT. Members may use and change them in any project, but may not redistribute them as a component library. The notice leads the copied code, travels in the ZIP as `LICENSE.txt`, and is on the licence page. They take inspiration from interaction patterns that are common on the web, including effects seen in React Bits (MIT + Commons Clause, which forbids redistributing its components); none of its code is used.
- **Quality bar:** previews follow the light/dark toggle, honour reduced motion, have visible keyboard focus and use real buttons and inputs. `tests/ui-showcase.mjs` enforces the catalogue position, previews, thumbnails, licence, safe self-contained code and the member gate.
