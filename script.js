'use strict';

// ====== CONFIG ======
const CONFIG = {
  friendName: 'Harini',
  tagline: 'My bestestt friend and sister',
  bigWish: 'Happy Birthday, Harini! 🥳',
  // Replace with your own images or links (local paths in the same folder or remote URLs)
  gallery: [
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520975922284-9bcd5dcf8d61?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520975682031-1265b39be1be?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e47?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520975594083-4e3b3a4a92c8?q=80&w=1600&auto=format&fit=crop'
  ],
  // A sweet background track (royalty-free). You can replace with a local file like 'music.mp3' in the same folder.
  music: 'https://cdn.pixabay.com/download/audio/2022/02/23/audio_9b3af7e193.mp3?filename=warm-memories-110058.mp3',
  lines: [
    'From our first laugh to our latest adventure,',
    "you've filled life with color and warmth.",
    'Today we celebrate you and your magic.'
  ],
  // Seed images to persist on first load (after you copy files into images/)
  seedImages: [
    { path: 'images/harini1.jpg', caption: 'Timeless Grace' },
    { path: 'images/harini2.jpg', caption: 'Golden Glow' },
    { path: 'images/harini3.jpg', caption: 'Blooming Elegance' },
    { path: 'images/harini4.jpg', caption: 'Fearless Spirit' },
    { path: 'images/harini5.jpg', caption: 'Shine On' },
    { path: 'images/harini6.jpg', caption: 'Spark of Joy' },
  ],
  // Story Reel can use a separate curated set
  reelSeed: [
    { path: 'images/reel1.jpg', caption: 'Brother & Sister — a bond beyond words.' },
    { path: 'images/reel2.jpg', caption: 'Thank you for every shared smile.' },
    { path: 'images/reel3.jpg', caption: 'You lead with grace; I follow with pride.' },
    { path: 'images/reel4.jpg', caption: 'From silly fights to fiercest allies.' },
    { path: 'images/reel5.jpg', caption: 'Your joy is our celebration.' }
  ],
  // Back-of-card long message
  cardBackQuote: `To my best friend and elder sister: thank you for every gentle nudge, 
for every loud laugh, and for standing beside me in every season. 
You teach me kindness by the way you live, courage by the way you rise, 
and joy by the way you light up a room. 
No matter how far we wander, we will always find our way back to each other.
Happy Birthday, Harini. With all my love.`,
  // Optional per-card backs (first six cards)
  cardBacks: [
    'Happy birthday my vaanara kutti enjoy your day with smile .',
    'My chella akka thanks for being my soul .',
    'Iam always there for you my uyire',
    'My Bestest friend ever.Iam so lucky to have you in my life thangam',
    'Treat mukkiyam uyire',
    'Thanks for everything my dear'
  ],
  // Default playlist to seed (files placed in /music)
  playlist: [
    { path: 'music/song1.mpeg', title: 'Track 1' },
    { path: 'music/song2.mpeg', title: 'Track 2' },
    { path: 'music/song3.mpeg', title: 'Track 3' }
  ],
};

// ====== Helpers ======
const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

