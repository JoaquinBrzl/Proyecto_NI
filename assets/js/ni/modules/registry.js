/**
 * Progressive module registry.
 * Future business modules (anuncios, talleres, recursos, match, …)
 * register here without touching identity or main.js.
 */

const modules = new Map();

/**
 * @param {string} id
 * @param {{ mount?: (ctx: object) => void|Promise<void>, unmount?: () => void }} mod
 */
export function registerModule(id, mod) {
  if (!id || typeof mod !== 'object') {
    throw new Error('registerModule(id, mod) requires an id and module object');
  }
  modules.set(id, mod);
}

export function getModule(id) {
  return modules.get(id) || null;
}

export function listModules() {
  return Array.from(modules.keys());
}

/**
 * Mount every registered module that opts into the current page.
 * Modules can check ctx.page or DOM hooks like [data-ni-module="anuncios"].
 */
export async function mountModules(ctx = {}) {
  const page = ctx.page || document.body?.dataset?.niPage || '';
  for (const [id, mod] of modules) {
    const hook = document.querySelector(`[data-ni-module="${id}"]`);
    const wantsPage = Array.isArray(mod.pages) ? mod.pages.includes(page) : !!mod.mount;
    if (!hook && !wantsPage && !mod.always) continue;
    if (typeof mod.mount === 'function') {
      await mod.mount({ ...ctx, page, hook, moduleId: id });
    }
  }
}
