import { subscribeSession, signOut, refreshSession } from './session.js';
import { fetchIdentity } from './identity.js';
import { runGlobalSearch, renderSearchResults } from './modules/search.js';

/**
 * Session-aware Zenit header: dark nav, Feather icons, expandable search,
 * account without ADMIN/plan badge text.
 */

const MEMBRESIA_HREF = 'pricing-three-white.html';
const HEADER_AUTH_KEY = 'ni_header_auth_v1';
const THEME_KEY = 'ni_theme_mode';
const NI_LOGO = 'assets/images/logo/ni-logo.png';

/** Icons for standard Home / Blog / Nosotros / Contact links. */
const ICON_BY_HREF = {
  'index.html': 'feather-home',
  'anuncios.html': 'feather-bell',
  'talleres.html': 'feather-video',
  'recursos.html': 'feather-book-open',
  'match.html': 'feather-users',
  'about-white.html': 'feather-info',
  'contact-white.html': 'feather-mail',
  'pricing-three-white.html': 'feather-star',
  'perfil.html': 'feather-user',
  'login.html': 'feather-log-in',
  'register.html': 'feather-user-plus',
  'admin.html': 'feather-settings',
};

const SEARCH_CHIPS = ['Incoterms 2024', 'Certificados', 'Empleabilidad', 'Logística', 'NI Elite'];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortName(name) {
  const t = String(name || 'Cuenta').trim();
  if (t.length <= 10) return t;
  return `${t.slice(0, 7)}…`;
}

/** Same site nav on every page (Home / Blog / Nosotros / Contact / Membresia). */
const DESKTOP_NAV_HTML = `
  <li><a href="index.html">Home</a></li>
  <li class="has-droupdown has-menu-child-item"><a href="#">Blog</a>
    <ul class="submenu">
      <li><a href="anuncios.html">Anuncios</a></li>
      <li><a href="talleres.html">Talleres</a></li>
      <li><a href="recursos.html">Recursos</a></li>
      <li><a href="match.html">Match</a></li>
    </ul>
  </li>
  <li><a href="about-white.html">Nosotros</a></li>
  <li><a href="contact-white.html">Contact</a></li>
  <li><a href="pricing-three-white.html">Membresia</a></li>
`;

const MOBILE_NAV_HTML = `
  <li><a href="index.html">Home</a></li>
  <li class="has-droupdown has-menu-child-item"><a href="#">Blog</a>
    <ul class="submenu">
      <li><a href="anuncios.html">Anuncios</a></li>
      <li><a href="talleres.html">Talleres</a></li>
      <li><a href="recursos.html">Recursos</a></li>
      <li><a href="match.html">Match</a></li>
    </ul>
  </li>
  <li><a href="about-white.html">Nosotros</a></li>
  <li><a href="contact-white.html">Contact</a></li>
  <li><a href="pricing-three-white.html">Membresia</a></li>
`;

function applyStandardNav(root, html) {
  if (!root || root.dataset.niStandardNav === '1') return root;
  root.innerHTML = html;
  root.dataset.niStandardNav = '1';
  decorateNavIcons(root);
  return root;
}

function iconForLink(anchor) {
  const hrefRaw = (anchor.getAttribute('href') || '').trim();
  const href = hrefRaw.split('#')[0].split('?')[0].split('/').pop().toLowerCase();
  if (href && ICON_BY_HREF[href]) return ICON_BY_HREF[href];
  const label = (anchor.textContent || '').trim().toLowerCase();
  if (label === 'home' || label === 'inicio') return 'feather-home';
  if (label === 'blog') return 'feather-grid';
  if (label.includes('nosotros')) return 'feather-users';
  if (label.includes('contact')) return 'feather-mail';
  if (label.includes('membres')) return 'feather-star';
  if (label.includes('anuncio')) return 'feather-bell';
  if (label.includes('taller')) return 'feather-video';
  if (label.includes('recurso')) return 'feather-book-open';
  if (label.includes('match')) return 'feather-users';
  return 'feather-circle';
}