// ====== IndexedDB (Persistence) ======
let __db;
function openDB(){
  return new Promise((resolve, reject) => {
    if (__db) return resolve(__db);
    const req = indexedDB.open('birthdaySite', 4);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
      // Recreate 'song' with autoIncrement for playlist support
      if (db.objectStoreNames.contains('song')) db.deleteObjectStore('song');
      db.createObjectStore('song', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('wishes')) db.createObjectStore('wishes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('reel')) db.createObjectStore('reel', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => { __db = req.result; resolve(__db); };
    req.onerror = () => reject(req.error);
  });
}

async function seedReelFromConfig(){
  if (!CONFIG.reelSeed || !CONFIG.reelSeed.length) { __reelPairs = __currentPairs.slice(); return; }
  try {
    await openDB();
    const list = [];
    for (const item of CONFIG.reelSeed){
      const res = await fetch(item.path);
      if (!res.ok) continue;
      const blob = await res.blob();
      await idbPut('reel', { blob, caption: item.caption, createdAt: Date.now() });
      const url = URL.createObjectURL(blob);
      __objectUrls.push(url);
      list.push({ src: url, caption: item.caption });
    }
    __reelPairs = list.length ? list : __currentPairs.slice();
  } catch { __reelPairs = __currentPairs.slice(); }
}

// ====== Story Reel (Fullscreen Cinematic)
let __reelTL;
async function playStoryReel(){
  // Ensure reel pairs are loaded from DB or file system before playing
  if (!__reelPairs.length) {
    try {
      const rows = await idbGetAll('reel');
      if (rows && rows.length) {
        __reelPairs = rows.map(r => {
          const url = URL.createObjectURL(r.blob);
          __objectUrls.push(url);
          return { src: url, caption: r.caption || '' };
        });
      }
    } catch {}
    if (!__reelPairs.length) {
      const guesses = ['images/reel1.jpg','images/reel2.jpg','images/reel3.jpg','images/reel4.jpg','images/reel5.jpg'];
      const list = [];
      for (const p of guesses){
        try { const r = await fetch(p, { cache: 'no-store' }); if (r.ok){ const b = await r.blob(); const url = URL.createObjectURL(b); __objectUrls.push(url); list.push({src:url, caption:''}); } } catch {}
      }
      if (list.length) __reelPairs = list;
    }
  }
  const pairs = __reelPairs.length ? __reelPairs : __currentPairs;
  if (!pairs.length) return;
  const overlay = document.createElement('div');
  overlay.className = 'reel';
  overlay.innerHTML = `
    <div class="topbar">
      <div class="progress"><div id="reelBar"></div></div>
      <button class="close" id="reelClose">Close</button>
    </div>
    <img id="reelImg" alt="Story Reel" />
    <div class="vignette"></div>
    <div class="caption" id="reelCaption"></div>
  `;
  document.body.appendChild(overlay);
  const imgEl = qs('#reelImg', overlay);
  const capEl = qs('#reelCaption', overlay);
  const bar = qs('#reelBar', overlay);
  qs('#reelClose', overlay).addEventListener('click', () => closeReel(overlay));

  // Compose scenes with fallback sibling/friend captions
  const baseLines = [
    'To my sister and best friend — the heart of every memory.',
    'For every laugh we shared and every storm we faced together.',
    'Your strength, grace and kindness light our world.',
    "I am always your brother first, and your forever friend.",
    'Happy Birthday, Harini — keep shining.'
  ];
  const scenes = pairs.map((p, i) => ({
    src: p.src,
    caption: (p.caption && p.caption.trim()) || baseLines[i % baseLines.length]
  }));

  // GSAP timeline
  gsap.killTweensOf(imgEl);
  gsap.killTweensOf(capEl);
  __reelTL && __reelTL.kill();
  __reelTL = gsap.timeline({ onComplete: ()=>closeReel(overlay) });

  const per = 100 / scenes.length;
  scenes.forEach((scene, idx) => {
    __reelTL.add(() => {
      imgEl.style.opacity = 0;
      imgEl.src = scene.src;
      capEl.textContent = scene.caption;
    });
    __reelTL.to(imgEl, { duration: 0.6, opacity: 1, ease: 'power2.out' });
    __reelTL.fromTo(imgEl, { scale: 1.05, x: 0, y: 0 }, { duration: 3.8, scale: 1.16, x: (Math.random()*60-30), y: (Math.random()*40-20), ease: 'sine.inOut' }, '<');
    __reelTL.fromTo(capEl, { opacity: 0, y: 10 }, { duration: 0.6, opacity: 1, y: 0, ease: 'power2.out' }, '<0.1');
    __reelTL.to(bar, { width: `${(idx+1)*per}%`, duration: 0.2, ease: 'none' }, '<');
    // hold then fade
    __reelTL.to(imgEl, { duration: 0.4, opacity: 0, ease: 'power2.in' }, '>-0.1');
    __reelTL.to(capEl, { duration: 0.3, opacity: 0, ease: 'power2.in' }, '<');
  });
}

function closeReel(overlay){
  try { __reelTL && __reelTL.kill(); } catch {}
  overlay && overlay.remove();
}

async function idbPut(store, value){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAll(store){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbClear(store){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(store, key){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ====== Preloader ======
window.addEventListener('load', () => {
  setTimeout(() => {
    qs('#preloader').style.display = 'none';
    qs('#app').classList.remove('hidden');
    init();
  }, 600);
});

function init(){
  // Text content
  qs('#friendName').textContent = CONFIG.friendName;
  qs('#footerName').textContent = CONFIG.friendName;
  qs('#tagline').textContent = CONFIG.tagline;
  qs('#bigWish').textContent = CONFIG.bigWish;

  // Music (single-track mode)
  const audio = qs('#bgm');
  audio.src = CONFIG.music;
  let soundOn = false;
  const soundBtn = qs('#soundBtn');
  const enterBtn = qs('#enterBtn');
  const setSongBtn = qs('#setSongBtn');
  const songInput = qs('#songInput');
  const countdownEl = qs('#countdown');

  // Single-track: do not attach playlist sequencer
  audio.onended = () => { enterBtn.textContent = '🎵'; };

  function setSoundLabel(){
    const muted = (audio.muted || audio.volume===0);
    soundBtn.textContent = muted ? 'Music Off 🔇' : 'Music On 🔊';
  }
  soundBtn.addEventListener('click', ()=> { audio.muted = !audio.muted; setSoundLabel(); });

  // Play/Pause button behavior (emoji button)
  enterBtn.textContent = '🎵';
  enterBtn.addEventListener('click', async () => {
    // Ensure we have a source: prefer first of playlist if available
    if (!audio.src || audio.src.startsWith('data:') || audio.src === CONFIG.music){
      await ensurePlaylistReady();
      if (__playlist && __playlist.length){
        audio.src = __playlist[0];
      }
    }
    if (audio.paused){
      audio.play().then(()=>{ enterBtn.textContent = '⏸️'; }).catch(()=>{});
      introSequence();
    } else {
      audio.pause();
      enterBtn.textContent = '🎵';
    }
  });

  // Song upload + persist
  if (setSongBtn && songInput) {
    setSongBtn.addEventListener('click', () => songInput.click());
    songInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      await saveSong(file);
      const url = URL.createObjectURL(file);
      __objectUrls.push(url);
      audio.src = url;
      if (soundOn) audio.play().catch(()=>{});
      songInput.value = '';
    });
  }

  // Gallery (initial, may be replaced by persisted or seeded)
  buildGalleryFromPairs(CONFIG.gallery.map((src,i)=>({src, caption: ''})));

  // Upload UI wiring
  const uploadBtn = qs('#uploadBtn');
  const uploadInput = qs('#uploadInput');
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      uploadInput.value = '';
    });
  }

  // Drag & Drop support
  const gallerySection = qs('#gallery');
  if (gallerySection) {
    ['dragenter','dragover'].forEach(ev => gallerySection.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      gallerySection.classList.add('dragging');
    }));
    ['dragleave','drop'].forEach(ev => gallerySection.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      gallerySection.classList.remove('dragging');
    }));
    gallerySection.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files) handleFiles(dt.files);
    });
  }

  // Three.js starfield
  buildStarfield();

  // Cinematic lines
  typeCinematic(CONFIG.lines);

  // Buttons
  qs('#confettiBtn').addEventListener('click', burstConfetti);
  qs('#shareBtn').addEventListener('click', sharePage);

  // Load persisted media
  loadPersisted();

  // Start countdown
  startCountdown(countdownEl);

  // Init theme
  initTheme();

  // Init slideshow controls
  initSlideshow();

  // Init wishes
  initWishes();

  // Always-on subtle fireworks confetti
  ambientConfettiLoop();

  // UI tweaks: remove Set Song, and hide fireworks section
  const __setSongEl = qs('#setSongBtn');
  if (__setSongEl) __setSongEl.remove();
  const __fwSection = qs('.fireworks');
  if (__fwSection) __fwSection.remove();

  // Keep sound button label in sync
  const __soundBtnEl = qs('#soundBtn');
  const __audioEl = qs('#bgm');
  if (__soundBtnEl && __audioEl) {
    const __setLabel = () => { __soundBtnEl.textContent = (__audioEl.muted || __audioEl.volume === 0) ? 'Music Off 🔇' : 'Music On 🔊'; };
    __setLabel();
    __soundBtnEl.addEventListener('click', () => setTimeout(__setLabel, 0));
  }

  // Inline Story (IG-like) inside slideshow frame
  initInlineStory();

  // Ensure the first six cards show the custom quotes
  enforceCardBackQuotes();
  // Re-apply shortly after dynamic renders
  setTimeout(enforceCardBackQuotes, 300);

  // Gift box interactions
  initGiftBox();
}

