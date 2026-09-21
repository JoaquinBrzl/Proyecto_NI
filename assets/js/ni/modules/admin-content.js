import {
  listAnnouncementsAdmin,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  uploadAnnouncementImage,
  CATEGORY_LABELS,
} from './anuncios.js';
import {
  listWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  uploadWorkshopImage,
  getWorkshopRecordingAdmin,
} from './talleres.js';
import {
  listResources,
  createResource,
  updateResource,
  deleteResource,
  uploadResourceFile,
} from './recursos.js';
import {
  fetchInterestsCatalog,
  createInterest,
  updateInterest,
  deleteInterest,
  slugifyInterestLabel,
} from './profile.js';

const PAGE_SIZE = 10;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setStatus(el, text, kind = '') {
  if (!el) return;
  el.textContent = text || '';
  el.dataset.niStatus = kind || '';
  el.hidden = !text;
}

function formatDate(iso) {
  if (!iso) return '—';
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

function getModal(el) {
  const BS = window.bootstrap;
  if (!BS?.Modal || !el) return null;
  return BS.Modal.getOrCreateInstance(el);
}

function renderPagination(root, { page, totalPages, onPage }) {
  if (!root) return;
  if (totalPages <= 1) {
    root.innerHTML = '';
    return;
  }
  const buttons = [];
  buttons.push(
    `<button type="button" class="ni-admin-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>`,
  );
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p += 1) {
    buttons.push(
      `<button type="button" class="ni-admin-page-btn${p === page ? ' is-active' : ''}" data-page="${p}">${p}</button>`,
    );
  }
  buttons.push(
    `<button type="button" class="ni-admin-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>›</button>`,
  );
  root.innerHTML = buttons.join('');
  root.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = Number(btn.getAttribute('data-page'));
      if (!Number.isFinite(next) || next < 1 || next > totalPages || next === page) return;
      onPage(next);
    });
  });
}

function statusBadge(status) {
  const label = status === 'published' ? 'Publicado' : status === 'draft' ? 'Borrador' : status || '—';
  return `<span class="tmp-badge">${escapeHtml(label)}</span>`;
}

function setImagePreview(imgEl, url) {
  if (!imgEl) return;
  if (url) {
    imgEl.src = url;
    imgEl.hidden = false;
  } else {
    imgEl.removeAttribute('src');
    imgEl.hidden = true;
  }
}

