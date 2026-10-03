import {createHash} from 'node:crypto';

export const OVERVIEW_VERSION = 1;
const informative = /^(?:about|overview|description|introduction|what is|why(?:\s|$)|features?|key features?|highlights?|what you can|use cases?|capabilities|benefits)/i;
const technical = /^(?:install|setup|set up|getting started|quick ?start|usage|how to|requirements?|prerequisites?|configuration|deploy|develop|build|api|documentation|contribut|license|changelog|release|roadmap|support|sponsor|donat|credits?|acknowledg|authors?|citation|references?|model card|training|limitations|feature requests?|translation|internationalization|repo activity)/i;

function plain(value) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)|!\[[^\]]*\]\[[^\]]*\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)|\[([^\]]+)\]\[[^\]]*\]/g, (_, a, b) => a || b)
    .replace(/<[^>]*>/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt);|&#(?:x[\da-f]+|\d+);/gi, entity => {
      const named = {'&nbsp;':' ', '&amp;':'&', '&quot;':'"', '&apos;':"'", '&lt;':'<', '&gt;':'>'};
      if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
      const code = entity.toLowerCase().startsWith('&#x') ? parseInt(entity.slice(3,-1),16) : Number(entity.slice(2,-1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/\s+/g, ' ').trim();
}
function useful(text, min = 45) {
  return text.length >= min && /[A-Za-z\u00c0-\uffff]/.test(text)
    && !/\b(?:npm (?:install|run)|pnpm |yarn (?:add|install|dev)|pip install|git clone|sudo |curl |docker (?:run|compose)|localhost[:/]|127\.0\.0\.1|cd [\w./-]+|export \w+=)/i.test(text)
    && !/^(?:check out|visit|read|see|click|open|run|install|download|sign up|follow|note:|warning:|important:|copyright|all rights reserved)\b/i.test(text)
    && !/\b(?:check out|look at|see|read|refer to|recommend).{0,50}\b(?:documentation|docs|guide)\b/i.test(text)
    && !/\b(?:contributing|contribution guide|feature requests)\b/i.test(text)
    && !/^[-—]\s/.test(text);
}
function shorten(text, limit) {
  if (text.length <= limit) return text;
  const end = text.slice(0,limit).lastIndexOf(' ');
  return text.slice(0,end > limit / 2 ? end : limit).trimEnd() + '…';
}