// ====== Enforce custom back quotes on first six cards ======
function enforceCardBackQuotes(){
  try {
    const backs = (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.cardBacks)) ? CONFIG.cardBacks : [];
    if (!backs.length) return;
    const cards = document.querySelectorAll('.grid .card');
    cards.forEach((card, idx) => {
      const q = card.querySelector('.back .quote');
      if (!q) return;
      const msg = backs[idx % backs.length];
      if (q.textContent !== msg) q.textContent = msg;
    });
  } catch {}
}

// ====== Cinematic Text ======
function typeCinematic(lines){
  const ids = ['#line1','#line2','#line3'];
  ids.forEach((sel,i) => {
    const el = qs(sel);
    el.textContent = '';
    const text = lines[i] || '';
    let idx = 0;
    setTimeout(() => {
      el.classList.add('active');
      const interval = setInterval(() => {
        el.textContent = text.slice(0, idx++);
        if(idx > text.length) clearInterval(interval);
      }, 24);
    }, i * 1200 + 400);
  });
}

function introSequence(){
  gsap.registerPlugin(ScrollTrigger);
  const tl = gsap.timeline();
  tl.from('#friendName', { y: 20, opacity: 0, duration: 1.0, ease: 'power3.out' })
    .from('#tagline', { y: 10, opacity: 0, duration: 0.8 }, '-=0.6')
    .from('.actions', { y: 10, opacity: 0, duration: 0.6 }, '-=0.5')
    .to('#hero .glow', { opacity: 0.4, duration: 1.2 }, 0);

  // Parallax on scroll
  gsap.to('#scene', {
    scrollTrigger: { scrub: true },
    opacity: 0.75
  });

  // Fire first confetti subtly
  setTimeout(()=> tinyConfetti(), 1200);
}

