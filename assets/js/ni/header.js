import { subscribeSession, signOut, refreshSession } from './session.js';
import { fetchIdentity } from './identity.js';

/**
 * Session-aware header hooks without redesigning Corpox.
 * Targets `.header-btn > a.tmp-btn` (Membresia CTA) and injects auth links.
 */

function ensureAuthSlot(headerBtn) {
  let slot = headerBtn.querySelector('[data-ni-auth-slot]');
  if (!slot) {
    slot = document.createElement('span');
    slot.setAttribute('data-ni-auth-slot', '1');
    slot.style.display = 'inline-flex';
    slot.style.alignItems = 'center';
    slot.style.gap = '0.75rem';
    slot.style.marginRight = '0.75rem';
    headerBtn.insertBefore(slot, headerBtn.querySelector('a.tmp-btn'));
  }
  return slot;
}

function renderLoggedOut(slot) {
  slot.innerHTML = `
    <a class="tmp-btn btn-border btn-small" href="login.html" data-ni-login>Ingresar</a>
  `;
}

function renderLoggedIn(slot, { user, identity }) {
  const name = user?.profile?.name || user?.name || user?.email || 'Cuenta';
  const plan = identity?.membership?.plan || 'ni_free';
  const planLabel = plan.replace('ni_', 'NI ').replace(/\b\w/g, (c) => c.toUpperCase());
  const isAdmin = identity?.role === 'admin';
  const adminLink = isAdmin
    ? `<a class="tmp-btn btn-border btn-small" href="admin.html" data-ni-admin>Admin</a>`
    : '';
  slot.innerHTML = `
    ${adminLink}
    <a class="tmp-btn btn-border btn-small" href="perfil.html" data-ni-profile title="${planLabel}">${escapeHtml(name)}</a>
    <a class="tmp-btn btn-small" href="#" data-ni-logout>Salir</a>
  `;
  const logout = slot.querySelector('[data-ni-logout]');
  if (logout) {
    logout.addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut();
      window.location.href = 'index.html';
    });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function mountHeaderAuth() {
  const headerBtns = document.querySelectorAll('.header-btn');
  if (!headerBtns.length) return () => {};

  let identityCache = null;

  const unsub = subscribeSession(async (snap) => {
    for (const headerBtn of headerBtns) {
      const slot = ensureAuthSlot(headerBtn);
      if (snap.loading) {
        slot.innerHTML = `<span class="subtitle-text" style="opacity:.6;font-size:14px;">…</span>`;
        continue;
      }
      if (!snap.user) {
        renderLoggedOut(slot);
        continue;
      }
      if (!identityCache || identityCache.userId !== snap.user.id) {
        identityCache = { userId: snap.user.id, ...(await fetchIdentity(snap.user.id)) };
      }
      renderLoggedIn(slot, { user: snap.user, identity: identityCache });
    }
  });

  refreshSession();
  return unsub;
}
