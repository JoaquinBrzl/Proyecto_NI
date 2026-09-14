import { mountHeaderAuth } from './header.js';
import { mountModules } from './modules/registry.js';
import './modules/index.js';
import { getSessionSnapshot, refreshSession, subscribeSession } from './session.js';
import { fetchIdentity } from './identity.js';

/**
 * Global NI boot: identity + header + progressive module hooks.
 * Include as: <script type="module" src="assets/js/ni/boot.js"></script>
 */

async function boot() {
  mountHeaderAuth();

  const page = document.body?.dataset?.niPage || '';
  let identity = null;

  await refreshSession();
  const snap = getSessionSnapshot();
  if (snap.user) {
    identity = await fetchIdentity(snap.user.id);
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