// ====== Starfield (Three.js) ======
let renderer, scene, camera, stars;
function buildStarfield(){
  const canvas = qs('#scene');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  resize();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const geometry = new THREE.BufferGeometry();
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  for(let i=0;i<starCount;i++){
    const r = 50 * Math.random() + 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random()*2)-1);
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({ color: 0x88e0ff, size: 0.05, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
  stars = new THREE.Points(geometry, material);
  scene.add(stars);

  animate();
  window.addEventListener('resize', resize);
}

function animate(){
  requestAnimationFrame(animate);
  if(stars){
    stars.rotation.y += 0.0009;
    stars.rotation.x += 0.0003;
  }
  renderer && renderer.render(scene, camera);
}

function resize(){
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  if(camera){ camera.aspect = w/h; camera.updateProjectionMatrix(); }
}

// ====== Gallery ======
function buildGalleryFromPairs(pairs){
  const grid = qs('#galleryGrid');
  grid.innerHTML = '';
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  pairs.forEach(({src, caption}, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    const inner = document.createElement('div'); inner.className = 'inner';
    const front = document.createElement('div'); front.className = 'face front';
    const img = new Image();
    img.src = src; img.alt = caption || 'Memory'; img.loading = 'lazy';
    if (!isTouch) {
      img.addEventListener('click', () => openLightbox(src));
    }
    front.appendChild(img);
    const back = document.createElement('div'); back.className = 'face back';
    const quote = document.createElement('div'); quote.className = 'quote';
    {
      const backs = (CONFIG && Array.isArray(CONFIG.cardBacks)) ? CONFIG.cardBacks : [];
      const msg = backs.length ? backs[idx % backs.length] : '';
      quote.textContent = msg;
    }
    back.appendChild(quote);
    inner.appendChild(front); inner.appendChild(back);
    card.appendChild(inner);
    // Tap-to-flip on touch devices; on desktop, allow click anywhere except on image (which opens lightbox)
    card.addEventListener('click', (e)=>{
      if (isTouch) {
        card.classList.toggle('flipped');
      } else if (e.target.tagName !== 'IMG') {
        card.classList.toggle('flipped');
      }
    });
    grid.appendChild(card);
  });
  __currentGallery = pairs.map(p=>p.src);
  __currentPairs = pairs.slice();
}

// Append new images to the existing grid (used by uploader)
function addToGallery(urls){
  const grid = qs('#galleryGrid');
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  urls.forEach((src, i) => {
    const card = document.createElement('div'); card.className = 'card';
    const inner = document.createElement('div'); inner.className = 'inner';
    const front = document.createElement('div'); front.className = 'face front';
    const img = new Image(); img.src = src; img.alt = 'Memory'; img.loading = 'lazy';
    if (!isTouch) {
      img.addEventListener('click', () => openLightbox(src));
    }
    front.appendChild(img);
    const back = document.createElement('div'); back.className = 'face back';
    const quote = document.createElement('div'); quote.className = 'quote';
    const idx = __currentPairs.length + i; // place in overall order
    const backs = (CONFIG && Array.isArray(CONFIG.cardBacks)) ? CONFIG.cardBacks : [];
    const seqIndex = (__currentPairs.length + i);
    const msg = backs.length ? backs[seqIndex % backs.length] : '';
    quote.textContent = msg;
    back.appendChild(quote);
    inner.appendChild(front); inner.appendChild(back);
    card.appendChild(inner);
    card.addEventListener('click', (e)=>{
      if (isTouch) {
        card.classList.toggle('flipped');
      } else if (e.target.tagName !== 'IMG') {
        card.classList.toggle('flipped');
      }
    });
    grid.appendChild(card);
  });
  __currentGallery.push(...urls);
  __currentPairs.push(...urls.map(src=>({src, caption: ''})));
}

// Handle FileList from input or drop
let __defaultsCleared = false;
const __objectUrls = [];
function handleFiles(fileList){
  const files = Array.from(fileList || []).filter(f => f.type && f.type.startsWith('image/'));
  if (!files.length) return;
  if (!__defaultsCleared) {
    const grid = qs('#galleryGrid');
    if (grid) grid.innerHTML = '';
    __defaultsCleared = true;
  }
  const urls = files.map(f => {
    const url = URL.createObjectURL(f);
    __objectUrls.push(url);
    return url;
  });
  addToGallery(urls);
  // Persist images
  saveImages(files).catch(()=>{});
}
// Cleanup object URLs on unload
window.addEventListener('beforeunload', () => {
  __objectUrls.forEach(u => URL.revokeObjectURL(u));
});

function openLightbox(src){
  qs('#lightboxImg').src = src;
  qs('#lightbox').classList.remove('hidden');
}
qs('#lightboxClose').addEventListener('click', ()=> qs('#lightbox').classList.add('hidden'));
qs('#lightbox').addEventListener('click', (e)=>{ if(e.target.id==='lightbox') qs('#lightbox').classList.add('hidden'); });

// ====== Confetti ======
function burstConfetti(){
  // Big blast
  confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 } });
  confetti({ particleCount: 140, spread: 120, startVelocity: 45, origin: { y: 0.7 } });
}
function tinyConfetti(){
  confetti({ particleCount: 40, spread: 50, startVelocity: 25, origin: { y: 0.7 } });
}

