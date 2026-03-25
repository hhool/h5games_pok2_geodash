const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets', 'games');
const IMG_DIR = path.join(ASSETS_DIR, 'img');
const MANIFEST_PATH = path.join(IMG_DIR, 'manifest.json');

// widths to generate (adjust as needed)
const WIDTHS = [320, 480, 768, 1024];
// formats to emit
const FORMATS = ['avif','webp'];

function walkDir(dir, cb){
  const items = fs.readdirSync(dir);
  items.forEach(it=>{
    const p = path.join(dir,it);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkDir(p, cb);
    else cb(p);
  });
}

function isSourceImage(p){
  const ext = path.extname(p).toLowerCase();
  if (!['.jpg','.jpeg','.png'].includes(ext)) return false;
  // ignore files that look like generated variants
  if (/-w\d+\.(avif|webp|jpg|jpeg|png)$/i.test(p)) return false;
  return true;
}

async function processImage(srcPath, relBase){
  const parsed = path.parse(srcPath);
  const relKey = relBase.replace(/\\\\/g,'/');
  const outVariants = [];
  for (const w of WIDTHS){
    try{
      const pipeline = sharp(srcPath).rotate().resize({ width: w, withoutEnlargement: true });
      for (const fmt of FORMATS){
        const outName = `${parsed.name}-w${w}.${fmt}`;
        const outPath = path.join(parsed.dir, outName);
        await pipeline.toFormat(fmt, { quality: 80 }).toFile(outPath);
        outVariants.push({ path: path.relative(ROOT, outPath).replace(/\\\\/g,'/'), width: w, format: fmt });
      }
    }catch(e){ console.warn('failed to process', srcPath, 'width', w, e); }
  }
  return outVariants;
}

async function main(){
  const manifest = {};
  if (!fs.existsSync(IMG_DIR)){
    console.log('No images directory at', IMG_DIR);
    return;
  }
  const sources = [];
  walkDir(IMG_DIR, p=>{ if (isSourceImage(p)) sources.push(p); });
  for (const src of sources){
    const rel = path.relative(ROOT, src).replace(/\\\\/g,'/');
    console.log('Processing', rel);
    try{
      const variants = await processImage(src, rel);
      manifest[rel] = manifest[rel] || { variants: [] };
      manifest[rel].variants = manifest[rel].variants.concat(variants);
    }catch(e){ console.warn('error processing', src, e); }
  }
  try{
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('Wrote manifest', MANIFEST_PATH);
  }catch(e){ console.warn('failed to write manifest', e); }
}

main().catch(e=>{ console.error(e); process.exit(1); });
