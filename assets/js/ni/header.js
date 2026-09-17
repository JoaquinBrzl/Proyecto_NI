import { subscribeSession, signOut, refreshSession } from './session.js';
import { fetchIdentity } from './identity.js';

/**
 * Session-aware header: account lives in the mobile popup (<992px)
 * and as text links in the desktop nav. Hamburger is responsive-only.
 */

const MEMBRESIA_HREF = 'pricing-three-white.html';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureStyles() {
  if (document.getElementById('ni-header-css')) return;
  const link = document.createElement('link');
  link.id = 'ni-header-css';
  link.rel = 'stylesheet';
  link.href = new URL('../../css/ni-header.css', import.meta.url).href;
  document.head.appendChild(link);
  document.body.classList.add('ni-header-compact');
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

function ensurePopup() {
  let popup = document.querySelector('.popup-mobile-menu');
  if (!popup) {
    popup = document.createElement('div');
    popup.className = 'popup-mobile-menu';
    popup.innerHTML = `
      <div class="inner">
        <div class="header-top">
          <div class="logo">
            <a href="index.html">
              <img class="logo-light" src="assets/images/logo/logo.png" alt="Grupo NI">
              <img class="logo-dark" src="assets/images/logo/logo-dark.png" alt="Grupo NI">
            </a>
          </div>
          <div class="close-menu">
            <button class="close-button" type="button" aria-label="Cerrar menú">
              <i class="feather-x"></i>
            </button>
          </div>
        </div>
        <ul class="mainmenu">
          <li><a href="index.html">Home</a></li>
          <li><a href="about-white.html">Nosotros</a></li>
          <li><a href="contact-white.html">Contacto</a></li>
        </ul>
      </div>
    `;
    const header = document.querySelector('.tmp-header');
    if (header?.parentElement) {
      header.after(popup);
    } else {
      document.body.prepend(popup);
    }
  }

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
      document.querySelector('.popup-mobile-menu')?.classList.remove('active');
    });
  });
}

function closePopup() {
  document.querySelector('.popup-mobile-menu')?.classList.remove('active');
}

function popupHasMembresia() {
  const nav = document.querySelector('.popup-mobile-menu .inner > .mainmenu:not([data-ni-auth-menu])');
  return Boolean(nav?.querySelector(`a[href="${MEMBRESIA_HREF}"]`));
}

function membresiaItemHtml() {
  if (popupHasMembresia()) return '';
  return `<li><a href="${MEMBRESIA_HREF}">Membresia</a></li>`;
}

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
  const plan = identity?.membership?.plan || 'ni_free';
  const planLabel = plan.replace('ni_', 'NI ').replace(/\b\w/g, (c) => c.toUpperCase());
  const adminItem = identity?.role === 'admin' ? `<li><a href="admin.html" data-ni-admin>Admin</a></li>` : '';
  return `
    ${membership}
    ${adminItem}
    <li><a href="perfil.html" data-ni-profile>${escapeHtml(name)} · ${escapeHtml(planLabel)}</a></li>
    <li><a href="#" data-ni-logout>Salir</a></li>
  `;
}

function renderPopupAccount(menu, { user, identity }) {
  menu.innerHTML = accountItemsHtml(user, identity, { includeMembresia: true });
}

function renderDesktopAccount({ user, identity }) {
  const nav = document.querySelector('.tmp-header .mainmenu-nav > .mainmenu');
  if (!nav) return;
  nav.querySelectorAll('[data-ni-auth-desktop]').forEach((el) => el.remove());
  const tmp = document.createElement('ul');
  tmp.innerHTML = accountItemsHtml(user, identity, { includeMembresia: false });
  tmp.querySelectorAll('li').forEach((li) => {
    li.setAttribute('data-ni-auth-desktop', '1');
    nav.appendChild(li);
  });
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
    await signOut();
    window.location.href = 'index.html';
  });
}

export function mountHeaderAuth() {
  ensureStyles();
  ensureHamburger();
  const menu = ensurePopup();
  clearLegacyHeaderSlots();
  bindMenuChrome();
  bindLogoutDelegation();
  if (!menu) return () => {};

  let identityCache = null;

  const unsub = subscribeSession(async (snap) => {
    if (snap.loading) {
      menu.innerHTML = `<li><span class="ni-auth-loading">…</span></li>`;
      return;
    }
    if (!snap.user) {
      identityCache = null;
      renderPopupAccount(menu, { user: null, identity: null });
      renderDesktopAccount({ user: null, identity: null });
      return;
    }
    if (!identityCache || identityCache.userId !== snap.user.id) {
      identityCache = { userId: snap.user.id, ...(await fetchIdentity(snap.user.id)) };
    }
    renderPopupAccount(menu, { user: snap.user, identity: identityCache });
    renderDesktopAccount({ user: snap.user, identity: identityCache });
  });

  refreshSession();
  return unsub;
}
