---
name: RepoShelf
description: "The existing RepoShelf visual system, extended by Studio."
colors:
  bg: "#0b0b0d"
  surface-recessed: "#101113"
  surface: "#16171a"
  surface-raised: "#202126"
  text: "#f4f4f5"
  text-secondary: "#c5c5cd"
  muted: "#a2a2ab"
  line: "#2b2c32"
  line-strong: "#3a3b43"
  on-accent: "#111113"
  lime: "#d6fb79"
  studio-lime-hover: "#c3e966"
  status-warning-text: "#ffe0b4"
typography:
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-1.5px"
  studio-headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "42px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-1.2px"
  studio-preview:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(22px, 3.1vw, 48px)"
    fontWeight: 800
    lineHeight: 1.16
    letterSpacing: "-0.025em"
  studio-title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "18px"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  studio-description:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    lineHeight: 1.7
  studio-label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
  ascii-output:
    fontFamily: "monospace"
    fontSize: "10px"
    lineHeight: "12px"
rounded:
  badge: "4px"
  control: "6px"
  profile-row: "8px"
  brand: "9px"
  studio-thumbnail: "10px"
  preview: "12px"
  dialog: "13px"
spacing:
  field-gap: "8px"
  action-gap: "9px"
  filter-gap: "12px"
  control-gap: "18px"
  section-gap: "24px"
  workspace-gap: "28px"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  studio-button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
    height: "44px"
  studio-button-primary-hover:
    backgroundColor: "{colors.studio-lime-hover}"
    textColor: "{colors.on-accent}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  studio-small-action:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  main-navigation:
    textColor: "{colors.muted}"
  language-badge:
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.badge}"
    padding: "3px 6px"
  profile-row:
    textColor: "{colors.text}"
    rounded: "{rounded.profile-row}"
    padding: "10px 8px"
  studio-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  studio-preview:
    backgroundColor: "{colors.surface-recessed}"
    rounded: "{rounded.preview}"
  studio-tab-selected:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "44px"
---

# Design System: RepoShelf

## Overview

**Creative North Star: "RepoShelf’s incumbent visual identity"**

RepoShelf uses a near-black ground, lime actions, DM Sans body text and Manrope headings. Studio extends the existing catalogue UI with a working preview and compact controls, retaining the shared navigation and profile menu.

Dark surfaces and restrained borders establish hierarchy. Colourful resource covers and editable canvas content sit inside this shell; their artwork palettes are content rather than new brand tokens.

**Key Characteristics:**

- Near-black surfaces with lime actions and focus indicators.
- Manrope headings above compact DM Sans controls and catalogue metadata.
- Tonal layering, subtle dividers and softly rounded previews.
- Responsive editors with labelled controls and reduced-motion support.

## Colors

### Primary

Lime marks primary actions, selected Studio tabs, saved states, range controls and keyboard focus. Studio uses a darker lime hover while retaining dark action text.

### Neutral

The background anchors the page; recessed, standard and raised surfaces separate previews, fields and controls. Text, secondary text and muted text carry progressively quieter information. Line and strong-line tokens distinguish dividers from field strokes. The on-accent token supplies dark text on lime. Warning text is used for Studio errors.

**The Shell and Artwork Rule.** Keep RepoShelf’s shell tokens stable; editable backgrounds and resource covers retain their own content palettes.

## Typography

**Display Font:** Manrope, sans-serif.
**Body Font:** DM Sans, sans-serif.
**Label/Mono Font:** DM Sans for interface labels; monospace for ASCII output and colour codes.

Self-hosted variable font files supply DM Sans (400–700) and Manrope (400–800), with swap loading. The frontmatter records the observed desktop roles. The shared heading becomes (30px) on mobile; Studio’s page heading becomes (34px). Studio preview type uses a mobile clamp (20px–36px), with supporting copy hidden below (400px). Catalogue captions use (13px, 600), with quieter metadata at (11px). Studio descriptions are constrained to (64ch).

## Layout

The shared main container is centered with a maximum width (1600px), horizontal padding (4.5%), and mobile padding (5%). The header is (90px) tall, becoming (72px) at (760px). Studio adds top padding (38px), mobile top padding (28px), and bottom padding (60px).

Studio’s desktop workspace pairs a flexible preview with a control column (300px), separated by a gap (28px) and a left divider. At (1100px), the column becomes (270px), the gap becomes (20px), and the gallery changes from four to three columns. At (760px), the workspace stacks; the control divider moves to the top and controls use two columns. Titles, action groups, palette, points, uploads and explanatory notes span both columns. The gallery uses two columns with gaps (24px 14px), and captions stack. Filters and export actions wrap.

Desktop tool tabs occupy a horizontal row. At (760px), they become a two-column grid with wrapping labels and gap (8px). Mobile Studio header spacing tightens; My collection remains reachable through the shared profile menu and footer while its top navigation link is hidden. Below (350px), Studio navigation labels use (11px).

