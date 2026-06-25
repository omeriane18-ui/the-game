// ===== CONFIG =====
const GAMES_PER_PAGE = 24;
const DEBOUNCE_MS = 250;

// ===== TRANSLATIONS =====
const T = {
  ar: {
    searchPlaceholder: "ابحث عن لعبة...",
    heroEyebrow: "مكتبة الألعاب العربية الأولى",
    heroTitle: "اكتشف",
    heroGradient: "أفضل الألعاب",
    heroSub: "تصفّح، اكتشف، وحمّل أفضل ألعاب الحاسوب في مكان واحد",
    heroBtnText: "استعرض الألعاب",
    heroBtnText2: "أضف لعبتك",
    statGamesLabel: "لعبة",
    statGenresLabel: "تصنيف",
    statFreeLabel: "الوصول",
    featuredTag: "مميزة",
    featuredTitle: "ألعاب مختارة",
    allGamesTag: "المكتبة",
    allGamesTitle: "جميع الألعاب",
    filterAll: "الكل",
    sortDefault: "الترتيب الافتراضي",
    sortRating: "الأعلى تقييماً",
    sortNewest: "الأحدث",
    sortOldest: "الأقدم",
    sortAlpha: "أ-ي",
    dlBtnText: "تحميل اللعبة",
    shareBtnText: "مشاركة",
    footerDesc: "مكتبة الألعاب العربية الأولى — مجانية وللجميع",
    footerText: "جميع الحقوق محفوظة © 2025 GameVault",
    footerSubmit: "أضف لعبة",
    footerFeatured: "المميزة",
    navGames: "الألعاب",
    navFeatured: "المميزة",
    navSubmit: "🎮 أضف لعبتك",
    noResults: "لا توجد نتائج",
    noResultsSub: "جرّب كلمة بحث مختلفة أو تصنيفاً آخر",
    results: (n) => `${n} لعبة`,
    page: "صفحة",
    of: "من",
    copied: "تم نسخ الرابط!",
    adblockTitle: "رجاءاً دعمنا!",
    adblockMsg: "يبدو أنك تستخدم مانع الإعلانات. موقعنا مجاني تماماً ويعتمد على الإعلانات للاستمرار.",
  },
  en: {
    searchPlaceholder: "Search for a game...",
    heroEyebrow: "The #1 Arabic Game Library",
    heroTitle: "Discover",
    heroGradient: "The Best Games",
    heroSub: "Browse, discover and download the best PC games all in one place",
    heroBtnText: "Browse Games",
    heroBtnText2: "Submit a Game",
    statGamesLabel: "Games",
    statGenresLabel: "Genres",
    statFreeLabel: "Free Access",
    featuredTag: "Featured",
    featuredTitle: "Featured Games",
    allGamesTag: "Library",
    allGamesTitle: "All Games",
    filterAll: "All",
    sortDefault: "Default Order",
    sortRating: "Highest Rated",
    sortNewest: "Newest",
    sortOldest: "Oldest",
    sortAlpha: "A-Z",
    dlBtnText: "Download Game",
    shareBtnText: "Share",
    footerDesc: "The #1 Arabic Game Library — Free for Everyone",
    footerText: "All rights reserved © 2025 GameVault",
    footerSubmit: "Submit Game",
    footerFeatured: "Featured",
    navGames: "Games",
    navFeatured: "Featured",
    navSubmit: "🎮 Submit Game",
    noResults: "No results found",
    noResultsSub: "Try a different search term or genre",
    results: (n) => `${n} game${n !== 1 ? 's' : ''}`,
    page: "Page",
    of: "of",
    copied: "Link copied!",
    adblockTitle: "Please support us!",
    adblockMsg: "You seem to be using an ad blocker. Our site is free and relies on ads to continue.",
  }
};

// ===== STATE =====
let lang = 'ar';
let games = [];
let filteredGames = [];
let activeGenre = 'all';
let searchQuery = '';
let currentPage = 1;
let sortMode = 'default';
let currentGameId = null;
let theme = 'dark';

