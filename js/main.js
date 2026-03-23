let GAMES = [];

// load games data from data/games.json for easier maintenance and SEO
fetch('data/games.json').then(r=>{
  if (!r.ok) throw new Error('data/games.json not found');
  return r.json();
}).then(data=>{ GAMES = data; renderGrid(); }).catch(()=>{
  // fallback inline list if data file missing
  GAMES = [
    { id: 'g1', title: 'Geo Dash', img: '', tags:['arcade','geometry'], desc:'Fast-paced geometric runner. Dodge obstacles and survive as long as you can.' },
    { id: 'g2', title: 'Shape Pop', img: '', tags:['puzzle','strategy','singleplayer','challenging'], desc:'Pop matching shapes to clear the board. Think ahead to chain combos.' },
    { id: 'g3', title: 'Line Rider', img: '', tags:['skills','racing'], desc:'Draw lines to guide the rider across geometric tracks.' },
    { id: 'g4', title: 'Quad Wars', img: '', tags:['multiplayer','action','arena','coop','pvp'], desc:'Fight other quads in fast arena matches.' },
  ];
  renderGrid();
});

const $grid = document.getElementById('game-grid');

function createCard(g){
  const el = document.createElement('div'); el.className='game-card game-card-mini'; el.tabIndex=0;
  // build responsive picture element for thumbnails
  const picture = document.createElement('picture');
  let smallImg = null, largeImg = null;
  if (Array.isArray(g.img) && g.img.length){ smallImg = g.img[0]; largeImg = g.img[1] || g.img[0]; }
  else if (g.img) { smallImg = g.img; largeImg = g.img; }
  // resolve to assets path when local
  const toAsset = (p)=> p && !p.startsWith('http') ? `assets/games/${p}` : p;
  const smallSrc = toAsset(smallImg);
  const largeSrc = toAsset(largeImg);
  if (largeSrc){
    const srcLarge = document.createElement('source');
    srcLarge.setAttribute('media','(min-width:600px)');
    srcLarge.setAttribute('srcset', largeSrc);
    picture.appendChild(srcLarge);
  }
  const imgel = document.createElement('img');
  imgel.className = 'card-thumb';
  imgel.src = smallSrc || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22120%22%3E%3Crect width=%22200%22 height=%22120%22 fill=%22%23e6eef0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%236b7280%22 font-size=%2216%22 font-family=%22Arial%22%3EGame%3C/text%3E%3C/svg%3E';
  imgel.alt = g.title || 'Game';
  imgel.loading = 'lazy';
  picture.appendChild(imgel);
  el.appendChild(picture);
  // badge infer: high ratingCount -> HOT
  if (g.rating && g.rating.ratingCount && g.rating.ratingCount > 1000){
    const b = document.createElement('div'); b.className='card-badge'; b.textContent = 'HOT'; el.appendChild(b);
  }
  const info = document.createElement('div'); info.className='info';
  const title = document.createElement('div'); title.className='title'; title.textContent = g.title;
  const publisher = document.createElement('div'); publisher.className='publisher';
  // try common publisher fields, fall back to tag/unknown
  publisher.textContent = g.publisher || g.author || g.dev || (g.tags && g.tags[0]) || 'Unknown';
  info.appendChild(title); info.appendChild(publisher); el.appendChild(info);
  // Launch game inline in the player container on click (no modal/verify)
  el.addEventListener('click', ()=> { loadGame(g.id); });
  el.addEventListener('keydown', (e)=>{ if(e.key==='Enter') loadGame(g.id); });
  return el;
}