/** Keep existing LI/submenu tree; only prepend Feather icons once. */
function decorateNavIcons(root) {
  if (!root) return;
  root.querySelectorAll('a').forEach((anchor) => {
    if (anchor.querySelector('i[class*="feather"]')) return;
    const text = (anchor.textContent || '').trim();
    if (!text) return;
    const icon = document.createElement('i');
    icon.className = iconForLink(anchor);
    icon.setAttribute('aria-hidden', 'true');
    anchor.textContent = '';
    anchor.appendChild(icon);
    const span = document.createElement('span');
    span.textContent = text;
    anchor.appendChild(span);
  });
  root.classList.add('ni-zenit-nav');
}

function readHeaderAuthCache() {
  try {
    const raw = sessionStorage.getItem(HEADER_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.userId || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeHeaderAuthCache(payload) {
  try {
    if (!payload) sessionStorage.removeItem(HEADER_AUTH_KEY);
    else sessionStorage.setItem(HEADER_AUTH_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function persistHeaderAuth(user, identity) {
  if (!user?.id) {
    writeHeaderAuthCache(null);
    return null;
  }
  const payload = {
    userId: user.id,
    name: user?.profile?.name || user?.name || user?.email || 'Cuenta',
    plan: identity?.membership?.plan || 'ni_free',
    role: identity?.role || 'user',
  };
  writeHeaderAuthCache(payload);
  return payload;
}

function ensureStyles() {
  if (!document.getElementById('ni-header-css')) {
    const link = document.createElement('link');
    link.id = 'ni-header-css';
    link.rel = 'stylesheet';
    link.href = `${new URL('../../css/ni-header.css', import.meta.url).href}?v=5.1.4`;
    document.head.appendChild(link);
  }
  if (!document.getElementById('ni-brand-css')) {
    const brand = document.createElement('link');
    brand.id = 'ni-brand-css';
    brand.rel = 'stylesheet';
    brand.href = `${new URL('../../css/ni-brand.css', import.meta.url).href}?v=1.0.1`;
    document.head.appendChild(brand);
  }
  if (!document.getElementById('ni-theme-dark-css')) {
    const theme = document.createElement('link');
    theme.id = 'ni-theme-dark-css';
    theme.rel = 'stylesheet';
    theme.href = `${new URL('../../css/ni-theme-dark.css', import.meta.url).href}?v=1.0.3`;
    document.head.appendChild(theme);
  }
  document.documentElement.classList.add('ni-header-compact', 'ni-zenit');
  document.body.classList.add('ni-header-compact', 'ni-zenit');
  applyTheme(readStoredTheme(), { persist: false });
}

export function readStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    /* ignore */
  }
  if (document.body.classList.contains('active-dark-mode')) return 'dark';
  return 'light';
}

export function applyTheme(mode, { persist = true } = {}) {
  const next = mode === 'dark' ? 'dark' : 'light';
  document.body.classList.remove('active-dark-mode', 'active-light-mode');
  document.body.classList.add(next === 'dark' ? 'active-dark-mode' : 'active-light-mode');
  document.documentElement.dataset.niTheme = next;
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  }
  paintThemeToggle(next);
}

function paintThemeToggle(mode) {
  const btn = document.querySelector('[data-ni-theme-toggle]');
  if (!btn) return;
  const dark = mode === 'dark';
  btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  btn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  btn.title = dark ? 'Modo claro' : 'Modo oscuro';
  btn.innerHTML = dark
    ? '<i class="feather-sun" aria-hidden="true"></i>'
    : '<i class="feather-moon" aria-hidden="true"></i>';
  try {
    window.feather?.replace?.();
  } catch {
    /* ignore */
  }
}

function bindThemeToggle() {
  if (document.documentElement.dataset.niThemeBound === '1') return;
  document.documentElement.dataset.niThemeBound = '1';
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ni-theme-toggle]');
    if (!btn) return;
    e.preventDefault();
    const current = document.body.classList.contains('active-dark-mode') ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function clearLegacyHeaderSlots() {
  document.querySelectorAll('[data-ni-auth-slot]').forEach((el) => el.remove());
}

function ensureHamburger() {
  const headerRight = document.querySelector('.tmp-header .header-right');
  if (!headerRight || headerRight.querySelector('.mobile-menu-bar')) return;

  const wrap = document.createElement('div');
  wrap.className = 'mobile-menu-bar ml--5 d-block d-lg-none';
  wrap.innerHTML = `
    <div class="hamberger">
      <button class="hamberger-button" type="button" aria-label="Abrir menú">
        <i class="feather-menu"></i>
      </button>
    </div>
  `;
  headerRight.appendChild(wrap);
}

function enhanceZenitChrome() {
  const header = document.querySelector('.tmp-header');
  if (!header || header.dataset.niZenit === '1') return header;
  header.dataset.niZenit = '1';
  header.classList.add('ni-zenit-header');

  const logoWrap = header.querySelector('.logo');
  if (logoWrap && !logoWrap.querySelector('.ni-zenit-brand')) {
    logoWrap.innerHTML = `
      <a class="ni-zenit-brand" href="index.html">
        <span class="ni-zenit-brand-mark" aria-hidden="true">
          <img src="${NI_LOGO}" alt="">
        </span>
        <span class="ni-zenit-brand-text">
          <strong>Zenit</strong>
          <span>por Grupo NI</span>
        </span>
      </a>`;
  }

  // Same menu on every page: Home / Blog / Nosotros / Contact
  applyStandardNav(header.querySelector('.mainmenu-nav > .mainmenu'), DESKTOP_NAV_HTML);

  const headerRight = header.querySelector('.header-right');
  if (headerRight && !headerRight.querySelector('[data-ni-zenit-actions]')) {
    const btnBox = headerRight.querySelector('.header-btn');
    if (btnBox) btnBox.hidden = true;

    const actions = document.createElement('div');
    actions.className = 'ni-zenit-actions';
    actions.setAttribute('data-ni-zenit-actions', '1');
    actions.innerHTML = `
      <button type="button" class="ni-zenit-search-toggle" data-ni-search-open aria-expanded="false" aria-label="Buscar">
        <i class="feather-search" aria-hidden="true"></i>
        <span class="ni-zenit-search-label">Buscar</span>
      </button>
      <button type="button" class="ni-zenit-theme-toggle" data-ni-theme-toggle aria-pressed="false" aria-label="Cambiar tema" title="Modo oscuro">
        <i class="feather-moon" aria-hidden="true"></i>
      </button>
      <div class="ni-zenit-account" data-ni-zenit-account></div>
    `;
    const hamburger = headerRight.querySelector('.mobile-menu-bar');
    if (hamburger) headerRight.insertBefore(actions, hamburger);
    else headerRight.appendChild(actions);
  }
  paintThemeToggle(readStoredTheme());

  ensureSearchPanel(header);
  bindHeaderSurface();
  try {
    window.feather?.replace?.();
  } catch {
    /* ignore */
  }
  return header;
}

const HERO_SELECTORS = [
  '.event-banner-area-start',
  '.about-banner-area',
  '.banner-area-start',
  '.slider-area',
  '.tmp-banner-one',
].join(',');

function getHeroBottom() {
  const hero = document.querySelector(HERO_SELECTORS);
  if (!hero) return null;
  const rect = hero.getBoundingClientRect();
  return window.scrollY + rect.top + hero.offsetHeight;
}

function syncHeaderSurface() {
  const header = document.querySelector('.tmp-header.ni-zenit-header');
  if (!header) return;
  const heroBottom = getHeroBottom();
  // No dark main/hero → always bluish glass over light pages
  const overLight =
    heroBottom == null || window.scrollY + header.offsetHeight >= heroBottom - 40;
  header.classList.toggle('ni-zenit-over-light', overLight);
}

function bindHeaderSurface() {
  if (document.documentElement.dataset.niSurfaceBound === '1') {
    syncHeaderSurface();
    return;
  }
  document.documentElement.dataset.niSurfaceBound = '1';
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      syncHeaderSurface();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  syncHeaderSurface();
}

function ensureSearchPanel(header) {
  if (document.querySelector('[data-ni-search-panel]')) return;
  const panel = document.createElement('div');
  panel.className = 'ni-zenit-search-panel';
  panel.setAttribute('data-ni-search-panel', '1');
  panel.hidden = true;
  panel.innerHTML = `
    <div class="ni-zenit-search-inner">
      <div class="ni-zenit-search-row">
        <label class="ni-zenit-search-field">
          <i class="feather-search" aria-hidden="true"></i>
          <input type="search" data-ni-search-input placeholder="Buscar talleres, recursos, anuncios, estudiantes…" autocomplete="off">
        </label>
        <button type="button" class="ni-zenit-search-submit" data-ni-search-submit>Buscar</button>
        <button type="button" class="ni-zenit-search-close" data-ni-search-close aria-label="Cerrar búsqueda">
          <i class="feather-x" aria-hidden="true"></i>
        </button>
      </div>
      <div class="ni-zenit-search-chips" data-ni-search-chips>
        ${SEARCH_CHIPS.map(
          (c) => `<button type="button" class="ni-zenit-chip" data-ni-search-chip="${escapeHtml(c)}">${escapeHtml(c)}</button>`,
        ).join('')}
      </div>
      <div class="ni-zenit-search-results" data-ni-search-results hidden></div>
    </div>
  `;
  header.appendChild(panel);
}

function setSearchOpen(open) {
  const panel = document.querySelector('[data-ni-search-panel]');
  const toggle = document.querySelector('[data-ni-search-open]');
  if (!panel) return;
  panel.hidden = !open;
  document.body.classList.toggle('ni-search-open', open);
  if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    const input = panel.querySelector('[data-ni-search-input]');
    input?.focus();
    try {
      window.feather?.replace?.();
    } catch {
      /* ignore */
    }
  }
}

function isSearchOpen() {
  const panel = document.querySelector('[data-ni-search-panel]');
  return Boolean(panel && !panel.hidden);
}

function bindSearchUi() {
  if (document.documentElement.dataset.niSearchBound === '1') return;
  document.documentElement.dataset.niSearchBound = '1';

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-ni-search-open]')) {
      e.preventDefault();
      setSearchOpen(!isSearchOpen());
      return;
    }
    if (e.target.closest('[data-ni-search-close]')) {
      e.preventDefault();
      setSearchOpen(false);
      return;
    }
    const chip = e.target.closest('[data-ni-search-chip]');
    if (chip) {
      const input = document.querySelector('[data-ni-search-input]');
      if (input) {
        input.value = chip.getAttribute('data-ni-search-chip') || '';
        runSearchFromUi();
      }
      return;
    }
    if (e.target.closest('[data-ni-search-submit]')) {
      e.preventDefault();
      runSearchFromUi();
      return;
    }
    if (isSearchOpen() && !e.target.closest('[data-ni-search-panel]')) {
      setSearchOpen(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setSearchOpen(false);
    if (e.key === 'Enter' && e.target.matches?.('[data-ni-search-input]')) {
      e.preventDefault();
      runSearchFromUi();
    }
  });
}