// ====== Share ======
async function sharePage(){
  const url = location.href;
  const text = `Happy Birthday ${CONFIG.friendName}!`; 
  if(navigator.share){
    try { await navigator.share({ title: 'Birthday Wish', text, url }); } catch {}
  } else {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied! Share the love 💖');
    } catch {
      prompt('Copy this link:', url);
    }
  }
}

// ====== Persistence helpers ======
async function loadPersisted(){
  try {
    const params = new URLSearchParams(location.search);
    const forceSeed = params.has('seed');
    const forceReelSeed = params.has('seedReel');
    const forceSongsSeed = params.has('seedSongs');
    // Seed or load songs (playlist)
    if (forceSongsSeed) {
      await idbClear('song');
    }
    const songs = await idbGetAll('song');
    const audio = qs('#bgm');
    if (songs.length && !forceSongsSeed) {
      // Pick the most recently updated
      const latest = songs.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
      const blob = latest.blob;
      if (blob) {
        const url = URL.createObjectURL(blob);
        __objectUrls.push(url);
        audio.src = url;
      }
      // Build playlist (in updated order)
      const ordered = songs.slice().sort((a,b)=>(a.updatedAt||0)-(b.updatedAt||0));
      __playlist = ordered.map(s=>{ const u = URL.createObjectURL(s.blob); __objectUrls.push(u); return u; });
      __songIndex = 0;
      window.__playlist = __playlist; window.__songIndex = __songIndex;
      setupAudioSequencer();
    } else {
      // Try config seeding first, else fall back to local music files if present
      await seedSongsFromConfig();
      if (!audio.src) {
        const fallbackSongs = ['music/song3.mpeg','music/song2.mpeg','music/song1.mpeg'];
        for (const p of fallbackSongs){
          try {
            const r = await fetch(p);
            if (r.ok) {
              const blob = await r.blob();
              // Persist to playlist store
              await idbPut('song', { blob, title: p.split('/').pop(), updatedAt: Date.now() });
              const url = URL.createObjectURL(blob);
              __objectUrls.push(url);
              audio.src = url; break;
            }
          } catch {}
        }
      }
      // Build playlist from DB after seeding
      const songs2 = await idbGetAll('song');
      const ordered2 = songs2.slice().sort((a,b)=>(a.updatedAt||0)-(b.updatedAt||0));
      __playlist = ordered2.map(s=>{ const u = URL.createObjectURL(s.blob); __objectUrls.push(u); return u; });
      __songIndex = 0;
      window.__playlist = __playlist; window.__songIndex = __songIndex;
      setupAudioSequencer();
    }
    // Load or seed images
    if (forceSeed) {
      await idbClear('images');
    }
    const imgs = await idbGetAll('images');
    if (imgs.length && !forceSeed) {
      const pairs = imgs.map(r => {
        const url = URL.createObjectURL(r.blob);
        __objectUrls.push(url);
        return { src: url, caption: r.caption || '' };
      });
      buildGalleryFromPairs(pairs);
    } else {
      // Seed from CONFIG if no persisted images, then try local file fallbacks
      await seedImagesFromConfig();
      if (!__currentPairs.length) {
        const guesses = ['images/harini1.jpg','images/harini2.jpg','images/harini3.jpg','images/harini4.jpg','images/harini5.jpg','images/harini6.jpg'];
        const pairs = [];
        for (const p of guesses){
          try {
            const r = await fetch(p);
            if (r.ok){
              const b = await r.blob();
              // Persist image
              await idbPut('images', { blob: b, caption: '', createdAt: Date.now() });
              const url = URL.createObjectURL(b);
              __objectUrls.push(url);
              pairs.push({src:url, caption:''});
            }
          } catch {}
        }
        if (pairs.length) buildGalleryFromPairs(pairs);
      }
    }

    // Load or seed reel pairs
    if (forceReelSeed) {
      await idbClear('reel');
    }
    const reelRows = await idbGetAll('reel');
    if (reelRows.length && !forceReelSeed) {
      __reelPairs = reelRows.map(r => {
        const url = URL.createObjectURL(r.blob);
        __objectUrls.push(url);
        return { src: url, caption: r.caption || '' };
      });
    } else {
      await seedReelFromConfig();
      // If still empty, try loading from /images/reel*.jpg directly
      if (!__reelPairs.length) {
        const guesses = ['images/reel1.jpg','images/reel2.jpg','images/reel3.jpg','images/reel4.jpg','images/reel5.jpg','images/reel6.jpg'];
        const pairs = [];
        for (const p of guesses){
          try {
            const r = await fetch(p);
            if (r.ok){
              const b = await r.blob();
              // Persist reel image
              await idbPut('reel', { blob: b, caption: '', createdAt: Date.now() });
              const url = URL.createObjectURL(b);
              __objectUrls.push(url);
              pairs.push({src:url, caption:''});
            }
          } catch {}
        }
        if (pairs.length) __reelPairs = pairs;
      }
    }

    // If gallery is still empty but we have reel images, mirror them into gallery view
    if (!__currentPairs.length && __reelPairs.length) {
      buildGalleryFromPairs(__reelPairs.map(p=>({src:p.src, caption:p.caption||''})));
    }
  } catch (e) {
    // ignore
  }
}

