/*
Simple generator for per-game static detail pages.
Run: node scripts/generate-details.js
Place images at: assets/games/<id>.(png|jpg|jpeg|webp)
If an image is missing the script will use a light SVG placeholder.
*/
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(OUT_DIR, 'assets', 'games');

// Prefer reading data/games.json; fall back to built-in list if missing
let GAMES = [];
try{
  const dataPath = path.join(OUT_DIR, 'data', 'games.json');
  if (fs.existsSync(dataPath)){
    const raw = fs.readFileSync(dataPath, 'utf8');
    GAMES = JSON.parse(raw);
  }
}catch(e){ console.warn('Could not read data/games.json — using built-in fallback'); }

if (!GAMES || !GAMES.length){
  GAMES = [
    { id: 'g1', title: 'Geo Dash', img: 'g1.png', tags:['arcade','geometry'], desc:'Fast-paced geometric runner. Dodge obstacles and survive as long as you can.' },
    { id: 'g2', title: 'Shape Pop', img: 'g2.png', tags:['puzzle','strategy'], desc:'Pop matching shapes to clear the board. Think ahead to chain combos.' },
    { id: 'g3', title: 'Line Rider', img: 'g3.png', tags:['skills','racing'], desc:'Draw lines to guide the rider across geometric tracks.' },
    { id: 'g4', title: 'Quad Wars', img: 'g4.png', tags:['multiplayer','action'], desc:'Fight other quads in fast arena matches.' },
  ];
}

function imagePathFor(game){
  const candidates = [];
  if (Array.isArray(game.img)) candidates.push(...game.img);
  else if (game.img) candidates.push(game.img);
  candidates.push(`${game.id}.png`, `${game.id}.jpg`, `${game.id}.jpeg`, `${game.id}.webp`);
  for(const c of candidates){
    if(!c) continue;
    const p = path.join(ASSETS_DIR, c);
    if(fs.existsSync(p)) return path.relative(OUT_DIR, p).replace(/\\/g, '/');
  }
  return null;
}

function placeholderDataURI(title){
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#f3f7f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="28">${title}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function buildPage(game){
  const img = imagePathFor(game) || placeholderDataURI(game.title);
  const tagsHtml = (game.tags||[]).map(t=> `<span class="detail-tag">${t}</span>`).join(' ');
  const json = {
    '@context':'https://schema.org',
    '@type':'VideoGame',
    'name': game.title,
    'description': game.desc,
    'image': img,
    'genre': game.tags
  };
  if (game.rating && game.rating.ratingValue){
    json.aggregateRating = { '@type':'AggregateRating', 'ratingValue': game.rating.ratingValue, 'ratingCount': game.rating.ratingCount || 0 };
  }
  if (game.publisher) json.publisher = game.publisher;
  const jsonLd = JSON.stringify(json, null, 2);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${game.title} — Geometry Lite</title>
  <meta name="description" content="${game.desc}" />
  <meta property="og:title" content="${game.title} — Geometry Lite" />
  <meta property="og:description" content="${game.desc}" />
  <meta property="og:image" content="${img}" />
  <link rel="stylesheet" href="css/style.css">
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body>
  <header class="site-header"><div class="container"><a class="brand" href="index.html">GeometryLite</a></div></header>
  <main class="container" style="padding:28px 18px;">
    <article class="detail-article">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <nav aria-label="breadcrumb" style="font-size:.9rem;color:var(--muted);margin-bottom:6px">Home / Rhythm Games / ${game.title}</nav>
          <h1 style="margin:0">${game.title}</h1>
          <div style="margin-top:8px;color:var(--muted)">${ (game.tags||[]).join(' • ') }</div>
        </div>
        <div class="meta-row">
          <div class="rating-stars">${'★'.repeat(Math.round((game.rating&&game.rating.ratingValue)||4))}</div>
          <div style="color:var(--muted);">${game.rating && game.rating.ratingCount? (game.rating.ratingCount + ' votes') : ''}</div>
        </div>
      </div>
      <p class="lead" style="margin-top:12px">${game.desc}</p>
      <div style="display:flex;gap:18px;margin:20px 0;align-items:flex-start;flex-wrap:wrap;">
        ${ game.embedUrl ? `<div class="game-embed" style="flex:0 0 640px;max-width:100%;"><iframe src="${game.embedUrl}" frameborder="0" allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups" style="width:100%;height:420px;border:0;border-radius:12px;overflow:hidden;"></iframe></div>` : `<img src="${img}" alt="${game.title} image" style="width:360px;height:200px;object-fit:cover;background:#f3f7f7;border-radius:12px;"/>` }
        <div style="flex:1;min-width:220px;">
          <div style="margin-bottom:10px;"><strong>About</strong></div>
          <p style="color:var(--muted);margin:0">${game.desc}</p>
        </div>
      </div>
    </article>
  </main>
  <footer class="site-footer"><div class="container">© GeometryLite — Prototype</div></footer>
</body>
</html>`;
  return html;
}

// Ensure assets dir exists
if(!fs.existsSync(ASSETS_DIR)){
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log('Created assets/games directory — place images as assets/games/<id>.png');
}

// Write pages
async function checkEmbedUrl(url){
  try{
    // try a HEAD request to detect headers
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    const controller = new AbortController();
    const to = setTimeout(()=>controller.abort(), 6000);
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    clearTimeout(to);
    const xfo = res.headers.get('x-frame-options');
    const csp = res.headers.get('content-security-policy') || '';
    const warnings = [];
    if (xfo) warnings.push(`X-Frame-Options: ${xfo}`);
    if (csp && /frame-ancestors\s+none|frame-ancestors\s+\'none\'|frame-ancestors\s+sameorigin/i.test(csp)) warnings.push(`CSP frame-ancestors rule: ${csp.split(';').find(s=>/frame-ancestors/i.test(s))||csp}`);
    return { ok: res.ok, status: res.status, warnings };
  }catch(err){
    return { ok:false, status: 0, warnings: [`fetch error: ${err.message}`] };
  }
}

(async ()=>{
  // check embed URLs and report warnings
  for (const game of GAMES){
    if (game.embedUrl){
      const info = await checkEmbedUrl(game.embedUrl);
      if (!info.ok || (info.warnings && info.warnings.length)){
        console.warn(`Embed URL check for ${game.id} (${game.embedUrl}) -> status:${info.status} ${info.warnings.length?'- warnings: '+info.warnings.join(', '):''}`);
      }
    }
  }

  GAMES.forEach(game=>{
    const file = path.join(OUT_DIR, `game-${game.id}.html`);
    fs.writeFileSync(file, buildPage(game), 'utf8');
    console.log('Wrote', path.relative(process.cwd(), file));
  });

  console.log('Done. If you have images, add them to assets/games and re-run to include them.');
})();