async function runSearchFromUi() {
  const input = document.querySelector('[data-ni-search-input]');
  const results = document.querySelector('[data-ni-search-results]');
  if (!input || !results) return;
  const q = input.value.trim();
  if (q.length < 2) {
    results.hidden = false;
    results.innerHTML = '<p class="ni-zenit-search-empty">Escribe al menos 2 caracteres.</p>';
    return;
  }
  results.hidden = false;
  results.innerHTML = '<p class="ni-zenit-search-empty">Buscando…</p>';
  const payload = await runGlobalSearch(q);
  renderSearchResults(results, payload);
}

function ensurePopup() {
  let popup = document.querySelector('.popup-mobile-menu');
  if (!popup) {
    popup = document.createElement('div');
    popup.className = 'popup-mobile-menu';
    popup.innerHTML = `
      <div class="inner">
        <div class="header-top">
          <div class="logo">
            <a class="ni-zenit-brand" href="index.html">
              <span class="ni-zenit-brand-mark"><img src="${NI_LOGO}" alt=""></span>
              <span class="ni-zenit-brand-text"><strong>Zenit</strong><span>por Grupo NI</span></span>
            </a>
          </div>
          <div class="close-menu">
            <button class="close-button" type="button" aria-label="Cerrar menú">
              <i class="feather-x"></i>
            </button>
          </div>
        </div>
        <ul class="mainmenu">
          ${MOBILE_NAV_HTML}
        </ul>
      </div>
    `;
    const header = document.querySelector('.tmp-header');
    if (header?.parentElement) header.after(popup);
    else document.body.prepend(popup);
  }

  const logo = popup.querySelector('.header-top .logo');
  if (logo && !logo.querySelector('.ni-zenit-brand')) {
    logo.innerHTML = `
      <a class="ni-zenit-brand" href="index.html">
        <span class="ni-zenit-brand-mark"><img src="${NI_LOGO}" alt=""></span>
        <span class="ni-zenit-brand-text"><strong>Zenit</strong><span>por Grupo NI</span></span>
      </a>`;
  }

  const popupNav = popup.querySelector('.inner > .mainmenu:not([data-ni-auth-menu])');
  applyStandardNav(popupNav, MOBILE_NAV_HTML);
  popupNav?.classList.add('ni-zenit-popup-nav');

  const inner = popup.querySelector('.inner');
  if (!inner) return null;

  let menu = inner.querySelector('[data-ni-auth-menu]');
  if (!menu) {
    menu = document.createElement('ul');
    menu.className = 'mainmenu ni-auth-menu';
    menu.setAttribute('data-ni-auth-menu', '1');
    inner.appendChild(menu);
  }
  return menu;
}

