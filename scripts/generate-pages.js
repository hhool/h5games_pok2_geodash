const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DATA_FILE = path.join(ROOT, 'data', 'games.json');

const SEO_FILE = path.join(ROOT, 'data', 'seo.json');

if (!fs.existsSync(DATA_FILE)) {
  console.error('data/games.json not found');
  process.exit(1);
}

const games = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

function joinUrl(base, rel){
  if(!base) return rel || '';
  if(!rel) return base.replace(/\/+$/,'') + '/';
  return base.replace(/\/+$/,'') + '/' + String(rel).replace(/^\/+/, '');
}

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

let seo = null;
if (fs.existsSync(SEO_FILE)) {
  try { seo = JSON.parse(fs.readFileSync(SEO_FILE,'utf8')); } catch(e){ console.warn('failed to parse seo.json', e); }
}
// read optional site data for homepage
const SITE_DATA_PATH = path.join(ROOT, 'data', 'site.json');
let site = null;
if (fs.existsSync(SITE_DATA_PATH)) {
  try { site = JSON.parse(fs.readFileSync(SITE_DATA_PATH,'utf8')); } catch(e){ console.warn('failed to parse site.json', e); }
}

// precompute common injections so per-game SPA copies also contain featured/root content
const siteUrl = (seo && seo.site && seo.site.siteUrl) ? seo.site.siteUrl.replace(/\/\/+$/,'') : '';
const rootDescHtml = site && site.description ? `<p style="margin:.5rem 0;color:var(--muted)">${site.description}</p>` : `<p style="margin:.5rem 0;color:var(--muted)">Play Geometry Dash — mobile friendly web builds. No download required.</p>`;
let featuredHtml = '';
if (site && Array.isArray(site.featured)) {
  site.featured.forEach(id => {
    const g = games.find(x=>x.id===id);
    if (!g) return;
    const imgSrc = (g.img && g.img[0]) ? joinUrl(siteUrl, g.img[0]) : '';
    featuredHtml += `<div class="game-card-mini" data-id="${g.id}">`;
    featuredHtml += `<img src="${imgSrc}" alt="${g.title}">`;
    featuredHtml += `<div class="gmeta"><div class="meta-row"><div class="title">${g.title}</div><div class="publisher">${(typeof g.publisher==='string')?g.publisher:(g.publisher&&g.publisher.name?g.publisher.name:'')}</div></div></div>`;
    featuredHtml += `</div>`;
  });
}