function bindFilePreview(inputEl, previewEl) {
  if (!inputEl || !previewEl) return;
  inputEl.addEventListener('change', () => {
    const file = inputEl.files?.[0];
    if (!file) {
      setImagePreview(previewEl, null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(previewEl, url);
  });
}

function wireFilterChips(root, attr, onChange) {
  if (!root) return;
  root.addEventListener('click', (e) => {
    const btn = e.target.closest(`[${attr}]`);
    if (!btn || !root.contains(btn)) return;
    root.querySelectorAll(`[${attr}]`).forEach((b) => b.classList.toggle('is-checked', b === btn));
    onChange(btn.getAttribute(attr) || '');
  });
}

/** ---------- Anuncios ---------- */
function bindAnnouncements() {
  const tbody = document.querySelector('#ni-admin-ann-table tbody');
  const statusEl = document.getElementById('ni-admin-ann-status');
  const pager = document.getElementById('ni-admin-ann-pagination');
  const searchInput = document.getElementById('ni-admin-ann-search');
  const filterChips = document.getElementById('ni-admin-ann-filter-chips');
  const createBtn = document.getElementById('ni-admin-ann-create');
  const modalEl = document.getElementById('ni-admin-ann-modal');
  const form = document.getElementById('ni-admin-ann-form');
  const formStatus = document.getElementById('ni-admin-ann-form-status');
  const modalTitle = document.getElementById('ni-admin-ann-modal-title');
  const imagePreview = document.getElementById('ni-admin-ann-image-preview');
  const imageInput = document.getElementById('ni-admin-ann-image');
  if (!tbody || !form) return;

  bindFilePreview(imageInput, imagePreview);

  const state = { page: 1, search: '', category: '', rows: [] };
  let searchTimer = null;

  async function refresh() {
    setStatus(statusEl, 'Cargando anuncios…', 'info');
    const { data, count, error } = await listAnnouncementsAdmin({
      category: state.category || null,
      search: state.search,
      page: state.page,
      pageSize: PAGE_SIZE,
    });
    state.rows = data;
    tbody.innerHTML = '';
    if (error) {
      setStatus(statusEl, error.message || 'No se pudieron cargar anuncios.', 'error');
      return;
    }
    if (!data.length) {
      setStatus(statusEl, 'No hay anuncios con estos filtros.', 'empty');
      renderPagination(pager, { page: 1, totalPages: 1, onPage: () => {} });
      return;
    }
    setStatus(statusEl, '', '');
    for (const row of data) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(row.title || '—')}</td>
        <td>${escapeHtml(CATEGORY_LABELS[row.category] || row.category || '—')}</td>
        <td>${statusBadge(row.status)}</td>
        <td>${escapeHtml(formatDate(row.published_at || row.created_at))}</td>
        <td class="ni-admin-row-actions">
          <button type="button" class="tmp-btn btn-border btn-small" data-ni-admin-ann-edit="${escapeHtml(row.id)}">Editar</button>
          <button type="button" class="ni-admin-btn ni-admin-btn--danger btn-small" data-ni-admin-ann-del="${escapeHtml(row.id)}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    }
    const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
    renderPagination(pager, {
      page: state.page,
      totalPages,
      onPage: (p) => {
        state.page = p;
        refresh();
      },
    });
  }

  function openForm(row = null) {
    form.reset();
    form.querySelector('#ni-admin-ann-id').value = row?.id || '';
    form.querySelector('#ni-admin-ann-title').value = row?.title || '';
    form.querySelector('#ni-admin-ann-category').value = row?.category || 'eventos';
    form.querySelector('#ni-admin-ann-description').value = row?.description || '';
    form.querySelector('#ni-admin-ann-link').value = row?.link_url || '';
    form.querySelector('#ni-admin-ann-status').value = row?.status || 'draft';
    form.querySelector('#ni-admin-ann-published-at').value = toDatetimeLocalValue(row?.published_at);
    form.querySelector('#ni-admin-ann-image').value = '';
    setImagePreview(imagePreview, row?.image_url || null);
    if (modalTitle) modalTitle.textContent = row ? 'Editar anuncio' : 'Nuevo anuncio';
    setStatus(formStatus, '', '');
    getModal(modalEl)?.show();
  }

  createBtn?.addEventListener('click', () => openForm(null));
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      state.page = 1;
      refresh();
    }, 280);
  });
  wireFilterChips(filterChips, 'data-ni-ann-category', (v) => {
    state.category = v;
    state.page = 1;
    refresh();
  });

  tbody.addEventListener('click', async (e) => {
    const editId = e.target.closest('[data-ni-admin-ann-edit]')?.getAttribute('data-ni-admin-ann-edit');
    const delId = e.target.closest('[data-ni-admin-ann-del]')?.getAttribute('data-ni-admin-ann-del');
    if (editId) {
      const row = state.rows.find((r) => r.id === editId);
      if (row) openForm(row);
      return;
    }
    if (delId) {
      if (!window.confirm('¿Eliminar este anuncio?')) return;
      const row = state.rows.find((r) => r.id === delId);
      const { error } = await deleteAnnouncement(delId, { imageKey: row?.image_key || null });
      if (error) {
        setStatus(statusEl, error.message || 'No se pudo eliminar.', 'error');
        return;
      }
      await refresh();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = form.querySelector('#ni-admin-ann-id').value.trim();
    const file = form.querySelector('#ni-admin-ann-image').files?.[0] || null;
    setStatus(formStatus, 'Guardando…', 'info');
    let image_url;
    let image_key;
    const existing = id ? state.rows.find((r) => r.id === id) : null;
    if (file) {
      const up = await uploadAnnouncementImage(file, { previousKey: existing?.image_key || null });
      if (up.error) {
        setStatus(formStatus, up.error.message || 'Error al subir imagen.', 'error');
        return;
      }
      image_url = up.data?.url || null;
      image_key = up.data?.key || null;
    }
    const payload = {
      title: form.querySelector('#ni-admin-ann-title').value,
      category: form.querySelector('#ni-admin-ann-category').value,
      description: form.querySelector('#ni-admin-ann-description').value,
      link_url: form.querySelector('#ni-admin-ann-link').value,
      status: form.querySelector('#ni-admin-ann-status').value,
      published_at: fromDatetimeLocalValue(form.querySelector('#ni-admin-ann-published-at').value),
    };
    if (image_url !== undefined) {
      payload.image_url = image_url;
      payload.image_key = image_key;
    }
    const result = id ? await updateAnnouncement(id, payload) : await createAnnouncement(payload);
    if (result.error) {
      setStatus(formStatus, result.error.message || 'No se pudo guardar.', 'error');
      return;
    }
    getModal(modalEl)?.hide();
    await refresh();
  });

  refresh();
}