function bindMenuChrome() {
  document.querySelectorAll('.hamberger-button').forEach((btn) => {
    if (btn.dataset.niBound) return;
    btn.dataset.niBound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('.popup-mobile-menu')?.classList.add('active');
    });
  });

  document.querySelectorAll('.popup-mobile-menu .close-button').forEach((btn) => {
    if (btn.dataset.niBound) return;
    btn.dataset.niBound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closePopup();
    });
  });

  bindPopupSubmenus();
}

function bindPopupSubmenus() {
  if (document.documentElement.dataset.niPopupSubBound === '1') return;
  document.documentElement.dataset.niPopupSubBound = '1';

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(
      '.popup-mobile-menu .mainmenu .has-droupdown > a, .popup-mobile-menu .mainmenu .has-menu-child-item > a',
    );
    if (!trigger) return;

    const href = (trigger.getAttribute('href') || '').trim();
    if (href && href !== '#') return;

    e.preventDefault();
    e.stopPropagation();

    const submenu = trigger.nextElementSibling;
    if (!submenu?.classList?.contains('submenu') && !submenu?.classList?.contains('tmp-megamenu')) {
      return;
    }

    const willOpen = !trigger.classList.contains('open');
    const menu = trigger.closest('.mainmenu');
    menu?.querySelectorAll(':scope > .has-droupdown > a.open, :scope > .has-menu-child-item > a.open').forEach((a) => {
      if (a === trigger) return;
      a.classList.remove('open');
      a.nextElementSibling?.classList.remove('active');
    });

    trigger.classList.toggle('open', willOpen);
    submenu.classList.toggle('active', willOpen);
  });
}

