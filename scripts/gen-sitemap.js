const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const SITE = 'https://geometrydash.poki2.online';

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

const lastmod = new Date().toISOString().split('T')[0];

// Read games data to include per-game URLs
let pages = [ '/' ];
const dataFile = path.resolve(__dirname, '..', 'data', 'games.json');
if (fs.existsSync(dataFile)){
	try{
		const games = JSON.parse(fs.readFileSync(dataFile,'utf8'));
		games.forEach(g=> pages.push(`/${g.id}/`));
	}catch(e){ console.warn('Failed to read games.json for sitemap', e); }
}

const urlEntries = pages.map(p=>`  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');
console.log('Written', path.join(DIST, 'sitemap.xml'));
