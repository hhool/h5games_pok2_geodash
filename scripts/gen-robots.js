const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SEO_FILE = path.join(ROOT, 'data', 'seo.json');

let siteUrl = '';
if (fs.existsSync(SEO_FILE)){
  try{ const seo = JSON.parse(fs.readFileSync(SEO_FILE,'utf8')); if (seo && seo.site && seo.site.siteUrl) siteUrl = String(seo.site.siteUrl).replace(/\/\/+$/,''); }catch(e){/* ignore */}
}
if (!siteUrl) siteUrl = '';

const robotsLines = [];
robotsLines.push('User-agent: *');
robotsLines.push('Allow: /');
if (siteUrl){
  robotsLines.push('Sitemap: ' + (siteUrl.replace(/\/+$/,'') + '/sitemap.xml'));
} else {
  robotsLines.push('Sitemap: /sitemap.xml');
}

try{
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsLines.join('\n') + '\n', 'utf8');
  console.log('Wrote', path.join(DIST,'robots.txt'));
}catch(e){
  console.error('Failed to write robots.txt', e);
  process.exitCode = 2;
}
