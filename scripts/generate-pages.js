const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DATA_FILE = path.join(ROOT, 'data', 'games.json');

if (!fs.existsSync(DATA_FILE)) {
  console.error('data/games.json not found');
  process.exit(1);
}

const games = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

function ensureDir(dir){ if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

ensureDir(DIST);

games.forEach(g=>{
  const dir = path.join(DIST, g.id);
  ensureDir(dir);
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${g.title} — Play Online</title>
  <meta name="description" content="${g.desc}" />
  <link rel="stylesheet" href="/index.html">
  <script type="application/ld+json">${JSON.stringify({
    '@context':'https://schema.org',
    '@type':['VideoGame','SoftwareApplication'],
    name: g.title,
    url: `https://geometrydash.poki2.online/${g.id}/`,
    description: g.desc,
    image: `https://geometrydash.poki2.online/${g.img && g.img[0] ? g.img[0] : ''}`,
    applicationCategory: 'Game',
    operatingSystem: 'Web',
    author: g.publisher || { '@type':'Organization','name':'Poki2' },
    aggregateRating: g.rating || undefined
  })}</script>
</head>
<body>
  <div style="padding:18px;max-width:980px;margin:0 auto;font-family:Inter,system-ui"> 
    <a href="/">&larr; Back</a>
    <h1>${g.title}</h1>
    <div style="width:100%;max-width:960px;height:480px;background:#000;border-radius:8px;overflow:hidden">
      <iframe src="${g.embedUrl}" title="${g.title}" sandbox="allow-scripts allow-same-origin allow-popups" allow="autoplay; fullscreen" style="width:100%;height:100%;border:0"></iframe>
    </div>
    <p style="color:#666;margin-top:12px">${g.desc}</p>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  console.log('Generated', g.id);
});

console.log('All pages generated.');