/** ---------- Talleres ---------- */
function bindWorkshops() {
  const tbody = document.querySelector('#ni-admin-ws-table tbody');
  const statusEl = document.getElementById('ni-admin-ws-status');
  const pager = document.getElementById('ni-admin-ws-pagination');
  const searchInput = document.getElementById('ni-admin-ws-search');
  const filterChips = document.getElementById('ni-admin-ws-filter-chips');
  const createBtn = document.getElementById('ni-admin-ws-create');
  const modalEl = document.getElementById('ni-admin-ws-modal');
  const form = document.getElementById('ni-admin-ws-form');
  const formStatus = document.getElementById('ni-admin-ws-form-status');
  const modalTitle = document.getElementById('ni-admin-ws-modal-title');
  const imagePreview = document.getElementById('ni-admin-ws-image-preview');
  const imageInput = document.getElementById('ni-admin-ws-image');
  if (!tbody || !form) return;

  bindFilePreview(imageInput, imagePreview);

  const state = { page: 1, search: '', pubStatus: '', rows: [] };
  let searchTimer = null;

  async function refresh() {
    setStatus(statusEl, 'Cargando talleres…', 'info');
    const { data, count, error } = await listWorkshops({
      search: state.search,
      pubStatus: state.pubStatus,
      page: state.page,
      pageSize: PAGE_SIZE,
      isAdmin: true,
    });
    state.rows = data;
    tbody.innerHTML = '';
    if (error) {
      setStatus(statusEl, error.message || 'No se pudieron cargar talleres.', 'error');
      return;
    }
    if (!data.length) {
      setStatus(statusEl, 'No hay talleres con estos filtros.', 'empty');
      renderPagination(pager, { page: 1, totalPages: 1, onPage: () => {} });
      return;
    }
    setStatus(statusEl, '', '');
    for (const row of data) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(row.title || '—')}</td>
        <td>${escapeHtml(row.speaker || '—')}</td>
        <td>${escapeHtml(row.modality || '—')}</td>
        <td>${statusBadge(row.status)}</td>
        <td>${escapeHtml(formatDate(row.starts_at))}</td>
        <td class="ni-admin-row-actions">
          <button type="button" class="tmp-btn btn-border btn-small" data-ni-admin-ws-edit="${escapeHtml(row.id)}">Editar</button>
          <button type="button" class="ni-admin-btn ni-admin-btn--danger btn-small" data-ni-admin-ws-del="${escapeHtml(row.id)}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    }
    const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
    renderPagination(pager, {
      page: state.page,
      totalPages,
      onPage: (p) => {
        state.page = p;
        refresh();
      },
    });
  }

  async function openForm(row = null) {
    form.reset();
    form.querySelector('#ni-admin-ws-id').value = row?.id || '';
    form.querySelector('#ni-admin-ws-title').value = row?.title || '';
    form.querySelector('#ni-admin-ws-desc').value = row?.short_description || '';
    form.querySelector('#ni-admin-ws-speaker').value = row?.speaker || '';
    form.querySelector('#ni-admin-ws-modality').value = row?.modality || 'virtual';
    form.querySelector('#ni-admin-ws-starts').value = toDatetimeLocalValue(row?.starts_at);
    form.querySelector('#ni-admin-ws-ends').value = toDatetimeLocalValue(row?.ends_at);
    form.querySelector('#ni-admin-ws-location').value = row?.location || '';
    form.querySelector('#ni-admin-ws-virtual').value = row?.virtual_url || '';
    form.querySelector('#ni-admin-ws-level').value = String(row?.required_membership_level ?? 0);
    form.querySelector('#ni-admin-ws-capacity').value = String(row?.capacity || 30);
    form.querySelector('#ni-admin-ws-deadline').value = toDatetimeLocalValue(row?.registration_deadline);
    form.querySelector('#ni-admin-ws-status').value = row?.status || 'draft';
    form.querySelector('#ni-admin-ws-recording').value = '';
    form.querySelector('#ni-admin-ws-image').value = '';
    setImagePreview(imagePreview, row?.image_url || null);
    if (row?.id) {
      try {
        const rec = await getWorkshopRecordingAdmin(row.id);
        const raw = rec?.data;
        const url =
          typeof raw === 'string'
            ? raw
            : raw?.recording_url || raw?.url || (Array.isArray(raw) ? raw[0]?.recording_url : '') || '';
        form.querySelector('#ni-admin-ws-recording').value = url || '';
      } catch {
        form.querySelector('#ni-admin-ws-recording').value = '';
      }
    }
    if (modalTitle) modalTitle.textContent = row ? 'Editar taller' : 'Nuevo taller';
    setStatus(formStatus, '', '');
    getModal(modalEl)?.show();
  }

  createBtn?.addEventListener('click', () => openForm(null));
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      state.page = 1;
      refresh();
    }, 280);
  });
  wireFilterChips(filterChips, 'data-ni-ws-status', (v) => {
    state.pubStatus = v;
    state.page = 1;
    refresh();
  });

  tbody.addEventListener('click', async (e) => {
    const editId = e.target.closest('[data-ni-admin-ws-edit]')?.getAttribute('data-ni-admin-ws-edit');
    const delId = e.target.closest('[data-ni-admin-ws-del]')?.getAttribute('data-ni-admin-ws-del');
    if (editId) {
      const row = state.rows.find((r) => r.id === editId);
      if (row) openForm(row);
      return;
    }
    if (delId) {
      if (!window.confirm('¿Eliminar este taller?')) return;
      const { error } = await deleteWorkshop(delId);
      if (error) {
        setStatus(statusEl, error.message || 'No se pudo eliminar.', 'error');
        return;
      }
      await refresh();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = form.querySelector('#ni-admin-ws-id').value.trim();
    const file = form.querySelector('#ni-admin-ws-image').files?.[0] || null;
    setStatus(formStatus, 'Guardando…', 'info');
    const existing = id ? state.rows.find((r) => r.id === id) : null;
    let image_url;
    let image_key;
    if (file) {
      const up = await uploadWorkshopImage(file, { previousKey: existing?.image_key || null });
      if (up.error) {
        setStatus(formStatus, up.error.message || 'Error al subir imagen.', 'error');
        return;
      }
      image_url = up.data?.url || null;
      image_key = up.data?.key || null;
    }
    const payload = {
      title: form.querySelector('#ni-admin-ws-title').value,
      short_description: form.querySelector('#ni-admin-ws-desc').value,
      speaker: form.querySelector('#ni-admin-ws-speaker').value,
      modality: form.querySelector('#ni-admin-ws-modality').value,
      starts_at: fromDatetimeLocalValue(form.querySelector('#ni-admin-ws-starts').value),
      ends_at: fromDatetimeLocalValue(form.querySelector('#ni-admin-ws-ends').value),
      location: form.querySelector('#ni-admin-ws-location').value,
      virtual_url: form.querySelector('#ni-admin-ws-virtual').value,
      required_membership_level: form.querySelector('#ni-admin-ws-level').value,
      capacity: form.querySelector('#ni-admin-ws-capacity').value,
      registration_deadline: fromDatetimeLocalValue(form.querySelector('#ni-admin-ws-deadline').value),
      status: form.querySelector('#ni-admin-ws-status').value,
      recording_url: form.querySelector('#ni-admin-ws-recording').value,
    };
    if (image_url !== undefined) {
      payload.image_url = image_url;
      payload.image_key = image_key;
    }
    const result = id ? await updateWorkshop(id, payload) : await createWorkshop(payload);
    if (result.error) {
      setStatus(formStatus, result.error.message || 'No se pudo guardar.', 'error');
      return;
    }
    getModal(modalEl)?.hide();
    await refresh();
  });

  refresh();
}