function renderGrid(){
  $grid.innerHTML='';
  GAMES.forEach(g=> $grid.appendChild(createCard(g)));
}
// Inline player: inject iframe into #player-inner and show it
function loadGame(id){
  const game = GAMES.find(x=>x.id===id);
  if (!game) return; // silently ignore
  const player = document.getElementById('player');
  const inner = document.getElementById('player-inner');
  // clear previous
  inner.innerHTML = '';
  // build iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'game-iframe';
  iframe.setAttribute('allow', 'autoplay; fullscreen');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups');
  // prefer embedUrl, fallback to url or generated path
  iframe.src = game.embedUrl || game.url || `games/${game.id}/index.html`;
  iframe.style.border = '0';
  iframe.style.width = '100%';
  iframe.style.height = 'calc(100vh - 84px)';
  inner.appendChild(iframe);
  // show player container and scroll into view
  player.style.display = 'block';
  player.scrollIntoView({ behavior: 'smooth' });
  // update title and hash for back/refresh behavior
  try{ document.title = game.title + ' — Geometry Lite'; }catch(e){}
  if (history && history.pushState) history.pushState({ game:id }, '', `#${id}`);
}

// close player and remove iframe
function closePlayer(){
  const player = document.getElementById('player');
  const inner = document.getElementById('player-inner');
  if (!player) return;
  inner.innerHTML = '';
  player.style.display = 'none';
  // restore base title
  try{ document.title = 'Geometry Lite — Prototype'; }catch(e){}
  if (history && history.pushState) history.pushState({}, '', window.location.pathname);
}

// wire exit control
document.addEventListener('DOMContentLoaded', ()=>{
  const exit = document.getElementById('player-exit');
  if (exit) exit.addEventListener('click', closePlayer);
  // if page opened with hash, auto-load that game
  const h = (location.hash||'').replace('#','');
  if (h) setTimeout(()=>{ loadGame(h); }, 250);
});

renderGrid();

