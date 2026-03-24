const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', '..', 'dist');

function listGameDirs(){
  if (!fs.existsSync(DIST)) return [];
  return fs.readdirSync(DIST).filter(f=> fs.statSync(path.join(DIST,f)).isDirectory() && /^g\d+/i.test(f));
}

function extractRootDesc(html){
  const m = html.match(/<div[^>]*id=["']root-desc["'][^>]*>([\s\S]*?)<\/div>/i);
  const content = m ? m[1] : html;
  // strip tags
  const text = content.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return decodeHtmlEntities(text);
}

function decodeHtmlEntities(str){
  return str.replace(/&[#A-Za-z0-9]+;/g, s=>{
    if (s[1]==='#'){
      const code = s[2]==='x' || s[2]==='X' ? parseInt(s.slice(3,-1),16) : parseInt(s.slice(2,-1),10);
      return String.fromCharCode(code||32);
    } else {
      const map = { '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':'\'' };
      return map[s] || '';
    }
  });
}

function tokenize(s){
  return s.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
}

function freq(tokens){
  const f = new Map();
  tokens.forEach(t=> f.set(t, (f.get(t)||0)+1));
  return f;
}

function dot(a,b){
  let sum=0;
  for(const [k,v] of a.entries()) if (b.has(k)) sum += v * b.get(k);
  return sum;
}

function norm(a){
  let s=0; for(const v of a.values()) s += v*v; return Math.sqrt(s);
}

function cosineSim(a,b){
  const A = freq(tokenize(a));
  const B = freq(tokenize(b));
  const d = dot(A,B); const n = norm(A)*norm(B); return n===0?0:d/n;
}

(function main(){
  const dirs = listGameDirs();
  const docs = {};
  dirs.forEach(d=>{
    const p = path.join(DIST,d,'index.html');
    if (!fs.existsSync(p)) return;
    const html = fs.readFileSync(p,'utf8');
    const txt = extractRootDesc(html);
    docs[d] = txt;
  });

  const results = [];
  const keys = Object.keys(docs);
  for(let i=0;i<keys.length;i++){
    for(let j=i+1;j<keys.length;j++){
      const a = keys[i], b = keys[j];
      const sim = cosineSim(docs[a], docs[b]);
      results.push({a,b,sim: Number(sim.toFixed(3))});
    }
  }

  results.sort((x,y)=> y.sim - x.sim);
  const threshold = 0.45;
  console.log('Duplicate-scan results (pairs with sim >=', threshold,'):\n');
  results.filter(r=> r.sim>=threshold).forEach(r=> console.log(`${r.a} <-> ${r.b} : ${r.sim}`));
  console.log('\nAll pairs (top 10):');
  results.slice(0,10).forEach(r=> console.log(`${r.a} <-> ${r.b} : ${r.sim}`));
  process.exit(0);
})();