Canvas and gallery previews use a (16:9) ratio. Colour ramps remain eleven equal columns. ASCII offers fit-to-width and actual-size modes; actual size retains horizontal scrolling and labelled scroll buttons. Fit mode adjusts the monospace size to available width, with a floor (3px), rather than changing the output’s columns.

## Elevation & Depth

Most interface depth comes from tonal surfaces and restrained strokes. Dialogs use a diffuse shadow (0 30px 90px #0008) over the shared translucent overlay and backdrop blur (5px). Studio mesh handles use a small local shadow (0 2px 6px #0007), while light sample headlines use a text shadow (0 2px 12px #0007); dark sample headlines remove it. These support legibility over artwork rather than elevating every container.

State transitions use background, colour and transform over (.2s). Optional preview drift uses a (12s ease-in-out) alternating cycle. Reduced-motion rules disable shared transitions and Studio drift.

## Shapes

Controls are gently rounded; previews are broader rounded rectangles. Compact badges, fields, profile rows, brand marks, thumbnails and dialogs use the distinct radii recorded above. Mesh points are circular, with a white stroke (2px) and size (22px). Gallery images crop with cover; the final source explicitly retains automatic image height. Field and divider strokes are generally (1px); upload areas use dashed strokes.

## Components

### Buttons

Primary actions pair lime with dark text. Outlined actions retain transparent backgrounds and strong-line strokes, becoming raised on hover. Studio action buttons use a minimum height (44px), type (12px, 700) and gap (8px). Small actions use padding (8px 12px), minimum height (44px), secondary text and a standard surface on hover. Disabled Studio actions dim to (.6); disabled small buttons use the default cursor. The shared primary hover differs from Studio’s darker-lime override; preserve the applicable scope.

### Chips

Existing language badges use compact text (10px), strong-line borders, padding (3px 6px) and the badge radius. They convey metadata; Studio tool selection uses semantic tabs instead.

### Cards / Containers

Catalogue cards let the preview carry colour, with restrained text beneath. Studio gallery thumbnails use the thumbnail radius and gain a lime outline (2px, offset 3px) on hover. Preview buttons retain visible keyboard focus. Save actions use pressed state and lime text. Workspace controls are separated by a divider rather than enclosed in another card.

### Inputs / Fields

Studio fields use standard surfaces, strong-line borders, secondary labels and the control radius. Text fields and selects use a minimum height (44px), padding (10px 12px), and full available width. Colour wells are square (44px); range and checkbox accents are lime. Textareas resize vertically. Common buttons, links, inputs and selects inherit the shared focus outline (2px lime, offset 4px).

### Navigation

Main navigation uses muted text (14px, 600), white active text and a lime bottom rule (3px). Mobile labels reduce to (12px), with the narrower Studio override described in Layout. The shared profile trigger has a target (44px) and lime inset brand shape; it opens the same sign-in/account dialog across catalogue and Studio surfaces. Profile rows use icon-and-label alignment, hover tint and lime text, plus a focus outline with offset (2px).

Studio tabs use selected lime surfaces and roving keyboard focus. Left/right arrows cycle the visible tabs; Home/End select the first/last. Associated panels use labelled tabpanel semantics. Images is conditional on a nonempty loaded catalogue; its presence in the source is not evidence of launch.

### Studio Preview

Mesh points can move directly on the canvas or through labelled X/Y sliders. The optional headline is a composition aid and is excluded from exports. Its contrast indicator samples the displayed area and does not certify arbitrary text placement. Library recipes open in the same preview/editing pattern. Status feedback uses a polite live region; exports and save actions reuse the shared sign-in dialog.

## Do's and Don'ts

### Do:

- Do preserve the shared RepoShelf palette, font pair, navigation and profile menu.
- Do distinguish editable artwork colours from interface tokens.
- Do pair pointer interactions with labelled keyboard controls and visible focus.
- Do preserve Studio’s wrapping actions and mobile tab grid.
- Do disable preview drift when reduced motion is requested.

### Don't:

- Don't replace the incumbent identity when adding a Studio surface.
- Don't infer text accessibility for arbitrary artwork from the sampled contrast indicator.
- Don't show an empty Images catalogue before its assets are available.

<!-- Evidence: dist/style.css, dist/fonts.css, dist/ui.html, dist/profile-menu.js, dist/studio.html, dist/studio.css, dist/studio.js, dist/studio/gradient.mjs, dist/studio/ascii.mjs, dist/studio/core.mjs. PRODUCT.md and .impeccable/studio-brief.md supply context only. Sidecar tonal strips are synthesized OKLCH display metadata, not incumbent palette tokens. Source extraction; no browser/computed-style pass or Impeccable/Stitch schema validator ran because the launcher is unavailable. -->
