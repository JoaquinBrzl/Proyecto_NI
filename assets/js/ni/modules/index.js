/**
 * Scaffolding stubs for progressive business modules.
 * Do NOT implement full product logic here — only hooks so future
 * work can plug in without breaking identity.
 */
import { registerModule } from './registry.js';
import './pricing.js';
import './anuncios.js';
import './admin.js';
import './talleres.js';
import './recursos.js';

function stub(id, pages) {
  registerModule(id, {
    pages,
    async mount({ hook, page }) {
      if (hook) {
        hook.setAttribute('data-ni-ready', '0');
        hook.dataset.niStub = id;
      }
      if (typeof console !== 'undefined' && console.debug) {
        console.debug(`[ni] module stub ready: ${id}`, { page: page || null });
      }
    },
  });
}

stub('match', ['match']);

// Profile CRUD lives in modules/profile.js; page bootstraps via auth-pages.initProfilePage.

export {};