/** ---------- Recursos ---------- */
function bindResources() {
  const tbody = document.querySelector('#ni-admin-res-table tbody');
  const statusEl = document.getElementById('ni-admin-res-status');
  const pager = document.getElementById('ni-admin-res-pagination');
  const searchInput = document.getElementById('ni-admin-res-search');
  const filterChips = document.getElementById('ni-admin-res-filter-chips');
  const createBtn = document.getElementById('ni-admin-res-create');
  const modalEl = document.getElementById('ni-admin-res-modal');
  const form = document.getElementById('ni-admin-res-form');
  const formStatus = document.getElementById('ni-admin-res-form-status');
  const modalTitle = document.getElementById('ni-admin-res-modal-title');
  if (!tbody || !form) return;

  const state = { page: 1, search: '', category: '', rows: [] };
  let searchTimer = null;

  async function refresh() {
    setStatus(statusEl, 'Cargando recursos…', 'info');
    const { data, count, error } = await listResources({
      search: state.search,
      category: state.category,
      isAdmin: true,
      page: state.page,
      pageSize: PAGE_SIZE,
    });
    state.rows = data;
    tbody.innerHTML = '';
    if (error) {
      setStatus(statusEl, error.message || 'No se pudieron cargar recursos.', 'error');
      return;
    }
    if (!data.length) {
      setStatus(statusEl, 'No hay recursos con estos filtros.', 'empty');
      renderPagination(pager, { page: 1, totalPages: 1, onPage: () => {} });
      return;
    }
    setStatus(statusEl, '', '');
    for (const row of data) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(row.title || '—')}</td>
        <td>${escapeHtml(row.category || '—')}</td>
        <td>${escapeHtml(row.file_ext || '—')}</td>
        <td>${statusBadge(row.status)}</td>
        <td>${escapeHtml(formatDate(row.created_at))}</td>
        <td class="ni-admin-row-actions">
          <button type="button" class="tmp-btn btn-border btn-small" data-ni-admin-res-edit="${escapeHtml(row.id)}">Editar</button>
          <button type="button" class="ni-admin-btn ni-admin-btn--danger btn-small" data-ni-admin-res-del="${escapeHtml(row.id)}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    }
    const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
    renderPagination(pager, {
      page: state.page,
      totalPages,
      onPage: (p) => {
        state.page = p;
        refresh();
      },
    });
  }

  function openForm(row = null) {
    form.reset();
    form.querySelector('#ni-admin-res-id').value = row?.id || '';
    form.querySelector('#ni-admin-res-title').value = row?.title || '';
    form.querySelector('#ni-admin-res-desc').value = row?.description || '';
    form.querySelector('#ni-admin-res-category').value = row?.category || 'otros';
    form.querySelector('#ni-admin-res-level').value = String(row?.required_membership_level ?? 0);
    form.querySelector('#ni-admin-res-status').value = row?.status || 'draft';
    form.querySelector('#ni-admin-res-file').value = '';
    form.querySelector('#ni-admin-res-file').required = !row;
    if (modalTitle) modalTitle.textContent = row ? 'Editar recurso' : 'Nuevo recurso';
    setStatus(formStatus, '', '');
    getModal(modalEl)?.show();
  }

  createBtn?.addEventListener('click', () => openForm(null));
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      state.page = 1;
      refresh();
    }, 280);
  });
  wireFilterChips(filterChips, 'data-ni-res-category', (v) => {
    state.category = v;
    state.page = 1;
    refresh();
  });

  tbody.addEventListener('click', async (e) => {
    const editId = e.target.closest('[data-ni-admin-res-edit]')?.getAttribute('data-ni-admin-res-edit');
    const delId = e.target.closest('[data-ni-admin-res-del]')?.getAttribute('data-ni-admin-res-del');
    if (editId) {
      const row = state.rows.find((r) => r.id === editId);
      if (row) openForm(row);
      return;
    }
    if (delId) {
      if (!window.confirm('¿Eliminar este recurso?')) return;
      const { error } = await deleteResource(delId);
      if (error) {
        setStatus(statusEl, error.message || 'No se pudo eliminar.', 'error');
        return;
      }
      await refresh();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = form.querySelector('#ni-admin-res-id').value.trim();
    const file = form.querySelector('#ni-admin-res-file').files?.[0] || null;
    const existing = id ? state.rows.find((r) => r.id === id) : null;
    if (!id && !file) {
      setStatus(formStatus, 'Selecciona un archivo.', 'error');
      return;
    }
    setStatus(formStatus, 'Guardando…', 'info');
    let fileMeta = null;
    if (file) {
      const up = await uploadResourceFile(file, { previousKey: existing?.file_key || null });
      if (up.error) {
        setStatus(formStatus, up.error.message || 'Error al subir archivo.', 'error');
        return;
      }
      fileMeta = up.data;
    }
    const payload = {
      title: form.querySelector('#ni-admin-res-title').value,
      description: form.querySelector('#ni-admin-res-desc').value,
      category: form.querySelector('#ni-admin-res-category').value,
      required_membership_level: form.querySelector('#ni-admin-res-level').value,
      status: form.querySelector('#ni-admin-res-status').value,
    };
    if (fileMeta) {
      payload.file_key = fileMeta.key;
      payload.file_name = fileMeta.file_name;
      payload.file_ext = fileMeta.file_ext;
      payload.mime_type = fileMeta.mime_type;
      payload.size_bytes = fileMeta.size_bytes;
    }
    const result = id ? await updateResource(id, payload) : await createResource(payload);
    if (result.error) {
      setStatus(formStatus, result.error.message || 'No se pudo guardar.', 'error');
      return;
    }
    getModal(modalEl)?.hide();
    await refresh();
  });

  refresh();
}