async function saveImages(files){
  await openDB();
  for (const f of files) {
    await idbPut('images', { blob: f, createdAt: Date.now() });
  }
}

async function saveSong(file){
  await openDB();
  // Insert as a new playlist entry
  await idbPut('song', { blob: file, updatedAt: Date.now() });
}

// Fetch and persist seed images defined in CONFIG.seedImages
async function seedSongsFromConfig(){
  if (!CONFIG.playlist || !CONFIG.playlist.length) return;
  try {
    await openDB();
    const pairs = [];
    for (const item of CONFIG.playlist){
      const res = await fetch(item.path);
      if (!res.ok) continue;
      const blob = await res.blob();
      await idbPut('song', { blob, updatedAt: Date.now() });
      const url = URL.createObjectURL(blob);
      __objectUrls.push(url);
      pairs.push({ src: url, caption: item.caption });
    }
    if (pairs.length) {
      const audio = qs('#bgm');
      audio.src = pairs[0].src;
    }
  } catch {}
}

// Fetch and persist seed images defined in CONFIG.seedImages
async function seedImagesFromConfig(){
  if (!CONFIG.seedImages || !CONFIG.seedImages.length) return;
  try {
    await openDB();
    const pairs = [];
    for (const item of CONFIG.seedImages){
      const res = await fetch(item.path);
      if (!res.ok) continue;
      const blob = await res.blob();
      await idbPut('images', { blob, caption: item.caption, createdAt: Date.now() });
      const url = URL.createObjectURL(blob);
      __objectUrls.push(url);
      pairs.push({ src: url, caption: item.caption });
    }
    if (pairs.length) buildGalleryFromPairs(pairs);
  } catch {}
}

// ====== Countdown ======
function startCountdown(el){
  if (!el) return;
  // Static display as requested
  el.textContent = '12.00.00';
}

function celebrateBig(){
  // Confetti wave
  const end = Date.now() + 2000;
  (function frame(){
    confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, zIndex: 999999 });
    confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, zIndex: 999999 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// Always-on subtle confetti
function ambientConfettiLoop(){
  const shoot = () => {
    confetti({ particleCount: 12, spread: 40, startVelocity: 25, origin: { x: Math.random(), y: Math.random()*0.4+0.1 }, zIndex: 999999 });
  };
  setInterval(shoot, 3200);
}
// ====== Fireworks (confetti-based) ======
const fwBtn = () => qs('#fireworksBtn');
function startFireworksBurst(){
  const duration = 3500;
  const animationEnd = Date.now() + duration;
  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const count = 40 * (timeLeft / duration);
    confetti({
      particleCount: Math.round(count),
      startVelocity: 45,
      spread: 70 + Math.random()*20,
      origin: { x: Math.random(), y: Math.random()*0.4 + 0.2 },
      zIndex: 999999
    });
  }, 200);
}
document.addEventListener('click', (e)=>{
  if (e.target && e.target.id === 'fireworksBtn') startFireworksBurst();
});