function closePopup() {
  const popup = document.querySelector('.popup-mobile-menu');
  popup?.classList.remove('active');
  popup?.querySelectorAll('.mainmenu .has-droupdown > a.open, .mainmenu .has-menu-child-item > a.open').forEach((a) => {
    a.classList.remove('open');
    a.nextElementSibling?.classList.remove('active');
  });
}

function popupHasMembresia() {
  const nav = document.querySelector('.popup-mobile-menu .inner > .mainmenu:not([data-ni-auth-menu])');
  return Boolean(nav?.querySelector(`a[href="${MEMBRESIA_HREF}"]`));
}

function membresiaItemHtml() {
  if (popupHasMembresia()) return '';
  return `<li><a href="${MEMBRESIA_HREF}">Membresías</a></li>`;
}

/** Mobile popup account items — name only, no ADMIN/plan badge text. */
function accountItemsHtml(user, identity, { includeMembresia }) {
  const membership = includeMembresia ? membresiaItemHtml() : '';
  if (!user) {
    return `
      ${membership}
      <li><a href="login.html" data-ni-login>Ingresar</a></li>
      <li><a href="register.html">Crear cuenta</a></li>
    `;
  }
  const name = user?.profile?.name || user?.name || user?.email || 'Cuenta';
  const adminItem =
    identity?.role === 'admin' ? `<li><a href="admin.html" data-ni-admin>Admin</a></li>` : '';
  return `
    ${membership}
    ${adminItem}
    <li><a href="perfil.html" data-ni-profile>${escapeHtml(name)}</a></li>
    <li><a href="#" data-ni-logout>Salir</a></li>
  `;
}