// ===== UTILS =====
function getTitle(g) { return lang === 'ar' ? g.title_ar : g.title_en; }
function getDesc(g) { return lang === 'ar' ? g.description_ar : g.description_en; }
function getGenre(g) { return lang === 'ar' ? g.genre_ar : g.genre_en; }
function getTags(g) { return lang === 'ar' ? (g.tags_ar || []) : (g.tags_en || []); }
function stars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}
function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
function showToast(msg, ms = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}
function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ===== ADBLOCK DETECTION =====
function detectAdblock() {
  const bait = document.getElementById('adblock-bait');
  // Check if bait element is hidden/removed (adblock signature)
  const el = document.createElement('div');
  el.setAttribute('class', 'adsbygoogle pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text adSense adBlock adContent adBanner');
  el.style.cssText = 'width:1px!important;height:1px!important;position:absolute!important;left:-10000px!important;top:-1000px!important;';
  document.body.appendChild(el);
  
  requestAnimationFrame(() => {
    const blocked = !el || el.offsetParent === null || el.offsetHeight === 0 || el.offsetWidth === 0 || window.getComputedStyle(el).display === 'none';
    el.remove();
    
    const skipped = sessionStorage.getItem('gv_adblock_skip');
    if (blocked && !skipped) {
      document.getElementById('adblockOverlay').classList.add('show');
    }
  });
}

function checkAdblock() {
  // Re-test
  const el = document.createElement('div');
  el.setAttribute('class', 'adsbygoogle');
  el.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;';
  document.body.appendChild(el);
  setTimeout(() => {
    const blocked = el.offsetHeight === 0;
    el.remove();
    if (!blocked) {
      document.getElementById('adblockOverlay').classList.remove('show');
      showToast('✅ شكراً لدعمك!');
    } else {
      showToast('⚠️ مانع الإعلانات لا يزال مفعّلاً', 3000);
    }
  }, 300);
}

function skipAdblock() {
  sessionStorage.setItem('gv_adblock_skip', '1');
  document.getElementById('adblockOverlay').classList.remove('show');
}

// ===== THEME =====
function loadTheme() {
  theme = localStorage.getItem('gv_theme') || 'dark';
  applyTheme(theme);
}
function applyTheme(t) {
  theme = t;
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeToggle').textContent = t === 'dark' ? '☀' : '🌙';
  localStorage.setItem('gv_theme', t);
}
document.getElementById('themeToggle').addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));

// ===== LANGUAGE =====
function detectLang() {
  const saved = localStorage.getItem('gv_lang');
  if (saved) return saved;
  const browser = navigator.language || navigator.userLanguage || '';
  return browser.startsWith('ar') ? 'ar' : 'en';
}

function applyLang(l) {
  lang = l;
  localStorage.setItem('gv_lang', l);
  const html = document.documentElement;
  html.setAttribute('lang', l);
  html.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
  html.setAttribute('data-lang', l);
  const t = T[l];
  safeText('langLabel', l === 'ar' ? 'EN' : 'عر');
  safeText('mlangLabel', l === 'ar' ? 'EN' : 'عر');
  safeAttr('searchInput', 'placeholder', t.searchPlaceholder);
  safeText('heroEyebrow', t.heroEyebrow);
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) heroTitle.innerHTML = t.heroTitle + '<br/><span class="gradient-text" id="heroGradient">' + t.heroGradient + '</span>';
  safeText('heroSub', t.heroSub);
  safeText('heroBtnText', t.heroBtnText);
  safeText('heroBtnText2', t.heroBtnText2);
  safeText('statGamesLabel', t.statGamesLabel);
  safeText('statGenresLabel', t.statGenresLabel);
  safeText('statFreeLabel', t.statFreeLabel);
  safeText('featuredTag', t.featuredTag);
  safeText('featuredTitle', t.featuredTitle);
  safeText('allGamesTag', t.allGamesTag);
  safeText('allGamesTitle', t.allGamesTitle);
  safeText('footerDesc', t.footerDesc);
  safeText('footerText', t.footerText);
  safeText('footerSubmit', t.footerSubmit);
  safeText('footerFeatured', t.footerFeatured);
  safeText('navGames', t.navGames);
  safeText('navFeatured', t.navFeatured);
  safeText('navSubmit', t.navSubmit);
  safeText('mnavGames', t.navGames);
  safeText('mnavFeatured', t.navFeatured);
  safeText('mnavSubmit', t.navSubmit);
  safeText('dlBtnText', t.dlBtnText);
  safeText('shareBtnText', t.shareBtnText);
  safeText('sortDefault', t.sortDefault);
  safeText('sortRating', t.sortRating);
  safeText('sortNewest', t.sortNewest);
  safeText('sortOldest', t.sortOldest);
  safeText('sortAlpha', t.sortAlpha);
  buildFilterButtons();
  renderAll();
}