// ====== Slideshow (Ken Burns)
let __currentGallery = [];
let __currentPairs = [];
let __reelPairs = [];
let __playlist = [];
let __songIndex = 0;

function setupAudioSequencer(){ /* disabled in single-track mode */ }

// Build playlist if not yet available (from IndexedDB or CONFIG playlist)
async function ensurePlaylistReady(){
  try {
    if (__playlist && __playlist.length) return;
    const rows = await idbGetAll('song');
    if (rows && rows.length){
      __playlist = rows.map(r => { const u = URL.createObjectURL(r.blob); __objectUrls.push(u); return u; });
      window.__playlist = __playlist;
      return;
    }
    // seed from CONFIG if no DB rows
    await seedSongsFromConfig();
    const rows2 = await idbGetAll('song');
    if (rows2 && rows2.length){
      __playlist = rows2.map(r => { const u = URL.createObjectURL(r.blob); __objectUrls.push(u); return u; });
      window.__playlist = __playlist;
    }
  } catch {}
}
let __slideIndex = 0;
let __slidePlaying = false;
let __slideTimer;
const slideImg = () => qs('#slideImg');
function setSlide(i){
  if (!__currentGallery.length) return;
  __slideIndex = (i + __currentGallery.length) % __currentGallery.length;
  const el = slideImg();
  if (!el) return;
  // Crossfade
  gsap.killTweensOf(el);
  gsap.to(el, { opacity: 0, duration: 0.3, onComplete: () => {
    el.src = __currentGallery[__slideIndex];
    el.style.transform = 'scale(1.05) translate(0px, 0px)';
    gsap.set(el, { opacity: 1 });
    // Ken Burns
    gsap.to(el, { duration: 6, scale: 1.18, x: (Math.random()*40-20), y: (Math.random()*30-15), ease: 'sine.inOut' });
  }});
}
function nextSlide(){ setSlide(__slideIndex+1); }
function prevSlide(){ setSlide(__slideIndex-1); }
function playSlides(){
  if (__slidePlaying) return;
  __slidePlaying = true;
  qs('#toggleSlide').textContent = 'Pause';
  setSlide(__slideIndex);
  __slideTimer = setInterval(nextSlide, 6500);
}
function pauseSlides(){
  __slidePlaying = false;
  qs('#toggleSlide').textContent = 'Play';
  clearInterval(__slideTimer);
}
function toggleSlides(){ __slidePlaying ? pauseSlides() : playSlides(); }
function initSlideshow(){
  const prev = qs('#prevSlide');
  const next = qs('#nextSlide');
  const toggle = qs('#toggleSlide');
  prev && prev.addEventListener('click', prevSlide);
  next && next.addEventListener('click', nextSlide);
  toggle && toggle.addEventListener('click', toggleSlides);
  const playReelBtn = qs('#playReelBtn');
  // Wire to inline story instead of fullscreen
  playReelBtn && playReelBtn.addEventListener('click', startInlineStory);
}

// ====== Inline Story (IG-like, inside slideshow frame) ======
let __storyIdx = 0;
let __storyTimer = null;
let __storyBooted = false;

function ensureReelPairsLoadedForInline(){
  return (async () => {
    if (__reelPairs.length) return __reelPairs;
    try {
      const rows = await idbGetAll('reel');
      if (rows && rows.length){
        __reelPairs = rows.map(r => {
          const url = URL.createObjectURL(r.blob);
          __objectUrls.push(url);
          return { src: url, caption: r.caption || '' };
        });
      }
    } catch {}
    if (!__reelPairs.length){
      const guesses = ['images/reel1.jpg','images/reel2.jpg','images/reel3.jpg','images/reel4.jpg','images/reel5.jpg'];
      const list = [];
      for (const p of guesses){
        try { const r = await fetch(p, { cache: 'no-store' }); if (r.ok){ const b = await r.blob(); const u = URL.createObjectURL(b); __objectUrls.push(u); list.push({ src: u, caption: '' }); } } catch {}
      }
      if (list.length) __reelPairs = list;
    }
    return __reelPairs;
  })();
}

