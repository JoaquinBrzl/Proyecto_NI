import { getClient } from '../client.js';
import { rpcIsAdmin } from '../identity.js';
import { registerModule } from './registry.js';
import { showCatalogLoading, clearCatalogLoading, ensureCatalogLoadingStyles } from '../catalog-loading.js';

/**
 * Anuncios públicos + CRUD admin en modal (anuncios.html).
 */

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 300;

export const CATEGORY_LABELS = {
  eventos: 'Eventos',
  talleres: 'Talleres',
  oportunidades: 'Oportunidades',
  comunicados: 'Comunicados',
  recursos: 'Recursos',
};

const PUBLIC_COLUMNS =
  'id,title,category,description,published_at,link_url,status,image_url,image_key,created_at';

const ADMIN_COLUMNS =
  'id,title,category,description,published_at,link_url,status,image_url,image_key,created_by,created_at,updated_at';

export const ANNOUNCEMENT_IMAGE_BUCKET = 'announcement-images';
export const ANNOUNCEMENT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const ANNOUNCEMENT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

function truncate(text, max = 140) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
}

function isExternalUrl(url) {
  try {
    const u = new URL(url, window.location.href);
    return u.origin !== window.location.origin;
  } catch {
    return /^https?:\/\//i.test(String(url || ''));
  }
}

function sanitizeSearchTerm(raw) {
  return String(raw || '')
    .trim()
    .slice(0, 80)
    .replace(/[%_,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function setStatus(el, text, kind = '') {
  if (!el) return;
  el.textContent = text || '';
  el.dataset.niStatus = kind || '';
  el.hidden = !text;
}

function toDatetimeLocalValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function getBootstrapModal(el) {
  const BS = window.bootstrap;
  if (!BS?.Modal || !el) return null;
  return BS.Modal.getOrCreateInstance(el);
}

function refreshIcons(root) {
  try {
    if (window.feather?.replace) window.feather.replace({ root: root || document });
  } catch {
    /* ignore */
  }
}

function wireFilterGroup(root, attr, onChange) {
  if (!root) return;
  root.addEventListener('click', (e) => {
    const btn = e.target.closest(`[${attr}]`);
    if (!btn || !root.contains(btn)) return;
    root.querySelectorAll(`[${attr}]`).forEach((b) => b.classList.remove('is-checked'));
    btn.classList.add('is-checked');
    onChange(btn.getAttribute(attr) || '');
  });
}

/**
 * Public published list with optional category + title/description search.
 */
export async function listPublishedAnnouncements({
  category = '',
  search = '',
  page = 1,
  pageSize = PAGE_SIZE,
} = {}) {
  const insforge = getClient();
  const safePage = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || PAGE_SIZE);
  const from = (safePage - 1) * size;
  const to = from + size - 1;

  let query = insforge.database
    .from('announcements')
    .select(PUBLIC_COLUMNS, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq('category', category);
  }

  const term = sanitizeSearchTerm(search);
  if (term) {
    const pattern = `"%${term.replace(/"/g, '')}%"`;
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  return {
    data: Array.isArray(data) ? data : [],
    count: typeof count === 'number' ? count : 0,
    error: error || null,
  };
}

/** Admin: list all statuses (draft + published). RLS blocks non-admins. */
export async function listAnnouncementsAdmin({
  status = null,
  category = '',
  search = '',
  page = 1,
  pageSize = PAGE_SIZE,
} = {}) {
  const insforge = getClient();
  const safePage = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || PAGE_SIZE);
  const from = (safePage - 1) * size;
  const to = from + size - 1;

  let query = insforge.database
    .from('announcements')
    .select(ADMIN_COLUMNS, { count: 'exact' })
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status === 'published' || status === 'draft') query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  const term = sanitizeSearchTerm(search);
  if (term) {
    const pattern = `"%${term.replace(/"/g, '')}%"`;
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  return {
    data: Array.isArray(data) ? data : [],
    count: typeof count === 'number' ? count : 0,
    error: error || null,
  };
}

export async function createAnnouncement(payload = {}) {
  const insforge = getClient();
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
  const uid = userData?.user?.id || null;
  if (userError || !uid) {
    return { data: null, error: userError || new Error('Debes iniciar sesión') };
  }

  const row = {
    title: String(payload.title || '').trim(),
    category: String(payload.category || '').trim(),
    description: String(payload.description || '').trim(),
    link_url: String(payload.link_url || '').trim(),
    status: payload.status === 'published' ? 'published' : 'draft',
    published_at:
      payload.published_at ||
      (payload.status === 'published' ? new Date().toISOString() : null),
    image_url: payload.image_url != null ? String(payload.image_url).trim() || null : null,
    image_key: payload.image_key != null ? String(payload.image_key).trim() || null : null,
    created_by: uid,
  };

  return insforge.database.from('announcements').insert([row]).select(ADMIN_COLUMNS);
}

export async function updateAnnouncement(id, patch = {}) {
  const insforge = getClient();
  const allowed = {};
  for (const key of [
    'title',
    'category',
    'description',
    'link_url',
    'status',
    'published_at',
    'image_url',
    'image_key',
  ]) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      allowed[key] = patch[key];
    }
  }
  return insforge.database.from('announcements').update(allowed).eq('id', id).select(ADMIN_COLUMNS);
}