function safeText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function safeAttr(id, attr, val) { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); }
function toggleLang() { applyLang(lang === 'ar' ? 'en' : 'ar'); }
document.getElementById('langToggle').addEventListener('click', toggleLang);

// ===== LOAD GAMES =====
async function loadGames() {
  try {
    const resp = await fetch('../data/games.json');
    games = await resp.json();
  } catch {
    try {
      const resp = await fetch('data/games.json');
      games = await resp.json();
    } catch { games = []; }
  }

  // Animate counters
  animateCount(document.getElementById('statGames'), games.length);
  const genres = [...new Set(games.map(g => g.genre_en).filter(Boolean))];
  animateCount(document.getElementById('statGenres'), genres.length);

  buildFilterButtons();
  processGames();
  renderAll();

  // Check URL for shared game
  const params = new URLSearchParams(window.location.search);
  if (params.get('game')) {
    const id = parseInt(params.get('game'));
    const g = games.find(x => x.id === id);
    if (g) setTimeout(() => openModal(id), 600);
  }
}

function animateCount(el, target) {
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

// ===== BUILD FILTER BUTTONS =====
function buildFilterButtons() {
  const genres = [...new Set(games.map(g => g.genre_en).filter(Boolean))].sort();
  const t = T[lang];
  const container = document.getElementById('filterScroll');
  if (!container) return;

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn' + (activeGenre === 'all' ? ' active' : '');
  allBtn.textContent = t.filterAll;
  allBtn.dataset.genre = 'all';
  allBtn.addEventListener('click', () => setGenre('all'));
  container.innerHTML = '';
  container.appendChild(allBtn);

  genres.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (activeGenre === g ? ' active' : '');
    btn.textContent = lang === 'ar' ? (games.find(x => x.genre_en === g)?.genre_ar || g) : g;
    btn.dataset.genre = g;
    btn.addEventListener('click', () => setGenre(g));
    container.appendChild(btn);
  });
}

function setGenre(genre) {
  activeGenre = genre;
  currentPage = 1;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.genre === genre);
  });
  processGames();
  renderGames();
}

// ===== PROCESS + SORT =====
function processGames() {
  let result = [...games];

  // Filter by genre
  if (activeGenre !== 'all') result = result.filter(g => g.genre_en === activeGenre);

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(g =>
      getTitle(g).toLowerCase().includes(q) ||
      getDesc(g).toLowerCase().includes(q) ||
      (g.developer || '').toLowerCase().includes(q) ||
      (g.genre_en || '').toLowerCase().includes(q) ||
      (getTags(g) || []).some(tag => tag.toLowerCase().includes(q))
    );
  }

  // Sort
  switch (sortMode) {
    case 'rating-desc': result.sort((a, b) => b.rating - a.rating); break;
    case 'year-desc': result.sort((a, b) => b.year - a.year); break;
    case 'year-asc': result.sort((a, b) => a.year - b.year); break;
    case 'alpha-asc': result.sort((a, b) => getTitle(a).localeCompare(getTitle(b))); break;
  }

  filteredGames = result;
}

// ===== RENDER ALL =====
function renderAll() {
  renderFeatured();
  processGames();
  renderGames();
}