function bindInterests() {
  const table = document.querySelector('#ni-admin-int-table tbody');
  const status = document.querySelector('#ni-admin-int-status');
  const pager = document.getElementById('ni-admin-int-pagination');
  const searchInput = document.getElementById('ni-admin-int-search');
  const filterChips = document.getElementById('ni-admin-int-filter-chips');
  const createBtn = document.querySelector('#ni-admin-int-create');
  const modalEl = document.querySelector('#ni-admin-int-modal');
  const form = document.querySelector('#ni-admin-int-form');
  const formStatus = document.querySelector('#ni-admin-int-form-status');
  const titleEl = document.querySelector('#ni-admin-int-modal-title');
  if (!table || !form) return;

  let allRows = [];
  let page = 1;
  let query = '';
  let primaryFilter = '';
  let slugTouched = false;
  let searchTimer = null;

  function filteredRows() {
    const q = query.trim().toLowerCase();
    return allRows.filter((row) => {
      if (primaryFilter === 'primary' && !row.is_primary) return false;
      if (primaryFilter === 'secondary' && row.is_primary) return false;
      if (!q) return true;
      const hay = `${row.label || ''} ${row.slug || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function paintPage() {
    const rows = filteredRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * PAGE_SIZE;
    const slice = rows.slice(start, start + PAGE_SIZE);
    if (!allRows.length) {
      setStatus(status, 'No hay intereses. Crea el primero.', 'info');
    } else if (!rows.length) {
      setStatus(status, 'No hay intereses con estos filtros.', 'empty');
    } else {
      setStatus(status, '', '');
    }
    table.innerHTML = slice
      .map(
        (row) => `
      <tr data-id="${escapeHtml(row.id)}">
        <td>${escapeHtml(row.label)}</td>
        <td><code>${escapeHtml(row.slug)}</code></td>
        <td>${row.is_primary ? 'Sí' : 'No'}</td>
        <td>
          <button type="button" class="tmp-btn btn-border btn-small" data-int-edit>Editar</button>
          <button type="button" class="tmp-btn btn-border btn-small" data-int-delete>Eliminar</button>
        </td>
      </tr>`,
      )
      .join('');
    renderPagination(pager, {
      page,
      totalPages: rows.length ? totalPages : 1,
      onPage: (next) => {
        page = next;
        paintPage();
      },
    });
  }

  async function refresh() {
    setStatus(status, 'Cargando…', 'info');
    const { interests, error } = await fetchInterestsCatalog();
    if (error) {
      setStatus(status, error.message || 'No se pudieron cargar los intereses.', 'error');
      table.innerHTML = '';
      if (pager) pager.innerHTML = '';
      return;
    }
    allRows = interests || [];
    paintPage();
  }

  function openModal(row = null) {
    slugTouched = Boolean(row?.slug);
    form.reset();
    setStatus(formStatus, '');
    form.id.value = row?.id || '';
    form.label.value = row?.label || '';
    form.slug.value = row?.slug || '';
    if (form.is_primary) form.is_primary.checked = Boolean(row?.is_primary);
    if (titleEl) titleEl.textContent = row ? 'Editar interés' : 'Nuevo interés';
    getModal(modalEl)?.show();
  }

  createBtn?.addEventListener('click', () => openModal(null));

  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      query = searchInput.value || '';
      page = 1;
      paintPage();
    }, 220);
  });

  wireFilterChips(filterChips, 'data-ni-int-filter', (v) => {
    primaryFilter = v;
    page = 1;
    paintPage();
  });

  form.label?.addEventListener('input', () => {
    if (slugTouched) return;
    form.slug.value = slugifyInterestLabel(form.label.value);
  });

  form.slug?.addEventListener('input', () => {
    slugTouched = true;
  });

  table.addEventListener('click', async (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const id = tr.getAttribute('data-id');
    const row = allRows.find((r) => r.id === id);
    if (!row) return;

    if (e.target.closest('[data-int-edit]')) {
      openModal(row);
      return;
    }
    if (e.target.closest('[data-int-delete]')) {
      if (!window.confirm(`¿Eliminar el interés "${row.label}"? Los estudiantes dejarán de tenerlo asignado.`)) {
        return;
      }
      const { error } = await deleteInterest(id);
      if (error) {
        setStatus(status, error.message || 'No se pudo eliminar.', 'error');
        return;
      }
      await refresh();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(formStatus, '');
    const id = form.id.value.trim();
    const maxOrder = allRows.reduce((max, r) => Math.max(max, Number(r.sort_order) || 0), 0);
    const payload = {
      label: form.label.value,
      slug: form.slug.value,
      is_primary: Boolean(form.is_primary?.checked),
    };
    if (!id) payload.sort_order = maxOrder + 10;
    const result = id ? await updateInterest(id, payload) : await createInterest(payload);
    if (result.error) {
      setStatus(formStatus, result.error.message || 'No se pudo guardar.', 'error');
      return;
    }
    getModal(modalEl)?.hide();
    await refresh();
  });

  refresh();
}

export function mountAdminContent() {
  bindAnnouncements();
  bindWorkshops();
  bindResources();
  bindInterests();
}