// render per-game SPA copies and also generate index.html from templateHtml with injected content
games.forEach(g=>{
  const dir = path.join(DIST, g.id);
  ensureDir(dir);
  if (templateHtml) {
    // copy the SPA template so the SPA logic loads the correct game from the path
    const outPath = path.join(dir, 'index.html');
    fs.writeFileSync(outPath, templateHtml, 'utf8');

    // Inject per-game SEO: title, description, canonical, and JSON-LD into the copied template
    try{
      let page = fs.readFileSync(outPath,'utf8');
      const siteUrl = (seo && seo.site && seo.site.siteUrl) ? seo.site.siteUrl.replace(/\/+$/,'') : '';
      const titleTpl = seo && seo.perGameTemplate && seo.perGameTemplate.title ? seo.perGameTemplate.title : '%s — Play Online';
      const descTpl = seo && seo.perGameTemplate && seo.perGameTemplate.description ? seo.perGameTemplate.description : 'Play %s in your browser. No download required.';
      const canonicalTpl = seo && seo.perGameTemplate && seo.perGameTemplate.canonicalTemplate ? seo.perGameTemplate.canonicalTemplate : '%s/%s/';

      const metaTitle = titleTpl.replace('%s', g.title);
      const metaDesc = descTpl.replace('%s', g.title);
      const canonicalUrl = (siteUrl && canonicalTpl.indexOf('%s')>=0) ? canonicalTpl.replace('%s', siteUrl).replace('%s', g.id) : (siteUrl ? siteUrl + '/' + g.id + '/' : '/' + g.id + '/');

      // replace <title>
      if (/<title>[\s\S]*?<\/title>/i.test(page)){
        page = page.replace(/<title>[\s\S]*?<\/title>/i, `<title>${metaTitle}</title>`);
      } else {
        page = page.replace(/<head([^>]*)>/i, `<head$1>\n  <title>${metaTitle}</title>`);
      }

      // replace meta description and insert keywords + OG/Twitter tags for better sharing
      const safeMetaDesc = String(metaDesc).replace(/"/g, '&quot;');
      const keywordsContent = (g.keywords && Array.isArray(g.keywords) && g.keywords.length) ? g.keywords.join(', ') : '';
      const safeKeywords = String(keywordsContent).replace(/"/g, '&quot;');
      const siteImage = (g.img && g.img[0]) ? joinUrl(siteUrl, g.img[0]) : (seo && seo.site && seo.site.defaultImage ? joinUrl(siteUrl, seo.site.defaultImage) : '');
      const ogTags = `\n  <meta name="keywords" content="${safeKeywords}">\n  <meta property="og:title" content="${metaTitle}">\n  <meta property="og:description" content="${safeMetaDesc}">\n  <meta property="og:image" content="${siteImage}">\n  <meta property="og:url" content="${canonicalUrl}">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${metaTitle}">\n  <meta name="twitter:description" content="${safeMetaDesc}">\n  <meta name="twitter:image" content="${siteImage}">`;
      if (/\<meta[^>]*name=['\"]description['\"][^>]*>/i.test(page)){
        page = page.replace(/\<meta[^>]*name=['\"]description['\"][^>]*>/i, `<meta name="description" content="${safeMetaDesc}">${ogTags}`);
      } else {
        page = page.replace(/<head([^>]*)>/i, `<head$1>\n  <meta name="description" content="${safeMetaDesc}">${ogTags}`);
      }

      // insert canonical
      if (!/rel=["']canonical["']/.test(page) && canonicalUrl){
        page = page.replace(/<head([^>]*)>/i, `<head$1>\n  <link rel="canonical" href="${canonicalUrl}">`);
      }

      // build JSON-LD for the game
      const ld = {
        '@context': 'https://schema.org',
        '@type': ['VideoGame','SoftwareApplication'],
        name: g.title,
        url: canonicalUrl,
        description: g.desc || metaDesc,
        image: (g.img && g.img[0]) ? joinUrl(siteUrl, g.img[0]) : (seo && seo.site && seo.site.defaultImage ? joinUrl(siteUrl, seo.site.defaultImage) : ''),
        applicationCategory: 'Game',
        operatingSystem: 'Web',
        author: g.publisher || (seo && seo.site && { '@type':'Organization','name': seo.site.publisher })
      };
      if (g.rating) ld.aggregateRating = g.rating;

      // replace existing JSON-LD script if present
      if (/\<script[^>]*type=["']application\/ld\+json["'][\s\S]*?<\/script>/i.test(page)){
        page = page.replace(/\<script[^>]*type=["']application\/ld\+json["'][\s\S]*?<\/script>/i, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
      } else {
        page = page.replace(/<head([^>]*)>/i, `<head$1>\n  <script type="application/ld+json">${JSON.stringify(ld)}</script>`);
      }

      // inject root description and featured games HTML so SPA copy is usable without JS
      // also append per-game guide, vaultCodes, and levels so pages render game info without client fetch
      let perGameHtml = '';
      if (g.guide) {
        perGameHtml += `<p style="color:var(--muted);margin:6px 0">${g.guide}</p>`;
      }
      if (g.vaultCodes && Array.isArray(g.vaultCodes) && g.vaultCodes.length){
        perGameHtml += `<h2 style="margin-top:8px">Vault Codes</h2><p style="color:var(--muted);margin:6px 0">${g.vaultCodes.join(', ')}</p>`;
      }
      if (g.levels && Array.isArray(g.levels) && g.levels.length){
        perGameHtml += `<h2 style="margin-top:8px">Levels</h2><ol style="color:var(--muted);margin:6px 0 0 18px">`;
        g.levels.forEach(l=>{
          const title = l.name || '';
          const guide = l.guide || '';
          perGameHtml += `<li><strong>${title}</strong>${guide ? ': ' + guide : ''}</li>`;
        });
        perGameHtml += `</ol>`;
      }

      // expose the site-only description in #site-desc (hidden) and render combined site+per-game in #root-desc
      const siteDescHtml = rootDescHtml;
      page = page.replace('<!--ROOT_DESC-->', `<div id="site-desc" style="display:none">${siteDescHtml}</div><div id="root-desc">${siteDescHtml + perGameHtml}</div>`);
      page = page.replace('<!--FEATURED_GAMES-->', featuredHtml || '');

      fs.writeFileSync(outPath, page, 'utf8');
    }catch(e){ console.warn('failed to inject SEO into', outPath, e); }

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

// Build homepage (index.html) with site injection when templateHtml available
if (templateHtml) {
  let indexHtml = templateHtml;

  // inject root description
  const rootDescHtml = site && site.description ? `<p style="margin:.5rem 0;color:var(--muted)">${site.description}</p>` : `<p style="margin:.5rem 0;color:var(--muted)">Play Geometry Dash — mobile friendly web builds. No download required.</p>`;
  indexHtml = indexHtml.replace('<!--ROOT_DESC-->', rootDescHtml);

  // inject featured games into games grid
  let featuredHtml = '';
  if (site && Array.isArray(site.featured)) {
    site.featured.forEach(id => {
      const g = games.find(x=>x.id===id);
      if (!g) return;
      const imgSrc = (g.img && g.img[0]) ? g.img[0] : '';
      featuredHtml += `<div class="game-card-mini" data-id="${g.id}">`;
      featuredHtml += `<img src="${imgSrc}" alt="${g.title}">`;
      featuredHtml += `<div class="gmeta"><div class="meta-row"><div class="title">${g.title}</div><div class="publisher">${(typeof g.publisher==='string')?g.publisher:(g.publisher&&g.publisher.name?g.publisher.name:'')}</div></div></div>`;
      featuredHtml += `</div>`;
    });
  }
  indexHtml = indexHtml.replace('<!--FEATURED_GAMES-->', featuredHtml || '');

  fs.writeFileSync(path.join(DIST, 'index.html'), indexHtml, 'utf8');
  console.log('Generated index.html');
}

console.log('All pages generated.');
