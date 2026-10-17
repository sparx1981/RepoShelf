// Prompts in the library's format, written for the tests (invented names): quoted, unquoted and numbered styles plus a page's code.
export const QUOTED=`Canvas & base: Warm paper page #f6efe3 with panels #fffaf1 (1px #d9cdb8 border, radius 16px). Text #2b2118, secondary #7a6a58 (7:1). Accent kiln orange #d9582b with a deeper hover #b44420. Invented studio "Kiln & Co".

Typography: "Fraunces" 600/700 for headings and prices (headline clamp 40px to 72px); "DM Sans" 400/500 for body 16px; "DM Mono" 400 for labels 12px. Headline: "Clay you can hold.". Label above it: "Open studio, Leeds".

Layout: Top bar with wordmark "Kiln & Co", links Classes, Shop, Visit and an orange button "Book a class". Hero with the headline, a helper line "No experience needed. Cancel any time." and a field with a button "Get dates". Background video URL: https://cdn.example.com/clay-loop.mp4 on a loop. Footer link "Privacy".

Interaction: The headline types in over 900ms. Pressing Enter in the field shows "That email looks incomplete". The video fades in once loaded.

Responsive: Under 760px stack the hero; no horizontal scroll at 390px.

Rules: Single HTML file, Google Fonts link, inline CSS/JS, no libraries or external images. [hidden]{display:none!important}. Visible focus 3px #d9582b. Respect prefers-reduced-motion (no typing effect). Invented names only.`;
export const UNQUOTED=`Canvas & base: Invented community Seedling; #f3f2df cream, #30391e ink, #616b47 secondary, #485d28 green actions with white text and #e5b786 accent packets.

Typography: Newsreader 500/600 for 48px headline and 24px names; Hanken Grotesk 400/500/600 for 14px UI and 12px notes.

Layout: Header Seedling / Swap. Each packet has a Request packet button.

Rules: Deliver a single HTML file with a Google Fonts link and inline CSS/JS; no libraries or external images. Use invented names only.`;
export const NUMBERED=`1. General Setup & Assets
Tech Stack: React (single file), Tailwind CSS. Main background exactly #0b0c10.
Video Background: URL: https://cdn.example.com/Hero Video/abc.mp4. Base text: modern sans-serif font (like Inter).
2. Navigation Bar
Logo: Text "Oasis" (bold, 20px) with an icon. Links: "Product", "Pricing". Color: #A1A1AA. Log in Button: Background #1c1d22.
3. Hero
Headline: "Build faster". Subtext: "Ship with confidence."`;
export const PAGE=`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=DM+Sans&family=DM+Mono&display=swap" rel="stylesheet"><style>:root{--a:#D9582B;--b:#b44420;--bg:#f6efe3}body{font-family:'DM Sans';background:var(--bg)}h1{font-family:"Fraunces"}</style></head><body><h1>Clay you can hold.</h1><a>Book a class</a><b>Kiln &amp; Co</b> <small>Kiln & Co.</small><video src="https://cdn.example.com/clay-loop.mp4"></video></body></html>`;

// Older "numbered markdown" style: fonts on a "Font Family:" line, colours in brackets.
export const VIDEO=`Create a responsive, full-screen Hero section using React and Tailwind CSS with the following specifications:

1. Layout & Positioning:

Set the container to at least screen height with a dark blue fallback background (#21346e).

2. Background Video:

Video URL: https://cdn.example.com/loop.mp4

3. Typography (Main Headline):

Font Family: Rubik (sans-serif).
Style: Bold, Uppercase, White text.
Line 1: "NEW ERA"
Line 2: "OF DESIGN"

4. Custom CTA Button:

Text: Centered label "GET STARTED".
Text Style: Rubik, Bold, Uppercase, 20px size, dark text color (#161a20).`;
// Short hex colours and fonts named without weights.
export const SHORT=`Canvas & base: Near-black (#0c0c0f) page. Unrevealed words at 18% opacity (#fff), revealed words at 100%; keywords pick up a coloured underline sweep (#ff6b4a, #ffd166, #6ee7b7).

Typography: Instrument Serif at clamp(32px,5.5vw,76px) for the statement; Inter for the small progress counter and eyebrow.

Rules: Single HTML file, invented manifesto, use requestAnimationFrame.`;
