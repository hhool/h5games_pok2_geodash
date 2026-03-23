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

// Use the SPA template so per-game paths render the same inline player view on refresh.
const TEMPLATE_PATH = path.join(ROOT, 'game-template.html');
let templateHtml = null;
if (fs.existsSync(TEMPLATE_PATH)) {
  templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf8');
} else {
  console.warn('game-template.html not found — falling back to simple per-game pages');
}

games.forEach(g=>{
  const dir = path.join(DIST, g.id);
  ensureDir(dir);
  if (templateHtml) {
    // copy the SPA template so the SPA logic loads the correct game from the path
    fs.writeFileSync(path.join(dir, 'index.html'), templateHtml, 'utf8');
  } else {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${g.title} — Play Online</title>
  <meta name="description" content="${g.desc}" />
  <link rel="stylesheet" href="/index.html">
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
  }
  console.log('Generated', g.id);
});

console.log('All pages generated.');
