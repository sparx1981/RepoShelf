// Shared tokens, licence and wrappers for the RepoShelf showcase components.
export const SHOWCASE_LICENCE='RepoShelf showcase component. Original code by RepoShelf; use, copy and change it in personal and commercial projects. Do not resell or redistribute the components themselves as a standalone library. Full text: https://www.reposhelf.co.uk/licences.html';
export const SHOWCASE_LICENCE_TEXT=`RepoShelf showcase components licence

Copyright (c) 2026 RepoShelf

You may use, copy and change this code in your own projects, including commercial ones, as long as this notice stays with the code you reuse.

You may not sell, sublicense or redistribute the components themselves, alone or in a bundle, as a standalone component library.

These components were written for RepoShelf. They take inspiration from interaction patterns that are common across the web, and they contain no code from third-party component libraries. The one exception is the Sea Glass family, a port of the open-source Sea Glass project by mttmcknn; those components carry their own notice and the Apache License 2.0, which applies to them instead of this one.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
`;
export const BASE_CSS=`.sc{--sc-bg:#ffffff;--sc-fg:#111113;--sc-muted:#6b7280;--sc-line:#e4e4e7;--sc-surface:#f5f5f7;--sc-accent:#6d5ef5;--sc-accent-fg:#ffffff;--sc-ring:rgba(109,94,245,.35);color:var(--sc-fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;box-sizing:border-box}
.sc *,.sc *::before,.sc *::after{box-sizing:inherit}
.sc[data-theme=dark]{--sc-bg:#0b0b0d;--sc-fg:#f4f4f5;--sc-muted:#a1a1aa;--sc-line:#2a2a30;--sc-surface:#16161a;--sc-accent:#a597ff;--sc-accent-fg:#0b0b0d;--sc-ring:rgba(165,151,255,.4)}
@media (prefers-color-scheme:dark){.sc:not([data-theme=light]){--sc-bg:#0b0b0d;--sc-fg:#f4f4f5;--sc-muted:#a1a1aa;--sc-line:#2a2a30;--sc-surface:#16161a;--sc-accent:#a597ff;--sc-accent-fg:#0b0b0d;--sc-ring:rgba(165,151,255,.4)}}
:where(.sc) button{font:inherit;color:inherit}
:where(.sc) :focus-visible{outline:2px solid var(--sc-accent);outline-offset:3px}
@media (prefers-reduced-motion:reduce){.sc *,.sc *::before,.sc *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}`;

export function componentCode(item){
 return `<!-- ${item.licence||SHOWCASE_LICENCE} -->
<style>
${BASE_CSS}
${item.css.trim()}
</style>

<div class="sc">
${item.html.trim()}
</div>
<script>
${item.js.trim()}
</script>
`;
}

export function previewPage(item){
 return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${item.title} preview</title>
<style>html,body{margin:0}body{min-height:100vh}.sc-stage{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr);place-items:center;padding:28px 20px;background:var(--sc-bg)}.sc-stage>.sc{width:min(100%,${item.width||760}px);background:transparent}</style>
<style>
${BASE_CSS}
${item.css.trim()}
</style></head>
<body><div class="sc-stage sc" id="stage"><div class="sc" id="demo">
${item.html.trim()}
</div>
<script>
${item.js.trim()}
</script>
</div>
<script>
(function(){var q=new URLSearchParams(location.search).get('theme'),stage=document.getElementById('stage'),demo=document.getElementById('demo');var t=q==='dark'?'dark':'light';stage.dataset.theme=t;demo.dataset.theme=t})();
</script></body></html>
`;
}