function initInlineStory(){
  const frame = qs('.slideshow-frame');
  if (!frame) return;
  if (!qs('.story-inline', frame)){
    const wrap = document.createElement('div');
    wrap.className = 'story-inline';
    wrap.innerHTML = `
      <div class="segments" id="storySegs"></div>
      <div class="circle"><img id="storyImg" alt="Story"/></div>
      <div class="caption" id="storyCap"></div>
      <div class="tap" id="storyTap"></div>
    `;
    frame.appendChild(wrap);
  }
  const tap = qs('#storyTap');
  if (tap && !tap.__bound){ tap.addEventListener('click', nextStoryScene); tap.__bound = true; }
  if (!__storyBooted){ __storyBooted = true; setTimeout(() => startInlineStory(), 250); }
}

async function startInlineStory(){
  initInlineStory();
  const frame = qs('.slideshow-frame');
  if (frame) frame.classList.add('story-playing');
  const pairs = await ensureReelPairsLoadedForInline();
  if (!pairs.length) return;
  __storyIdx = 0;
  buildStorySegments(pairs.length);
  renderStoryScene(pairs[0]);
  runStoryProgress();
}

function buildStorySegments(n){
  const segs = qs('#storySegs');
  if (!segs) return;
  segs.innerHTML = '';
  for (let i=0;i<n;i++){
    const s = document.createElement('span');
    const iEl = document.createElement('i');
    s.appendChild(iEl); segs.appendChild(s);
  }
}

function renderStoryScene(scene){
  const img = qs('#storyImg');
  const cap = qs('#storyCap');
  if (img) img.src = scene.src;
  if (cap) cap.textContent = scene.caption || '';
}

function runStoryProgress(){
  stopInlineStoryTimer();
  const segs = qs('#storySegs');
  if (!segs) return;
  const spans = segs.querySelectorAll('span');
  spans.forEach((s, i)=> s.querySelector('i').style.width = i < __storyIdx ? '100%' : '0%');
  const bar = spans[__storyIdx]?.querySelector('i');
  if (!bar) return;
  let w = 0;
  __storyTimer = setInterval(async ()=>{
    w += 2; // ~5s per scene
    bar.style.width = Math.min(100, w) + '%';
    if (w >= 100) await nextStoryScene();
  }, 100);
}

async function nextStoryScene(){
  const pairs = await ensureReelPairsLoadedForInline();
  if (!pairs.length) return;
  __storyIdx = (__storyIdx + 1) % pairs.length;
  renderStoryScene(pairs[__storyIdx]);
  runStoryProgress();
}

function stopInlineStoryTimer(){ if (__storyTimer){ clearInterval(__storyTimer); __storyTimer = null; } }

// ====== Wish Wall (persisted)
async function initWishes(){
  try {
    const list = qs('#wishList');
    const form = qs('#wishForm');
    if (!list || !form) return;
    // Load
    const wishes = await idbGetAll('wishes');
    wishes.sort((a,b)=> a.ts - b.ts);
    wishes.forEach(w => renderWish(w));
    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (qs('#wishName').value || 'Someone').trim();
      const text = (qs('#wishText').value || '').trim();
      if (!text) return;
      const wish = { id: Date.now(), name, text, ts: Date.now() };
      await idbPut('wishes', wish);
      renderWish(wish, true);
      // celebratory, neat but subtle
      try { tinyConfetti(); } catch {}
      qs('#wishText').value = '';
    });
  } catch {}
}

function renderWish(wish, prepend=false){
  const list = qs('#wishList');
  const li = document.createElement('li');
  const left = document.createElement('div'); left.className = 'wish';
  const meta = document.createElement('div'); meta.className = 'wish-meta'; meta.textContent = `${wish.name} · ${new Date(wish.ts).toLocaleString()}`;
  const text = document.createElement('div'); text.className = 'wish-text'; text.textContent = wish.text;
  left.appendChild(meta); left.appendChild(text);
  const actions = document.createElement('div'); actions.className = 'wish-actions';
  const del = document.createElement('button'); del.textContent = 'Delete';
  del.addEventListener('click', async ()=>{ await idbDelete('wishes', wish.id); li.remove(); });
  actions.appendChild(del);
  li.appendChild(left); li.appendChild(actions);
  // animate in neatly
  li.classList.add('animate-in');
  li.addEventListener('animationend', ()=> li.classList.remove('animate-in'), { once: true });
  if (prepend && list.firstChild) list.insertBefore(li, list.firstChild); else list.appendChild(li);
  // ensure visible
  try { li.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch {}
}

// ====== Theme Switcher
function initTheme(){
  const select = qs('#themeSelect');
  const saved = localStorage.getItem('theme') || 'starry';
  document.body.setAttribute('data-theme', saved);
  if (select) {
    select.value = saved;
    select.addEventListener('change', (e)=>{
      const theme = e.target.value;
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  }
}
