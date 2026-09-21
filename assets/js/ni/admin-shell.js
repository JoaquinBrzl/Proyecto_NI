import { subscribeSession, signOut } from './session.js';
import { applyTheme, readStoredTheme } from './header.js';

/**
 * Admin-only chrome: drawer, theme toggle, account slot.
 * Does not mount the public Zenit header.
 */

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortName(name) {
  const t = String(name || 'Cuenta').trim();
  if (t.length <= 14) return t;
  return `${t.slice(0, 12)}…`;
}

function initials(name) {
  const parts = String(name || 'A').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function featherRefresh(root = document) {
  try {
    const scope = root || document;
    scope.querySelectorAll('i[class*="feather-"]').forEach((el) => {
      if (el.getAttribute('data-feather')) return;
      const cls = [...el.classList].find((c) => c.startsWith('feather-') && c !== 'feather');
      if (!cls) return;
      el.setAttribute('data-feather', cls.replace(/^feather-/, ''));
    });
    window.feather?.replace?.(root && root !== document ? { root } : undefined);
  } catch {
    /* ignore */
  }
}

function setDrawerOpen(open) {
  document.body.classList.toggle('ni-admin-drawer-open', open);
  const overlay = document.querySelector('[data-ni-admin-overlay]');
  if (overlay) overlay.hidden = !open;
}

const PANEL_TITLES = {
  'ni-admin-section-elite': 'Postulaciones Elite',
  'ni-admin-section-workshops': 'Inscripciones',
  'ni-admin-section-anuncios': 'Anuncios',
  'ni-admin-section-talleres': 'Talleres',
  'ni-admin-section-recursos': 'Recursos',
  'ni-admin-section-intereses': 'Intereses',
};

function showAdminPanel(sectionId) {
  const id = PANEL_TITLES[sectionId] ? sectionId : 'ni-admin-section-elite';
  document.querySelectorAll('[data-ni-admin-panel]').forEach((panel) => {
    panel.classList.toggle('is-visible', panel.id === id);
  });
  document.querySelectorAll('.ni-admin-sidebar__nav .ni-admin-nav-link[href^="#"]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('is-active', href === `#${id}`);
  });
  const titleEl = document.querySelector('.ni-admin-topbar__title');
  if (titleEl) titleEl.textContent = PANEL_TITLES[id] || 'Panel Admin';
  if (window.location.hash !== `#${id}`) {
    history.replaceState(null, '', `#${id}`);
  }
}

function bindPanelNav() {
  document.querySelectorAll('.ni-admin-sidebar__nav a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      const id = href.replace(/^#/, '');
      if (!PANEL_TITLES[id]) return;
      e.preventDefault();
      showAdminPanel(id);
      if (window.matchMedia('(max-width: 991px)').matches) setDrawerOpen(false);
    });
  });

  const fromHash = (window.location.hash || '').replace(/^#/, '');
  showAdminPanel(PANEL_TITLES[fromHash] ? fromHash : 'ni-admin-section-elite');

  window.addEventListener('hashchange', () => {
    const id = (window.location.hash || '').replace(/^#/, '');
    if (PANEL_TITLES[id]) showAdminPanel(id);
  });
}

function bindDrawer() {
  document.querySelector('[data-ni-admin-menu]')?.addEventListener('click', (e) => {
    e.preventDefault();
    setDrawerOpen(true);
  });
  document.querySelector('[data-ni-admin-close]')?.addEventListener('click', (e) => {
    e.preventDefault();
    setDrawerOpen(false);
  });
  document.querySelector('[data-ni-admin-overlay]')?.addEventListener('click', () => {
    setDrawerOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 992px)').matches) setDrawerOpen(false);
  });
}

function paintThemeBtn(mode) {
  const btn = document.querySelector('.ni-admin-topbar [data-ni-theme-toggle]');
  if (!btn) return;
  const dark = mode === 'dark';
  btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  btn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  btn.title = dark ? 'Modo claro' : 'Modo oscuro';
  btn.innerHTML = dark
    ? '<i class="feather-sun" aria-hidden="true"></i>'
    : '<i class="feather-moon" aria-hidden="true"></i>';
  featherRefresh();
}

function paintAccount(user) {
  const slot = document.querySelector('[data-ni-admin-account]');
  if (!slot) return;
  if (!user) {
    slot.innerHTML = `
      <a class="ni-admin-account__user" href="login.html">
        <span class="ni-admin-account__avatar"><i class="feather-user" aria-hidden="true"></i></span>
        <span>Ingresar</span>
      </a>`;
    featherRefresh();
    return;
  }
  const name = user?.profile?.name || user?.name || user?.email || 'Cuenta';
  slot.innerHTML = `
    <a class="ni-admin-account__user" href="perfil.html" title="${escapeHtml(name)}">
      <span class="ni-admin-account__avatar">${escapeHtml(initials(name))}</span>
      <span>${escapeHtml(shortName(name))}</span>
    </a>
    <button type="button" class="ni-admin-icon-btn" data-ni-logout title="Salir" aria-label="Salir">
      <i class="feather-log-out" aria-hidden="true"></i>
    </button>`;
  featherRefresh();
}

function bindTheme() {
  const btn = document.querySelector('.ni-admin-topbar [data-ni-theme-toggle]');
  btn?.addEventListener('click', (e) => {
    e.preventDefault();
    const current = document.body.classList.contains('active-dark-mode') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    paintThemeBtn(next);
  });
}

function bindLogout() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.ni-admin-page [data-ni-logout]');
    if (!btn) return;
    e.preventDefault();
    await signOut();
    window.location.href = 'index.html';
  });
}

export function mountAdminShell() {
  if (!document.body.classList.contains('ni-admin-page')) return;
  applyTheme(readStoredTheme(), { persist: false });
  paintThemeBtn(readStoredTheme());
  bindDrawer();
  bindPanelNav();
  bindTheme();
  bindLogout();
  featherRefresh();

  // Feather may still be loading (defer); retry once ready.
  if (!window.feather?.replace) {
    window.addEventListener('load', () => featherRefresh(), { once: true });
  }

  subscribeSession((snap) => {
    if (snap.loading) return;
    paintAccount(snap.user || null);
  });

  window.addEventListener('load', () => featherRefresh());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mountAdminShell());
} else {
  mountAdminShell();
}