// Extract the author's wording, never infer functionality or rewrite it as an AI summary.
export function extractOverview(markdown) {
  let text = String(markdown || '').slice(0,500000).replace(/^\uFEFF/, '').replace(/\r\n?/g,'\n');
  text = text.replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '')
    .replace(/<!--[\s\S]*?-->/g,'')
    .replace(/<(script|style|pre)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, title) => `\n${'#'.repeat(Number(level))} ${plain(title)}\n`)
    .replace(/<\/?p\b[^>]*>/gi,'\n\n').replace(/<br\s*\/?>/gi,'\n')
    .replace(/<li\b[^>]*>/gi,'\n- ').replace(/<\/li>/gi,'\n');
  const paragraphs = [], features = [], seen = new Set();
  let mode = 'overview', block = [], fence = null, blockedDepth = 0, setupLead = false;
  function add(value, feature = false) {
    const clean = plain(value), key = clean.toLowerCase();
    if (!useful(clean,feature ? 20 : 45) || seen.has(key)) return;
    seen.add(key);
    if (feature && features.length < 5) features.push(shorten(clean,220));
    else if (!feature && paragraphs.length < 3) paragraphs.push(shorten(clean,600));
  }
  function flush() {
    if (block.length && mode !== 'skip') {
      const value = block.join(' ');
      if (setupLead) { if (/\b(?:is|are|helps|lets|allows|enables|provides)\b/i.test(plain(value))) add(value); mode='skip'; setupLead=false; }
      else if (mode==='features') { if (!plain(value).endsWith(':')) add(value,true); }
      else add(value);
    }
    block = [];
  }
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const marker = line.match(/^(`{3,}|~{3,})/);
    if (marker) { flush(); if (!fence) fence = marker[1][0]; else if (fence === marker[1][0]) fence = null; continue; }
    if (fence || /^\s{4}\S/.test(lines[i]) || /^\[[^\]]+\]:\s*\S+/.test(line)) continue;
    let heading = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
    if (!heading && i+1 < lines.length && /^(?:={3,}|-{3,})\s*$/.test(lines[i+1]) && line) {
      heading = [null,lines[i+1][0] === '=' ? '#' : '##',line]; i++;
    }
    if (heading) {
      flush(); const title = plain(heading[2]).replace(/^[^\p{L}\p{N}]+/u,'');
      const depth=heading[1].length;
      if (blockedDepth && depth>blockedDepth) { mode='skip'; continue; }
      blockedDepth=0;
      if (technical.test(title)) {
        mode='skip'; blockedDepth=depth;
        // Some READMEs place their product introduction immediately under Getting Started.
        if (!paragraphs.length && /^(?:getting started|quick ?start)$/i.test(title)) { mode='overview'; setupLead=true; }
      }
      else if (informative.test(title)) mode = /features?|highlights?|capabilities/i.test(title) ? 'features' : 'overview';
      else if (!paragraphs.length && useful(title) && /[.!?]$/.test(title) && !title.includes('|')) { add(title); mode='overview'; }
      else if (!paragraphs.length && !features.length && depth<=3) mode='overview';
      else if (!(depth>=3 && mode==='features')) mode='skip';
      continue;
    }
    if (!line || /^(?:[-*_]{3,}|<\/?(?:div|details|summary|ul|ol)\b[^>]*>)$/i.test(line)) { flush(); continue; }
    if (/^\|.*\||^\s*[-:]+\s*\|/.test(line) || /^>\s*(?:\[!|warning|note)/i.test(line)) { flush(); continue; }
    const bullet = line.match(/^(?:[-*+] |\d+[.)] )(.+)$/);
    if (bullet) { flush(); if (mode !== 'skip' && !setupLead && !/^(?:GET|POST|PUT|PATCH|DELETE|HEAD|CONNECT|OPTIONS|TRACE)\s*[-—]/.test(plain(bullet[1]))) add(bullet[1],true); continue; }
    if (mode !== 'skip') block.push(line.replace(/^>\s?/,''));
  }
  flush();
  return {paragraphs,features};
}

export function withOverview(repo, markdown, sourceUrl, now = Date.now()) {
  const extracted = extractOverview(markdown);
  const checkedAt = new Date(now).toISOString();
  const fingerprint = createHash('sha256').update(String(markdown || '')).digest('hex');
  const overview = extracted.paragraphs.length || extracted.features.length ? {
    kind:'readme', version:OVERVIEW_VERSION, ...extracted, sourceUrl, fingerprint,
    extractedAt:repo.overview?.fingerprint === fingerprint && repo.overview?.version === OVERVIEW_VERSION
      ? repo.overview.extractedAt : checkedAt,
  } : null;
  const updated = {...repo,overview,overviewCheckedAt:checkedAt};
  delete updated.overviewError;
  return updated;
}

export async function readOverviewReadme(repo,{fetcher=fetch}={}) {
  const space = repo.source === 'huggingface';
  const branch = space ? 'main' : encodeURIComponent(repo.branch || 'main');
  const raw = space ? `https://huggingface.co/spaces/${repo.spaceId}/raw/main/` : `https://raw.githubusercontent.com/${repo.full}/${branch}/`;
  const source = space ? `https://huggingface.co/spaces/${repo.spaceId}/blob/main/` : `https://github.com/${repo.full}/blob/${branch}/`;
  for (const filename of ['README.md','readme.md','README.MD','README.rst','readme.rst','README','README.txt','README.markdown']) {
    const response = await fetcher(raw+filename,{signal:AbortSignal.timeout(10000)});
    if (response.status === 404) continue;
    if (!response.ok) throw Error(`README HTTP ${response.status}`);
    return {markdown:await response.text(),sourceUrl:source+filename};
  }
  return {markdown:'',sourceUrl:source+'README.md'};
}

export {plain as plainReadmeText};