// ===== FEATURED =====
function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = games.filter(g => g.featured).slice(0, 6);
  grid.innerHTML = featured.map(g => `
    <div class="featured-card" onclick="openModal(${g.id})">
      <img class="card-cover" src="${sanitize(g.cover)}" alt="${sanitize(getTitle(g))}" loading="lazy" onerror="this.src='https://placehold.co/400x225/1a1a26/6c63ff?text=Game'"/>
      <div class="featured-overlay"></div>
      <div class="featured-info">
        <span class="featured-genre">${sanitize(getGenre(g))}</span>
        <div class="featured-title">${sanitize(getTitle(g))}</div>
        <div class="featured-rating">★ ${g.rating}</div>
      </div>
    </div>
  `).join('');
}

// ===== GAMES GRID =====
function renderGames() {
  const grid = document.getElementById('gamesGrid');
  if (!grid) return;
  const t = T[lang];

  // Results info
  const info = document.getElementById('resultsInfo');
  if (info) info.textContent = t.results(filteredGames.length);

  if (filteredGames.length === 0) {
    grid.innerHTML = `<div class="no-results"><span class="nr-icon">🎮</span><div>${t.noResults}</div><small>${t.noResultsSub}</small></div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  // Pagination slice
  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * GAMES_PER_PAGE;
  const pageGames = filteredGames.slice(start, start + GAMES_PER_PAGE);

  grid.innerHTML = pageGames.map(g => `
    <div class="game-card" onclick="openModal(${g.id})">
      <div class="game-card-cover-wrap">
        <img class="game-card-cover" src="${sanitize(g.cover)}" alt="${sanitize(getTitle(g))}" loading="lazy" onerror="this.src='https://placehold.co/400x225/1a1a26/6c63ff?text=Game'"/>
        ${g.featured ? `<span class="game-card-badge">★</span>` : ''}
      </div>
      <div class="game-card-body">
        <div class="game-card-top">
          ${g.logo ? `<img class="game-card-logo" src="${sanitize(g.logo)}" alt="" onerror="this.style.display='none'"/>` : ''}
          <div>
            <div class="game-card-name">${sanitize(getTitle(g))}</div>
            <div class="game-card-dev">${sanitize(g.developer || '')} ${g.year ? '· ' + g.year : ''}</div>
          </div>
        </div>
        <div class="game-card-desc">${sanitize(getDesc(g))}</div>
        <div class="game-card-footer">
          <div class="game-tags">${getTags(g).slice(0,2).map(tag => `<span class="game-tag">${sanitize(tag)}</span>`).join('')}</div>
          <span class="game-rating">★ ${g.rating}</span>
        </div>
        <button class="game-card-dl" onclick="event.stopPropagation(); openGame('${sanitize(g.download_url)}')">
          ↓ ${t.dlBtnText}
        </button>
      </div>
    </div>
  `).join('');

  renderPagination(totalPages);

  // Scroll to games section top if page changed
}

function openGame(url) {
  if (url && url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
}

// ===== PAGINATION =====
function renderPagination(totalPages) {
  const pag = document.getElementById('pagination');
  if (!pag) return;
  if (totalPages <= 1) { pag.innerHTML = ''; return; }

  const t = T[lang];
  let html = '';

  html += `<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

  // Smart page numbers
  let pages = [];
  if (totalPages <= 7) {
    pages = Array.from({length: totalPages}, (_, i) => i + 1);
  } else {
    pages = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  pages.forEach(p => {
    if (p === '...') {
      html += `<span class="page-btn" style="pointer-events:none">…</span>`;
    } else {
      html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
    }
  });

  html += `<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
  pag.innerHTML = html;
}

function goPage(n) {
  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  if (n < 1 || n > totalPages) return;
  currentPage = n;
  renderGames();
  document.getElementById('gamesSection').scrollIntoView({behavior: 'smooth'});
}

// ===== MODAL =====
function openModal(id) {
  const g = games.find(x => x.id === id);
  if (!g) return;
  currentGameId = id;

  const cover = document.getElementById('modalCover');
  const logo = document.getElementById('modalLogo');
  cover.src = g.cover || '';
  cover.onerror = () => { cover.src = 'https://placehold.co/680x382/1a1a26/6c63ff?text=Game'; };
  logo.src = g.logo || '';

  safeText('modalTitle', getTitle(g));
  safeText('modalDev', g.developer || '');
  safeText('modalYear', g.year || '');
  safeText('modalGenre', getGenre(g));
  safeText('modalRating', g.rating);
  safeText('modalStars', stars(g.rating));
  safeText('modalDesc', getDesc(g));
  safeText('dlBtnText', T[lang].dlBtnText);
  safeText('shareBtnText', T[lang].shareBtnText);

  const dl = document.getElementById('modalDownload');
  dl.href = g.download_url || '#';

  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = getTags(g).map(tag => `<span class="modal-tag">${sanitize(tag)}</span>`).join('');

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Update URL
  history.pushState({}, '', `?game=${id}`);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
  currentGameId = null;
  history.pushState({}, '', window.location.pathname);
}

function shareGame() {
  const url = window.location.href.split('?')[0] + '?game=' + currentGameId;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast(T[lang].copied));
  } else {
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast(T[lang].copied);
  }
}

// ===== SEARCH ===== 
const debouncedSearch = debounce((q) => {
  searchQuery = q;
  currentPage = 1;
  processGames();
  renderGames();
  renderSuggestions(q);
}, DEBOUNCE_MS);

function renderSuggestions(q) {
  const box = document.getElementById('searchSuggestions');
  if (!box) return;
  if (!q || q.length < 2) { box.classList.remove('show'); return; }

  const matches = games.filter(g =>
    getTitle(g).toLowerCase().includes(q.toLowerCase())
  ).slice(0, 5);

  if (matches.length === 0) { box.classList.remove('show'); return; }

  box.innerHTML = matches.map(g => `
    <div class="suggestion-item" onclick="openModal(${g.id}); document.getElementById('searchSuggestions').classList.remove('show');">
      <img class="suggestion-img" src="${sanitize(g.cover)}" alt="" onerror="this.src='https://placehold.co/48x27/1a1a26/6c63ff?text=?'"/>
      <div class="suggestion-info">
        <div class="s-title">${sanitize(getTitle(g))}</div>
        <div class="s-genre">${sanitize(getGenre(g))} · ${g.year}</div>
      </div>
    </div>
  `).join('');
  box.classList.add('show');
}

document.getElementById('searchInput').addEventListener('input', e => debouncedSearch(e.target.value));
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    document.getElementById('searchSuggestions')?.classList.remove('show');
  }
});

// ===== SORT =====
document.getElementById('sortSelect').addEventListener('change', e => {
  sortMode = e.target.value;
  currentPage = 1;
  processGames();
  renderGames();
});

// ===== MODAL EVENTS =====
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  const btt = document.getElementById('backToTop');
  if (window.scrollY > 60) { nav?.classList.add('scrolled'); btt?.classList.add('show'); }
  else { nav?.classList.remove('scrolled'); btt?.classList.remove('show'); }
});

// ===== HAMBURGER =====
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('open');
});
function closeMobileMenu() { document.getElementById('mobileMenu').classList.remove('open'); }

// ===== PARTICLES =====
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function makeParticle() {
    return { x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.3, vx: (Math.random()-0.5)*0.25, vy: (Math.random()-0.5)*0.25, a: Math.random()*0.5+0.1 };
  }
  function init() { resize(); particles = Array.from({length: 100}, makeParticle); }
  function draw() {
    ctx.clearRect(0,0,W,H);
    for (const p of particles) {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(108,99,255,${p.a})`; ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x<0) p.x=W; if (p.x>W) p.x=0; if (p.y<0) p.y=H; if (p.y>H) p.y=0;
    }
    requestAnimationFrame(draw);
  }
  init(); draw();
  window.addEventListener('resize', init);
}

// ===== INIT =====
loadTheme();
lang = detectLang();
document.documentElement.setAttribute('lang', lang);
document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
document.documentElement.setAttribute('data-lang', lang);
initParticles();
loadGames().then(() => applyLang(lang));
setTimeout(detectAdblock, 2000);