export async function deleteAnnouncement(id, { imageKey = null } = {}) {
  const insforge = getClient();
  const key = imageKey || null;
  const { data, error } = await insforge.database.from('announcements').delete().eq('id', id);
  if (!error && key) {
    await insforge.storage.from(ANNOUNCEMENT_IMAGE_BUCKET).remove(key);
  }
  return { data, error };
}

export function validateAnnouncementImage(file) {
  if (!file) return { ok: false, error: 'Selecciona una imagen' };
  if (!ANNOUNCEMENT_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Formato no permitido. Usa JPEG, PNG o WebP.' };
  }
  if (file.size > ANNOUNCEMENT_IMAGE_MAX_BYTES) {
    return { ok: false, error: 'La imagen no puede superar 2 MB.' };
  }
  return { ok: true, error: null };
}

export async function uploadAnnouncementImage(file, { previousKey = null } = {}) {
  const check = validateAnnouncementImage(file);
  if (!check.ok) return { data: null, error: new Error(check.error) };

  const insforge = getClient();
  const ext =
    file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const key = `announcements/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await insforge.storage.from(ANNOUNCEMENT_IMAGE_BUCKET).upload(key, file);
  if (error) return { data: null, error };

  if (previousKey && previousKey !== data?.key) {
    await insforge.storage.from(ANNOUNCEMENT_IMAGE_BUCKET).remove(previousKey);
  }

  return {
    data: {
      url: data?.url || null,
      key: data?.key || key,
    },
    error: null,
  };
}

function renderCard(item, { isAdmin = false } = {}) {
  const col = document.createElement('div');
  col.className = 'col-lg-4 col-md-6';

  const catLabel = CATEGORY_LABELS[item.category] || item.category || '';
  const href = String(item.link_url || '#').trim() || '#';
  const external = isExternalUrl(href);
  const dateStr = formatDate(item.published_at || item.created_at);
  const title = escapeHtml(item.title || 'Sin título');
  const desc = escapeHtml(truncate(item.description || ''));
  const safeHref = escapeAttr(href);
  const imageUrl = String(item.image_url || '').trim();
  const media = imageUrl
    ? `<img src="${escapeAttr(imageUrl)}" alt="${title}" loading="lazy">`
    : `<div class="ni-catalog-card__media-placeholder"><i class="feather-image"></i></div>`;

  const draftBadge =
    isAdmin && item.status === 'draft'
      ? `<span class="ni-catalog-pill" style="background:#F3F4F6;color:#6B7280;">Borrador</span>`
      : '';

  const adminActions = isAdmin
    ? `<div class="ni-catalog-card__admin">
        <button type="button" class="tmp-btn btn-border btn-small" data-ni-ann-edit="${escapeAttr(item.id)}">Editar</button>
        <button type="button" class="tmp-btn btn-small" data-ni-ann-delete="${escapeAttr(item.id)}" data-title="${escapeAttr(item.title || '')}" data-image-key="${escapeAttr(item.image_key || '')}">Eliminar</button>
      </div>`
    : '';

  col.innerHTML = `
    <article class="ni-catalog-card">
      <div class="ni-catalog-card__media">
        ${media}
        <div class="ni-catalog-card__badges">
          <span class="ni-catalog-pill">${escapeHtml(catLabel)}</span>
          ${draftBadge}
        </div>
      </div>
      <div class="ni-catalog-card__body">
        ${
          dateStr
            ? `<div class="ni-catalog-card__meta"><span><i class="feather-calendar"></i>${escapeHtml(dateStr)}</span></div>`
            : ''
        }
        <h3 class="ni-catalog-card__title">
          <a href="${safeHref}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${title}</a>
        </h3>
        <p class="ni-catalog-card__desc">${desc}</p>
        <div class="ni-catalog-card__actions">
          <a class="ni-catalog-btn ni-catalog-btn--ghost" href="${safeHref}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
            Ver más <i class="feather-chevron-right"></i>
          </a>
        </div>
        ${adminActions}
      </div>
    </article>
  `;
  return col;
}

function renderPagination(ul, { page, totalPages, onPage }) {
  if (!ul) return;
  ul.innerHTML = '';
  if (totalPages <= 1) {
    ul.hidden = true;
    return;
  }
  ul.hidden = false;

  const addItem = (label, targetPage, { active = false, disabled = false, aria } = {}) => {
    const li = document.createElement('li');
    if (active) li.classList.add('active');
    const a = document.createElement('a');
    a.href = '#';
    a.innerHTML = label;
    if (aria) a.setAttribute('aria-label', aria);
    if (disabled) {
      a.setAttribute('aria-disabled', 'true');
      a.classList.add('disabled');
      a.addEventListener('click', (e) => e.preventDefault());
    } else {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        onPage(targetPage);
      });
    }
    li.appendChild(a);
    ul.appendChild(li);
  };

  addItem('<i class="feather-chevron-left"></i>', page - 1, {
    disabled: page <= 1,
    aria: 'Página anterior',
  });

  for (let p = 1; p <= totalPages; p += 1) {
    addItem(String(p), p, { active: p === page, aria: `Página ${p}` });
  }

  addItem('<i class="feather-chevron-right"></i>', page + 1, {
    disabled: page >= totalPages,
    aria: 'Página siguiente',
  });
}

function createController() {
  const listEl = document.getElementById('ni-anuncios-list');
  const statusEl = document.getElementById('ni-anuncios-status');
  const paginationEl = document.getElementById('ni-anuncios-pagination');
  const searchEl = document.getElementById('ni-anuncios-search');
  const categoryGroup = document.getElementById('ni-anuncios-category');
  const createBtn = document.getElementById('ni-anuncios-admin-create');
  const pubWrap = document.getElementById('ni-anuncios-pub-wrap');
  const modalEl = document.getElementById('ni-anuncios-modal');
  const modalTitle = document.getElementById('ni-anuncios-modal-title');
  const form = document.getElementById('ni-anuncios-form');
  const formStatus = document.getElementById('ni-anuncios-form-status');
  const imageInput = document.getElementById('ni-ann-image');
  const imagePreview = document.getElementById('ni-ann-image-preview');

  const state = {
    page: 1,
    category: '',
    search: '',
    pubStatus: '',
    isAdmin: false,
    itemsById: new Map(),
    pendingFile: null,
    editingImageKey: null,
    editingImageUrl: null,
  };

  let debounceTimer = null;

  function fillForm(item) {
    if (!form) return;
    form.querySelector('#ni-ann-id').value = item?.id || '';
    form.querySelector('#ni-ann-title').value = item?.title || '';
    form.querySelector('#ni-ann-category').value = item?.category || 'eventos';
    form.querySelector('#ni-ann-description').value = item?.description || '';
    form.querySelector('#ni-ann-link').value = item?.link_url || '';
    form.querySelector('#ni-ann-status').value = item?.status === 'published' ? 'published' : 'draft';
    form.querySelector('#ni-ann-published-at').value = toDatetimeLocalValue(item?.published_at);
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
      if (item?.image_url) {
        imagePreview.src = item.image_url;
        imagePreview.hidden = false;
      } else {
        imagePreview.removeAttribute('src');
        imagePreview.hidden = true;
      }
    }
  }

  function readFormPayload() {
    const fd = new FormData(form);
    return {
      id: String(fd.get('id') || '').trim(),
      title: String(fd.get('title') || '').trim(),
      category: String(fd.get('category') || '').trim(),
      description: String(fd.get('description') || '').trim(),
      link_url: String(fd.get('link_url') || '').trim(),
      status: String(fd.get('status') || 'draft'),
      published_at: fromDatetimeLocalValue(fd.get('published_at')),
    };
  }

  async function openModal(mode, item = null) {
    if (!form || !modalEl) return;
    setStatus(formStatus, '', '');
    state.pendingFile = null;
    state.editingImageKey = item?.image_key || null;
    state.editingImageUrl = item?.image_url || null;

    if (mode === 'edit' && item) {
      if (modalTitle) modalTitle.textContent = 'Editar anuncio';
      fillForm(item);
    } else {
      if (modalTitle) modalTitle.textContent = 'Crear anuncio';
      form.reset();
      fillForm({ category: 'eventos', status: 'draft' });
      form.querySelector('#ni-ann-id').value = '';
      state.editingImageKey = null;
      state.editingImageUrl = null;
    }
    getBootstrapModal(modalEl)?.show();
  }

  async function refresh() {
    if (!listEl) return;
    showCatalogLoading(listEl, { count: 6, variant: 'cards' });
    setStatus(statusEl, 'Cargando anuncios…', 'info');

    const result = state.isAdmin
      ? await listAnnouncementsAdmin({
          status: state.pubStatus || null,
          category: state.category,
          search: state.search,
          page: state.page,
          pageSize: PAGE_SIZE,
        })
      : await listPublishedAnnouncements({
          category: state.category,
          search: state.search,
          page: state.page,
          pageSize: PAGE_SIZE,
        });

    const { data, count, error } = result;
    clearCatalogLoading(listEl);
    listEl.innerHTML = '';
    state.itemsById = new Map((data || []).map((row) => [row.id, row]));

    if (error) {
      console.error('[ni/anuncios] list failed', error);
      setStatus(statusEl, 'No se pudieron cargar los anuncios. Intenta de nuevo más tarde.', 'error');
      if (paginationEl) paginationEl.hidden = true;
      return;
    }

    if (!data.length) {
      setStatus(
        statusEl,
        state.search || state.category || state.pubStatus
          ? 'No hay anuncios que coincidan con tu búsqueda o filtro.'
          : 'Aún no hay anuncios publicados.',
        'empty',
      );
      if (paginationEl) paginationEl.hidden = true;
      return;
    }

    setStatus(statusEl, '', '');
    for (const item of data) {
      listEl.appendChild(renderCard(item, { isAdmin: state.isAdmin }));
    }
    refreshIcons(listEl);

    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    if (state.page > totalPages) {
      state.page = totalPages;
      await refresh();
      return;
    }

    renderPagination(paginationEl, {
      page: state.page,
      totalPages,
      onPage: (p) => {
        state.page = p;
        refresh().catch((e) => console.warn('[ni/anuncios] page', e));
        listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    });
  }

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.search = searchEl.value || '';
        state.page = 1;
        refresh().catch((e) => console.warn('[ni/anuncios] search', e));
      }, SEARCH_DEBOUNCE_MS);
    });
  }

  wireFilterGroup(categoryGroup, 'data-ni-category', (v) => {
    state.category = v;
    state.page = 1;
    refresh().catch((err) => console.warn('[ni/anuncios] category', err));
  });

  wireFilterGroup(document.getElementById('ni-anuncios-pub'), 'data-ni-pub', (v) => {
    state.pubStatus = v;
    state.page = 1;
    refresh().catch((err) => console.warn('[ni/anuncios] pub', err));
  });

  if (createBtn) {
    createBtn.addEventListener('click', () => openModal('create'));
  }

  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const file = imageInput.files?.[0] || null;
      state.pendingFile = file;
      if (file && imagePreview) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.hidden = false;
      }
    });
  }

  if (listEl) {
    listEl.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-ni-ann-edit]');
      const delBtn = e.target.closest('[data-ni-ann-delete]');

      if (editBtn) {
        const id = editBtn.getAttribute('data-ni-ann-edit');
        const item = state.itemsById.get(id);
        if (item) openModal('edit', item);
        return;
      }

      if (delBtn) {
        const id = delBtn.getAttribute('data-ni-ann-delete');
        const title = delBtn.getAttribute('data-title') || 'este anuncio';
        const imageKey = delBtn.getAttribute('data-image-key') || '';
        if (!window.confirm(`¿Eliminar «${title}»? Esta acción no se puede deshacer.`)) return;
        setStatus(statusEl, 'Eliminando…', 'info');
        const { error } = await deleteAnnouncement(id, { imageKey });
        if (error) {
          setStatus(statusEl, error.message || 'No se pudo eliminar.', 'error');
          return;
        }
        await refresh();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = readFormPayload();
      if (!payload.title || !payload.description || !payload.link_url) {
        setStatus(formStatus, 'Completa título, descripción y enlace.', 'error');
        return;
      }
      if (!CATEGORY_LABELS[payload.category]) {
        setStatus(formStatus, 'Categoría inválida.', 'error');
        return;
      }

      const submitBtn = document.getElementById('ni-anuncios-form-submit');
      if (submitBtn) submitBtn.disabled = true;
      setStatus(formStatus, 'Guardando…', 'info');

      if (state.pendingFile) {
        const up = await uploadAnnouncementImage(state.pendingFile, {
          previousKey: state.editingImageKey,
        });
        if (up.error) {
          if (submitBtn) submitBtn.disabled = false;
          setStatus(formStatus, up.error.message || 'Error al subir imagen.', 'error');
          return;
        }
        payload.image_url = up.data.url;
        payload.image_key = up.data.key;
      } else if (payload.id) {
        payload.image_url = state.editingImageUrl;
        payload.image_key = state.editingImageKey;
      }

      if (payload.status === 'published' && !payload.published_at) {
        payload.published_at = new Date().toISOString();
      }

      let result;
      if (payload.id) {
        const { id, ...patch } = payload;
        result = await updateAnnouncement(id, patch);
      } else {
        result = await createAnnouncement(payload);
      }

      if (submitBtn) submitBtn.disabled = false;
      if (result.error) {
        setStatus(formStatus, result.error.message || 'No se pudo guardar.', 'error');
        return;
      }

      setStatus(formStatus, 'Anuncio guardado.', 'ok');
      getBootstrapModal(modalEl)?.hide();
      await refresh();
    });
  }

  return {
    async init() {
      const { data: adminData, error: adminError } = await rpcIsAdmin();
      if (adminError) {
        state.isAdmin = false;
      } else {
        const row = Array.isArray(adminData) ? adminData[0] : adminData;
        state.isAdmin = adminData === true || row === true;
      }
      if (createBtn) createBtn.hidden = !state.isAdmin;
      if (pubWrap) pubWrap.hidden = !state.isAdmin;
      await refresh();
    },
  };
}

registerModule('anuncios', {
  pages: ['anuncios'],
  async mount(ctx) {
    const hook = ctx.hook;
    if (hook) {
      hook.setAttribute('data-ni-ready', '1');
      delete hook.dataset.niStub;
      hook.hidden = true;
    }

    ensureCatalogLoadingStyles();
    showCatalogLoading(document.getElementById('ni-anuncios-list'), { count: 6, variant: 'cards' });

    const controller = createController();
    try {
      await controller.init();
    } catch (err) {
      console.error('[ni/anuncios] mount failed', err);
      setStatus(
        document.getElementById('ni-anuncios-status'),
        err.message || 'Error al cargar anuncios.',
        'error',
      );
    }
  },
});

export {};
