/**
 * Shared catalog loading skeletons (talleres / anuncios / recursos).
 */

export function ensureCatalogLoadingStyles() {
  if (document.getElementById('ni-catalog-loading-css')) return;
  const link = document.createElement('link');
  link.id = 'ni-catalog-loading-css';
  link.rel = 'stylesheet';
  link.href = `${new URL('../../css/ni-catalog-loading.css', import.meta.url).href}?v=1.0.1`;
  document.head.appendChild(link);
}

function skelCard() {
  return `
    <div class="col-xl-4 col-lg-4 col-md-6 col-12">
      <div class="ni-catalog-skel" aria-hidden="true">
        <div class="ni-catalog-skel__media ni-skel-shimmer"></div>
        <div class="ni-catalog-skel__body">
          <div class="ni-catalog-skel__line ni-skel-shimmer" style="width:42%"></div>
          <div class="ni-catalog-skel__line ni-catalog-skel__line--lg ni-skel-shimmer" style="width:88%"></div>
          <div class="ni-catalog-skel__line ni-skel-shimmer" style="width:64%"></div>
          <div class="ni-catalog-skel__line ni-skel-shimmer" style="width:96%"></div>
          <div class="ni-catalog-skel__line ni-skel-shimmer" style="width:72%"></div>
          <div class="ni-catalog-skel__actions">
            <div class="ni-catalog-skel__btn ni-skel-shimmer"></div>
            <div class="ni-catalog-skel__btn ni-catalog-skel__btn--sm ni-skel-shimmer"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function skelResourceRow() {
  return `
    <div class="ni-catalog-skel ni-catalog-skel--row" aria-hidden="true">
      <div class="ni-catalog-skel__icon ni-skel-shimmer"></div>
      <div class="ni-catalog-skel__body">
        <div class="ni-catalog-skel__line ni-catalog-skel__line--lg ni-skel-shimmer" style="width:55%"></div>
        <div class="ni-catalog-skel__line ni-skel-shimmer" style="width:35%"></div>
      </div>
      <div class="ni-catalog-skel__btn ni-catalog-skel__btn--sm ni-skel-shimmer"></div>
    </div>`;
}

function skelMatchCard() {
  return `
    <div class="ni-catalog-skel ni-catalog-skel--match" aria-hidden="true">
      <div class="ni-catalog-skel__match-top">
        <div class="ni-catalog-skel__avatar ni-skel-shimmer"></div>
        <div class="ni-catalog-skel__line ni-skel-shimmer" style="width:28%"></div>
      </div>
      <div class="ni-catalog-skel__line ni-catalog-skel__line--lg ni-skel-shimmer" style="width:62%"></div>
      <div class="ni-catalog-skel__line ni-skel-shimmer" style="width:78%"></div>
      <div class="ni-catalog-skel__tags">
        <div class="ni-catalog-skel__tag ni-skel-shimmer"></div>
        <div class="ni-catalog-skel__tag ni-skel-shimmer"></div>
        <div class="ni-catalog-skel__tag ni-skel-shimmer"></div>
      </div>
      <div class="ni-catalog-skel__line ni-skel-shimmer" style="width:92%"></div>
      <div class="ni-catalog-skel__line ni-skel-shimmer" style="width:70%"></div>
      <div class="ni-catalog-skel__actions">
        <div class="ni-catalog-skel__btn ni-skel-shimmer"></div>
      </div>
    </div>`;
}

/** @param {'cards'|'rows'|'match'} variant */
export function showCatalogLoading(listEl, { count = 6, variant = 'cards' } = {}) {
  if (!listEl) return;
  ensureCatalogLoadingStyles();
  let items;
  if (variant === 'rows') {
    items = Array.from({ length: count }, () => skelResourceRow()).join('');
  } else if (variant === 'match') {
    items = Array.from({ length: count }, () => skelMatchCard()).join('');
  } else {
    items = Array.from({ length: count }, () => skelCard()).join('');
  }
  listEl.innerHTML = items;
  listEl.setAttribute('aria-busy', 'true');
  listEl.classList.add('is-loading');
}

export function clearCatalogLoading(listEl) {
  if (!listEl) return;
  listEl.removeAttribute('aria-busy');
  listEl.classList.remove('is-loading');
}
