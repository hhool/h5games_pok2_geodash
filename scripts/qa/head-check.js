const puppeteer = require('puppeteer-core');

(async ()=>{
  const serverPort = process.env.PORT || 8004;
  const base = `http://localhost:${serverPort}`;
  const results = { before: null, after: null, error: null };
  let browser = null;
  try{
    // prefer an explicit executablePath so we can reuse Chrome already on the system
    const execPath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    browser = await puppeteer.launch({ headless: true, executablePath: execPath, args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);

    // load initial game page (g1)
    await page.goto(base + '/g1/', { waitUntil: 'networkidle2' });
    await new Promise(r=>setTimeout(r,200));

    results.before = await page.evaluate(()=>{
      const grabHead = ()=>{
        const meta = Array.from(document.head.querySelectorAll('meta,link,script[type="application/ld+json"]')).map(n=>({ tag: n.tagName.toLowerCase(), outer: n.outerHTML }));
        return meta;
      };
      return {
        title: document.title,
        href: location.href,
        head: grabHead(),
        rootDesc: (document.getElementById('root-desc') && document.getElementById('root-desc').innerHTML) || null,
        gameId: (document.getElementById('root-desc') && document.getElementById('root-desc').getAttribute('data-current-game')) || null
      };
    });

    // find a different game card and click it
    const target = await page.evaluate(()=>{
      const cards = Array.from(document.querySelectorAll('.game-card-mini'));
      const current = (document.getElementById('root-desc') && document.getElementById('root-desc').getAttribute('data-current-game')) || null;
      const other = cards.find(c=> c.getAttribute('data-id') && c.getAttribute('data-id') !== current);
      return other ? other.getAttribute('data-id') : null;
    });

    if (!target) throw new Error('No alternate game card found to click');

    // click the target card
    await page.click(`.game-card-mini[data-id="${target}"]`);

    // wait for SPA updates (updateMeta uses a small timeout client-side)
    await new Promise(r=>setTimeout(r,600));

    results.after = await page.evaluate(()=>{
      const grabHead = ()=>{
        const meta = Array.from(document.head.querySelectorAll('meta,link,script[type="application/ld+json"]')).map(n=>({ tag: n.tagName.toLowerCase(), outer: n.outerHTML }));
        return meta;
      };
      return {
        title: document.title,
        href: location.href,
        head: grabHead(),
        rootDesc: (document.getElementById('root-desc') && document.getElementById('root-desc').innerHTML) || null,
        gameId: (document.getElementById('root-desc') && document.getElementById('root-desc').getAttribute('data-current-game')) || null
      };
    });

    console.log(JSON.stringify(results, null, 2));
  }catch(e){
    results.error = String(e && e.stack ? e.stack : e);
    console.error('head-check error:', results.error);
    process.exitCode = 2;
  }finally{
    if (browser) await browser.close();
  }
})();