/* ---------- Hero particles + scroll-aware SVG control ---------- */
;(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  const heroInner = document.querySelector('.hero-inner');
  const canvas = document.getElementById('hero-canvas');
  const svg = document.querySelector('.geo-svg');
  if (!hero || !canvas || !svg) return;

  // Canvas setup
  const ctx = canvas.getContext('2d');
  // set --vh to support mobile address-bar resizing
  function setVh(){
    try{
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }catch(e){/* ignore */}
  }
  setVh();
  window.addEventListener('resize', setVh, { passive: true });
  try{ if (window.visualViewport && window.visualViewport.addEventListener) window.visualViewport.addEventListener('resize', setVh); } catch(e){}
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  function resizeCanvas(){
    const rect = heroInner.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);
  }
  resizeCanvas();
  window.addEventListener('resize', ()=>{ dpr = Math.max(1, window.devicePixelRatio || 1); resizeCanvas(); });

  // particles (configurable)
  let PARTICLE_COUNT = 26;
  const particles = [];
  const ripples = [];
  function rand(min,max){ return Math.random()*(max-min)+min }

  // read CSS token colors (fall back to defaults)
  const docStyles = getComputedStyle(document.documentElement);
  const cssBrand = docStyles.getPropertyValue('--brand').trim() || '#5dd0d4';
  const cssBrand2 = docStyles.getPropertyValue('--brand-2').trim() || '#7b61ff';
  // default palette reads CSS vars but presets below may override
  let palette = [cssBrand2 || '#7b61ff', cssBrand || '#5dd0d4', '#ffffff', 'rgba(255,255,255,0.7)'];

  // presets for tuning quickly
  const presets = {
    light: {
      count: 20,
      palette: [cssBrand, cssBrand2, '#ffffff', 'rgba(255,255,255,0.6)'],
      speed: 0.85,
      size: [0.9, 2.4],
      alpha: [0.06, 0.32]
    },
    target: {
      count: 40,
      palette: [cssBrand2 || '#7b61ff', cssBrand || '#5dd0d4', '#e6f9ff', 'rgba(255,255,255,0.7)'],
      speed: 1.05,
      size: [1.2, 3.6],
      alpha: [0.06, 0.42]
    },
    active: {
      count: 70,
      palette: [cssBrand2 || '#7b61ff', '#9bd9ff', cssBrand || '#5dd0d4', '#ffffff'],
      speed: 1.5,
      size: [1.6, 4.6],
      alpha: [0.12, 0.6]
    }
  };

  // apply default preset
  let currentPreset = presets.target;
  PARTICLE_COUNT = currentPreset.count;
  palette = currentPreset.palette.slice();

  function createParticles(){
    particles.length = 0;
    const w = canvas.width / dpr; const h = canvas.height / dpr;
    // scale particle count by area (clamped)
    const areaScale = Math.max(0.6, Math.min(1.8, (w*h) / (800*200)));
    const count = Math.round(PARTICLE_COUNT * areaScale);
    for(let i=0;i<count;i++){
      const sizeMin = (currentPreset && currentPreset.size) ? currentPreset.size[0] : 1;
      const sizeMax = (currentPreset && currentPreset.size) ? currentPreset.size[1] : 3.2;
      const speed = (currentPreset && currentPreset.speed) ? currentPreset.speed : 1;
      const alphaMin = (currentPreset && currentPreset.alpha) ? currentPreset.alpha[0] : 0.08;
      const alphaMax = (currentPreset && currentPreset.alpha) ? currentPreset.alpha[1] : 0.45;
      particles.push({ x: rand(0,w), y: rand(0,h), r: rand(sizeMin,sizeMax), vx: rand(-0.12*speed,0.12*speed), vy: rand(-0.06*speed,0.06*speed), alpha: rand(alphaMin,alphaMax), c: palette[Math.floor(Math.random()*palette.length)] });
    }
  }
  createParticles();

  let running = true;

  function applyRipples(){
    if (!ripples.length) return;
    for (let i= ripples.length-1; i>=0; i--){
      const r = ripples[i];
      r.t += 1;
      r.radius += r.growth;
      if (r.t > r.max) ripples.splice(i,1);
    }
    particles.forEach(p=>{
      ripples.forEach(r=>{
        const dx = p.x - r.x, dy = p.y - r.y; const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < r.radius+20){
          const force = (1 - (dist / (r.radius+20))) * r.strength;
          p.vx += (dx/dist||0) * force * 0.6;
          p.vy += (dy/dist||0) * force * 0.6;
        }
      });
    });
  }

  function drawParticles(){
    if (!running) return;
    const w = canvas.width / dpr; const h = canvas.height / dpr;
    ctx.clearRect(0,0,w,h);
    applyRipples();
    // optional soft connections
    const connThreshold = 64;
    // draw particles
    for (let i=0;i<particles.length;i++){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.995; p.vy *= 0.995;
      if (p.x < -12) p.x = w + 12; if (p.x > w + 12) p.x = -12;
      if (p.y < -12) p.y = h + 12; if (p.y > h + 12) p.y = -12;

      // glow circle
      ctx.beginPath();
      ctx.fillStyle = p.c || 'rgba(123,97,255,0.22)';
      ctx.globalAlpha = Math.min(1, Math.max(0.04, p.alpha));
      ctx.shadowBlur = Math.min(24, Math.max(6, p.r * 6));
      ctx.shadowColor = p.c || 'rgba(123,97,255,0.18)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
      // reset shadow
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.globalAlpha = 1;
    }

    // draw faint connecting lines for nearby particles
    ctx.lineWidth = 0.9; ctx.strokeStyle = 'rgba(123,97,255,0.06)';
    for (let i=0;i<particles.length;i++){
      const a = particles[i];
      for (let j=i+1;j<particles.length;j++){
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y; const d = Math.sqrt(dx*dx+dy*dy);
        if (d < connThreshold){
          ctx.globalAlpha = (1 - (d/connThreshold)) * 0.45 * Math.min(1, (a.alpha + b.alpha));
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // animation loop
  let rafId = null;
  function loop(){ drawParticles(); rafId = requestAnimationFrame(loop); }
  if (!prefersReduced) loop();

  // scroll-aware control: pause/dim svg and particles when hero scrolled past threshold
  let ticking = false;
  function onScroll(){ if (ticking) return; ticking = true; requestAnimationFrame(()=>{
    const rect = hero.getBoundingClientRect();
    // when hero top is above -20% of height or bottom below 20% => reduce
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visibleRatio = Math.max(0, Math.min(1, (rect.bottom) / (vh + rect.height)));
    if (visibleRatio < 0.35){
      svg.classList.add('paused');
      svg.classList.remove('slow');
      canvas.style.opacity = '0.08';
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else if (visibleRatio < 0.7){
      svg.classList.remove('paused'); svg.classList.add('slow');
      canvas.style.opacity = '0.45';
      if (!running && !prefersReduced){ running = true; loop(); }
    } else {
      svg.classList.remove('paused'); svg.classList.remove('slow');
      canvas.style.opacity = '1';
      if (!running && !prefersReduced){ running = true; loop(); }
    }
    ticking = false;
  }); }

  window.addEventListener('scroll', onScroll, { passive: true });
  try { if (window.visualViewport && window.visualViewport.addEventListener) window.visualViewport.addEventListener('resize', onScroll); } catch(e){}

  // pointer interactions: ripples on hover, drag influence
  let pointerActive = false; let lastPX = 0, lastPY = 0, lastT = 0;
  function spawnRipple(x,y,opts={}){
    ripples.push({ x, y, radius: opts.start||8, growth: opts.growth||4.5, max: opts.max||40, t:0, strength: opts.strength||0.95 });
  }

  function handlePointerDown(e){
    pointerActive = true; lastPX = e.clientX; lastPY = e.clientY; lastT = performance.now();
    // while dragging on some Android browsers, lock touch-action to allow smooth pointercapture
    try{ heroInner.style.touchAction = 'none'; }catch(err){}
    const rect = heroInner.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    spawnRipple(x,y,{ start:10, growth:6, max:60, strength:1.6 });
  }
  function handlePointerMove(e){
    const now = performance.now();
    const rect = heroInner.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const dt = Math.max(8, now - lastT);
    const dx = e.clientX - lastPX, dy = e.clientY - lastPY;
    const speed = Math.sqrt(dx*dx+dy*dy) / dt;
    // when dragging, push nearby particles
    if (pointerActive){
      particles.forEach(p=>{
        const pdx = p.x - x, pdy = p.y - y; const dist = Math.sqrt(pdx*pdx + pdy*pdy);
        if (dist < 120){
          p.vx += (dx/dt) * (0.45 + (1 - dist/120) * 0.9);
          p.vy += (dy/dt) * (0.45 + (1 - dist/120) * 0.9);
        }
      });
      // create a gentle ripple while dragging
      if (Math.abs(dx)+Math.abs(dy) > 8) spawnRipple(x,y,{ start:6, growth:4, max:36, strength:0.9 });
    } else {
      // hover: create small ripple on fast pointer moves (mouse hover)
      if (speed > 0.25) spawnRipple(x,y,{ start:4, growth:3.2, max:28, strength:0.55 });
    }
    lastPX = e.clientX; lastPY = e.clientY; lastT = now;
  }
  function handlePointerUp(e){ pointerActive = false; }

  // attach to heroInner so canvas can remain pointer-events:none
  heroInner.addEventListener('pointerdown', handlePointerDown);
  heroInner.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  // recreate particles on resize/layout change
  const resizeObserver = new ResizeObserver(()=>{ createParticles(); resizeCanvas(); });
  resizeObserver.observe(heroInner);

  // expose simple API for tuning via console
  window.heroParticles = {
    setCount(n){ PARTICLE_COUNT = Math.max(6, Math.min(200, Math.round(n))); createParticles(); },
    setPalette(arr){ if (Array.isArray(arr) && arr.length){ for(let i=0;i<arr.length;i++) palette[i]=arr[i]; createParticles(); } },
    applyPreset(name){ if (presets[name]){ currentPreset = presets[name]; PARTICLE_COUNT = currentPreset.count; palette = currentPreset.palette.slice(); createParticles(); } },
    spawnRipple(x,y,opts){ spawnRipple(x,y,opts); },
    pause(){ running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; },
    resume(){ if (!running){ running = true; loop(); } }
  };

})();