function accountItemsFromCache(cache, { includeMembresia }) {
  if (!cache) return accountItemsHtml(null, null, { includeMembresia });
  return accountItemsHtml(
    { id: cache.userId, profile: { name: cache.name } },
    { role: cache.role, membership: { plan: cache.plan } },
    { includeMembresia },
  );
}

function applyPopupAccountHtml(menu, html) {
  if (!menu) return;
  if (menu.dataset.niAuthFp === html) return;
  menu.dataset.niAuthFp = html;
  menu.innerHTML = html;
}

/** Desktop account slot: icon + short name + logout icon (no plan/admin badge). */
function renderDesktopAccountSlot({ user, identity, cache }) {
  const slot = document.querySelector('[data-ni-zenit-account]');
  if (!slot) return;

  let name = null;
  let isAdmin = false;
  if (cache) {
    name = cache.name;
    isAdmin = cache.role === 'admin';
  } else if (user) {
    name = user?.profile?.name || user?.name || user?.email || 'Cuenta';
    isAdmin = identity?.role === 'admin';
  }

  let html;
  if (!name) {
    html = `
      <a class="ni-zenit-user" href="login.html" data-ni-login>
        <i class="feather-user" aria-hidden="true"></i>
        <span>Ingresar</span>
      </a>`;
  } else {
    const adminLink = isAdmin
      ? `<a class="ni-zenit-admin" href="admin.html" data-ni-admin title="Admin"><i class="feather-settings" aria-hidden="true"></i></a>`
      : '';
    html = `
      ${adminLink}
      <a class="ni-zenit-user" href="perfil.html" data-ni-profile title="${escapeHtml(name)}">
        <i class="feather-user" aria-hidden="true"></i>
        <span>${escapeHtml(shortName(name))}</span>
      </a>
      <a class="ni-zenit-logout" href="#" data-ni-logout title="Salir" aria-label="Salir">
        <i class="feather-log-out" aria-hidden="true"></i>
      </a>`;
  }

  if (slot.dataset.niAuthFp === html) return;
  slot.dataset.niAuthFp = html;
  slot.innerHTML = html;
  try {
    window.feather?.replace?.();
  } catch {
    /* ignore */
  }
}

function paintHeaderAccount({ user = null, identity = null, cache = null } = {}) {
  const menu = document.querySelector('.popup-mobile-menu [data-ni-auth-menu]');
  const html = cache
    ? accountItemsFromCache(cache, { includeMembresia: true })
    : accountItemsHtml(user, identity, { includeMembresia: true });
  applyPopupAccountHtml(menu, html);
  renderDesktopAccountSlot({ user, identity, cache });
}

let logoutBound = false;
function bindLogoutDelegation() {
  if (logoutBound) return;
  logoutBound = true;
  document.addEventListener('click', async (e) => {
    const logout = e.target.closest('[data-ni-logout]');
    if (!logout) return;
    e.preventDefault();
    closePopup();
    writeHeaderAuthCache(null);
    await signOut();
    window.location.href = 'index.html';
  });
}

export function mountHeaderAuth() {
  ensureStyles();
  ensureHamburger();
  enhanceZenitChrome();
  const menu = ensurePopup();
  clearLegacyHeaderSlots();
  bindMenuChrome();
  bindSearchUi();
  bindThemeToggle();
  bindLogoutDelegation();
  if (!menu) return () => {};

  const warm = readHeaderAuthCache();
  if (warm) paintHeaderAccount({ cache: warm });

  let identityCache = warm
    ? { userId: warm.userId, role: warm.role, membership: { plan: warm.plan } }
    : null;

  const unsub = subscribeSession(async (snap) => {
    if (snap.loading) return;

    if (!snap.user) {
      identityCache = null;
      writeHeaderAuthCache(null);
      paintHeaderAccount({ user: null, identity: null });
      return;
    }

    const needIdentity = !identityCache || identityCache.userId !== snap.user.id;
    if (needIdentity) {
      identityCache = { userId: snap.user.id, ...(await fetchIdentity(snap.user.id)) };
    }

    persistHeaderAuth(snap.user, identityCache);
    paintHeaderAccount({ user: snap.user, identity: identityCache });
  });

  refreshSession();
  return unsub;
}
