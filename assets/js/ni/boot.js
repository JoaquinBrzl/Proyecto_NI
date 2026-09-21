import { mountHeaderAuth } from './header.js';
import { mountFooter } from './footer.js';
import { mountModules } from './modules/registry.js';
import './modules/index.js';
import { getSessionSnapshot, refreshSession, subscribeSession } from './session.js';
import { fetchIdentity } from './identity.js';
import { bindAdminFileInputs } from './admin-file-ui.js';
import { fetchOwnProfile, needsProfileOnboarding } from './modules/profile.js';
import { showCatalogLoading } from './catalog-loading.js';

/**
 * Global NI boot: identity + header + progressive module hooks.
 * Include as: <script type="module" src="assets/js/ni/boot.js"></script>
 */

const PROFILE_GATE_SKIP = new Set(['login', 'register', 'verify', 'reset', 'admin', 'completar-perfil']);

const CATALOG_LOADING = {
  talleres: { id: 'ni-talleres-list', variant: 'cards', count: 6 },
  anuncios: { id: 'ni-anuncios-list', variant: 'cards', count: 6 },
  recursos: { id: 'resource-list', variant: 'rows', count: 5 },
  match: { id: 'ni-match-list', variant: 'match', count: 6, reveal: 'ni-match-root' },
};

function paintCatalogLoading(page) {
  const cfg = CATALOG_LOADING[page];
  if (!cfg) return;
  if (cfg.reveal) {
    const root = document.getElementById(cfg.reveal);
    if (root) root.hidden = false;
  }
  const el = document.getElementById(cfg.id);
  if (el) showCatalogLoading(el, { count: cfg.count, variant: cfg.variant });
}

async function boot() {
  const page = document.body?.dataset?.niPage || '';
  const isAdminPage = page === 'admin' || document.body.classList.contains('ni-admin-page');

  // Admin uses its own shell; do not inject the public Zenit header/footer.
  if (!isAdminPage) {
    mountHeaderAuth();
    mountFooter();
  }

  // Show skeletons ASAP while session/auth resolves (avoids empty white gap).
  paintCatalogLoading(page);

  bindAdminFileInputs();

  let identity = null;

  await refreshSession();
  const snap = getSessionSnapshot();
  if (snap.user) {
    identity = await fetchIdentity(snap.user.id);
  }

  // Logged-in students must finish mandatory profile before using the app.
  if (
    snap.user &&
    !isAdminPage &&
    !PROFILE_GATE_SKIP.has(page) &&
    identity?.role !== 'admin'
  ) {
    const own = await fetchOwnProfile(snap.user.id);
    if (needsProfileOnboarding(own)) {
      const next = encodeURIComponent(
        `${window.location.pathname.split('/').pop() || 'index.html'}${window.location.search || ''}`,
      );
      window.location.replace(`completar-perfil.html?next=${next}`);
      return;
    }
  }

  await mountModules({
    page,
    user: snap.user,
    identity,
    subscribeSession,
    getSessionSnapshot,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot().catch((err) => console.error('[ni] boot failed', err));
  });
} else {
  boot().catch((err) => console.error('[ni] boot failed', err));
}
