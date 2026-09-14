import { getClient } from '../client.js';
import { rpcIsAdmin, rpcMembershipLevel } from '../identity.js';
import { registerModule } from './registry.js';

/**
 * Biblioteca de Recursos: listado, descarga gated, CRUD admin (modal).
 * file_key never selected for public list; download via Edge Function.
 */

const SEARCH_DEBOUNCE_MS = 300;
const FILE_BUCKET = 'resource-files';
const FILE_MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mp4']);

const PUBLIC_COLUMNS =
  'id,title,description,category,file_name,file_ext,mime_type,size_bytes,required_membership_level,download_count,status,created_by,created_at,updated_at';

const ADMIN_COLUMNS = `${PUBLIC_COLUMNS},file_key`;

const CATEGORY_LABELS = {
  comercio_internacional: 'Comercio Internacional',
  empleabilidad: 'Empleabilidad',
  logistica: 'Logística',
  finanzas: 'Finanzas',
  marketing: 'Marketing',
  tecnologia: 'Tecnología',
  otros: 'Otros',
};

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

function emptyToNull(s) {
  const t = String(s || '').trim();
  return t || null;
}

function loginWithReturn() {
  const next = encodeURIComponent(
    `${window.location.pathname.split('/').pop() || 'recursos.html'}${window.location.search}${window.location.hash}`,
  );
  window.location.href = `login.html?next=${next}`;
}

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function formatDownloads(count) {
  const n = Number(count) || 0;
  return `${n} descarga${n === 1 ? '' : 's'}`;
}

function extFromName(name) {
  const parts = String(name || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function normalizeExt(ext) {
  const e = String(ext || '').toLowerCase().replace(/^\./, '');
  if (e === 'doc') return 'docx';
  if (e === 'ppt') return 'pptx';
  if (e === 'xls') return 'xlsx';
  return e;
}

function iconMeta(ext) {
  const e = normalizeExt(ext);
  if (e === 'pdf') return { className: 'icon-pdf', feather: 'file-text', label: 'PDF' };
  if (e === 'docx') return { className: 'icon-docx', feather: 'file', label: 'DOCX' };
  if (e === 'pptx') return { className: 'icon-ppt', feather: 'monitor', label: 'PPTX' };
  if (e === 'xlsx') return { className: 'icon-excel', feather: 'grid', label: 'XLSX' };
  if (e === 'mp4') return { className: 'icon-video', feather: 'film', label: 'MP4' };
  return { className: '', feather: 'paperclip', label: (e || 'FILE').toUpperCase() };
}

function membershipBadge(level) {
  const n = Number(level) || 0;
  if (n >= 2) {
    return `<span class="resource-badge badge-ni-elite"><i class="feather-zap"></i> NI Elite</span>`;
  }
  if (n >= 1) {
    return `<span class="resource-badge badge-ni-pro"><i class="feather-star"></i> NI Pro</span>`;
  }
  return '';
}

function canDownload(userLevel, requiredLevel, loggedIn) {
  if (!loggedIn) return false;
  return (Number(userLevel) || 0) >= (Number(requiredLevel) || 0);
}

export async function listResources({
  category = '',
  search = '',
  pubStatus = '',
  isAdmin = false,
} = {}) {
  const insforge = getClient();
  const columns = isAdmin ? ADMIN_COLUMNS : PUBLIC_COLUMNS;

  let query = insforge.database
    .from('resources')
    .select(columns)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (isAdmin) {
    if (pubStatus === 'published' || pubStatus === 'draft') {
      query = query.eq('status', pubStatus);
    }
  } else {
    query = query.eq('status', 'published');
  }

  if (category) {
    query = query.eq('category', category);
  }

  const term = sanitizeSearchTerm(search);
  if (term) {
    const pattern = `"%${term.replace(/"/g, '')}%"`;
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  return query;
}

export async function uploadResourceFile(file, { previousKey = null } = {}) {
  const rawExt = String(extFromName(file.name)).toLowerCase();
  const ext = normalizeExt(rawExt);
  if (!ALLOWED_EXTS.has(rawExt) && !ALLOWED_EXTS.has(ext)) {
    return { data: null, error: new Error('Formato no permitido. Usa PDF, DOCX, PPTX, XLSX o MP4.') };
  }
  if (file.size > FILE_MAX_BYTES) {
    return { data: null, error: new Error('El archivo supera 50 MB.') };
  }

  const insforge = getClient();
  const { data, error } = await insforge.storage.from(FILE_BUCKET).uploadAuto(file);
  if (error) return { data: null, error };

  if (previousKey) {
    try {
      await insforge.storage.from(FILE_BUCKET).remove(previousKey);
    } catch {
      /* ignore */
    }
  }

  return {
    data: {
      key: data?.key || null,
      file_name: file.name,
      file_ext: normalizeExt(ext),
      mime_type: file.type || null,
      size_bytes: file.size,
    },
    error: null,
  };
}

export async function createResource(payload = {}) {
  const insforge = getClient();
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
  const uid = userData?.user?.id || null;
  if (userError || !uid) {
    return { data: null, error: userError || new Error('Debes iniciar sesión') };
  }

  const row = {
    title: String(payload.title || '').trim(),
    description: emptyToNull(payload.description),
    category: String(payload.category || '').trim(),
    file_key: payload.file_key,
    file_name: payload.file_name,
    file_ext: payload.file_ext,
    mime_type: payload.mime_type || null,
    size_bytes: Number(payload.size_bytes) || 0,
    required_membership_level: Number(payload.required_membership_level) || 0,
    status: payload.status === 'published' ? 'published' : 'draft',
    created_by: uid,
  };

  return insforge.database.from('resources').insert([row]).select(ADMIN_COLUMNS);
}

export async function updateResource(id, patch = {}) {
  const insforge = getClient();
  const allowed = {};
  const keys = [
    'title',
    'description',
    'category',
    'file_key',
    'file_name',
    'file_ext',
    'mime_type',
    'size_bytes',
    'required_membership_level',
    'status',
  ];
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(patch, k)) allowed[k] = patch[k];
  });
  if (Object.prototype.hasOwnProperty.call(allowed, 'description')) {
    allowed.description = emptyToNull(allowed.description);
  }
  if (Object.prototype.hasOwnProperty.call(allowed, 'status')) {
    allowed.status = allowed.status === 'published' ? 'published' : 'draft';
  }
  return insforge.database.from('resources').update(allowed).eq('id', id).select(ADMIN_COLUMNS);
}

export async function deleteResource(id) {
  const insforge = getClient();
  return insforge.database.from('resources').delete().eq('id', id);
}

export async function downloadResource(resourceId) {
  const insforge = getClient();
  return insforge.functions.invoke('download-resource', {
    body: { resourceId },
  });
}

function actionButtonHtml(item, { loggedIn, membershipLevel }) {
  const required = Number(item.required_membership_level) || 0;
  if (canDownload(membershipLevel, required, loggedIn)) {
    return `<button type="button" class="tmp-btn resource-btn-download" data-ni-res-download="${escapeAttr(item.id)}">
      <i class="feather-download"></i> Descargar
    </button>`;
  }
  if (!loggedIn) {
    return `<button type="button" class="tmp-btn resource-btn-locked" data-ni-res-login="${escapeAttr(item.id)}" style="cursor:pointer !important;">
      <i class="feather-lock"></i> Bloqueado
    </button>`;
  }
  return `<button type="button" class="tmp-btn resource-btn-locked" data-ni-res-upgrade="${escapeAttr(item.id)}" style="cursor:pointer !important;" title="Mejora tu membresía">
    <i class="feather-lock"></i> Bloqueado
  </button>`;
}

function renderCard(item, ctx) {
  const card = document.createElement('div');
  card.className = 'resource-card';
  card.dataset.resourceId = item.id;

  const icon = iconMeta(item.file_ext);
  const category = CATEGORY_LABELS[item.category] || item.category || 'Otros';
  const badge = membershipBadge(item.required_membership_level);
  const draftBadge =
    ctx.isAdmin && item.status === 'draft'
      ? `<span class="resource-badge" style="background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB;">Borrador</span>`
      : '';
  const adminActions = ctx.isAdmin
    ? `<div class="d-flex flex-wrap gap-2 mt--10">
        <button type="button" class="tmp-btn btn-border btn-small" data-ni-res-edit="${escapeAttr(item.id)}">Editar</button>
        <button type="button" class="tmp-btn btn-small" data-ni-res-delete="${escapeAttr(item.id)}" data-title="${escapeAttr(item.title || '')}" data-file-key="${escapeAttr(item.file_key || '')}">Eliminar</button>
      </div>`
    : '';

  card.innerHTML = `
    <div class="resource-card-left">
      <div class="resource-file-icon ${icon.className}" aria-hidden="true">
        <i class="feather-${icon.feather}"></i>
      </div>
      <div class="resource-content">
        <div class="resource-title-wrapper">
          <h3 class="resource-title">${escapeHtml(item.title || 'Sin título')}</h3>
          ${badge}
          ${draftBadge}
        </div>
        <div class="resource-meta">
          <span class="meta-category">${escapeHtml(category)}</span>
          <span class="meta-dot">•</span>
          <span>${escapeHtml(icon.label)}</span>
          <span class="meta-dot">•</span>
          <span>${escapeHtml(formatSize(item.size_bytes))}</span>
          <span class="meta-dot">•</span>
          <span data-ni-res-count="${escapeAttr(item.id)}">${escapeHtml(formatDownloads(item.download_count))}</span>
        </div>
        ${adminActions}
      </div>
    </div>
    <div class="resource-card-right">
      ${actionButtonHtml(item, ctx)}
    </div>
  `;
  return card;
}

function renderEmpty() {
  const el = document.createElement('div');
  el.className = 'resource-no-results';
  el.innerHTML = `
    <div class="no-results-icon"><i class="feather-inbox"></i></div>
    <div class="no-results-title">No se encontraron recursos</div>
    <p class="no-results-text">Prueba con otra búsqueda o categoría.</p>
  `;
  return el;
}

function getBootstrapModal(el) {
  const BS = window.bootstrap;
  if (!BS?.Modal || !el) return null;
  return BS.Modal.getOrCreateInstance(el);
}

function readFormPayload(form) {
  const fd = new FormData(form);
  return {
    id: String(fd.get('id') || '').trim(),
    title: String(fd.get('title') || '').trim(),
    description: String(fd.get('description') || '').trim(),
    category: String(fd.get('category') || '').trim(),
    required_membership_level: Number(fd.get('required_membership_level')),
    status: String(fd.get('status') || 'draft'),
  };
}

function fillForm(form, item) {
  form.querySelector('#ni-res-id').value = item?.id || '';
  form.querySelector('#ni-res-title').value = item?.title || '';
  form.querySelector('#ni-res-desc').value = item?.description || '';
  form.querySelector('#ni-res-category').value = item?.category || 'otros';
  form.querySelector('#ni-res-level').value = String(item?.required_membership_level ?? 0);
  form.querySelector('#ni-res-status').value = item?.status === 'published' ? 'published' : 'draft';
  const fileInput = form.querySelector('#ni-res-file');
  if (fileInput) fileInput.value = '';
  const hint = form.querySelector('#ni-res-file-hint');
  if (hint && item?.file_name) {
    hint.textContent = `Archivo actual: ${item.file_name}. Déjalo vacío para conservarlo.`;
  } else if (hint) {
    hint.textContent = 'Al crear es obligatorio. Al editar, déjalo vacío para conservar el archivo actual.';
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

function refreshIcons(root) {
  try {
    if (window.feather?.replace) window.feather.replace({ root: root || document });
  } catch {
    /* ignore */
  }
}

function createController() {
  const listEl = document.getElementById('resource-list');
  const statusEl = document.getElementById('ni-recursos-status');
  const createBtn = document.getElementById('ni-recursos-admin-create');
  const pubWrap = document.getElementById('ni-recursos-pub-wrap');
  const modalEl = document.getElementById('ni-recursos-modal');
  const modalTitle = document.getElementById('ni-recursos-modal-title');
  const form = document.getElementById('ni-recursos-form');
  const formStatus = document.getElementById('ni-recursos-form-status');
  const searchInput = document.getElementById('ni-recursos-search');
  const categorySelect = document.getElementById('ni-recursos-category');
  const fileInput = document.getElementById('ni-res-file');

  const state = {
    category: '',
    pubStatus: '',
    search: '',
    isAdmin: false,
    loggedIn: false,
    membershipLevel: 0,
    itemsById: new Map(),
    pendingFile: null,
    editingFileKey: null,
  };

  let searchTimer = null;

  async function refresh() {
    if (!listEl) return;
    setStatus(statusEl, 'Cargando recursos…', 'info');
    const { data, error } = await listResources({
      category: state.category,
      search: state.search,
      pubStatus: state.pubStatus,
      isAdmin: state.isAdmin,
    });

    if (error) {
      listEl.innerHTML = '';
      setStatus(statusEl, error.message || 'No se pudieron cargar los recursos.', 'error');
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    state.itemsById = new Map(rows.map((row) => [row.id, row]));
    listEl.innerHTML = '';

    if (!rows.length) {
      listEl.appendChild(renderEmpty());
      setStatus(statusEl, '', '');
    } else {
      setStatus(statusEl, '', '');
      rows.forEach((item) =>
        listEl.appendChild(
          renderCard(item, {
            isAdmin: state.isAdmin,
            loggedIn: state.loggedIn,
            membershipLevel: state.membershipLevel,
          }),
        ),
      );
    }
    refreshIcons(listEl);
  }

  async function openModal(mode, item = null) {
    if (!form || !modalEl) return;
    setStatus(formStatus, '', '');
    state.pendingFile = null;
    state.editingFileKey = item?.file_key || null;

    if (mode === 'edit' && item) {
      if (modalTitle) modalTitle.textContent = 'Editar recurso';
      // Admin may need file_key; if missing from cache, re-fetch with admin columns
      let full = item;
      if (!item.file_key && state.isAdmin) {
        const { data } = await getClient()
          .database.from('resources')
          .select(ADMIN_COLUMNS)
          .eq('id', item.id)
          .maybeSingle();
        if (data) full = data;
      }
      fillForm(form, full);
      state.editingFileKey = full.file_key || null;
    } else {
      if (modalTitle) modalTitle.textContent = 'Crear recurso';
      form.reset();
      fillForm(form, {
        category: 'otros',
        required_membership_level: 0,
        status: 'draft',
      });
      form.querySelector('#ni-res-id').value = '';
      state.editingFileKey = null;
    }
    getBootstrapModal(modalEl)?.show();
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      state.pendingFile = fileInput.files?.[0] || null;
    });
  }

  if (createBtn) {
    createBtn.addEventListener('click', () => openModal('create'));
  }

  if (listEl) {
    listEl.addEventListener('click', async (e) => {
      const loginBtn = e.target.closest('[data-ni-res-login]');
      const upgradeBtn = e.target.closest('[data-ni-res-upgrade]');
      const downloadBtn = e.target.closest('[data-ni-res-download]');
      const editBtn = e.target.closest('[data-ni-res-edit]');
      const delBtn = e.target.closest('[data-ni-res-delete]');

      if (loginBtn) {
        loginWithReturn();
        return;
      }

      if (upgradeBtn) {
        window.location.href = 'pricing-three-white.html';
        return;
      }

      if (downloadBtn) {
        const id = downloadBtn.getAttribute('data-ni-res-download');
        if (!state.loggedIn) {
          loginWithReturn();
          return;
        }
        downloadBtn.disabled = true;
        setStatus(statusEl, 'Preparando descarga…', 'info');
        const { data, error } = await downloadResource(id);
        downloadBtn.disabled = false;
        if (error) {
          setStatus(statusEl, error.message || 'No se pudo descargar.', 'error');
          return;
        }
        const payload = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return null; } })() : data;
        if (payload?.error && !payload?.signedUrl) {
          setStatus(statusEl, payload.error, 'error');
          return;
        }
        if (!payload?.signedUrl) {
          setStatus(statusEl, 'No se recibió el enlace de descarga.', 'error');
          return;
        }
        const a = document.createElement('a');
        a.href = payload.signedUrl;
        a.download = payload.fileName || 'recurso';
        a.rel = 'noopener';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (typeof payload.downloadCount === 'number') {
          const countEl = listEl.querySelector(`[data-ni-res-count="${CSS.escape(id)}"]`);
          if (countEl) countEl.textContent = formatDownloads(payload.downloadCount);
          const cached = state.itemsById.get(id);
          if (cached) cached.download_count = payload.downloadCount;
        }
        setStatus(statusEl, 'Descarga iniciada.', 'ok');
        return;
      }

      if (editBtn) {
        const id = editBtn.getAttribute('data-ni-res-edit');
        const item = state.itemsById.get(id);
        if (item) openModal('edit', item);
        return;
      }

      if (delBtn) {
        const id = delBtn.getAttribute('data-ni-res-delete');
        const title = delBtn.getAttribute('data-title') || 'este recurso';
        const fileKey = delBtn.getAttribute('data-file-key') || '';
        if (!window.confirm(`¿Eliminar «${title}»? Esta acción no se puede deshacer.`)) return;
        setStatus(statusEl, 'Eliminando…', 'info');
        const { error } = await deleteResource(id);
        if (error) {
          setStatus(statusEl, error.message || 'No se pudo eliminar.', 'error');
          return;
        }
        if (fileKey) {
          try {
            await getClient().storage.from(FILE_BUCKET).remove(fileKey);
          } catch {
            /* ignore */
          }
        }
        await refresh();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = readFormPayload(form);
      if (!payload.title) {
        setStatus(formStatus, 'El título es obligatorio.', 'error');
        return;
      }
      if (!CATEGORY_LABELS[payload.category]) {
        setStatus(formStatus, 'Categoría inválida.', 'error');
        return;
      }
      if (![0, 1, 2].includes(payload.required_membership_level)) {
        setStatus(formStatus, 'Nivel de membresía inválido.', 'error');
        return;
      }

      const isCreate = !payload.id;
      if (isCreate && !state.pendingFile) {
        setStatus(formStatus, 'Debes adjuntar un archivo.', 'error');
        return;
      }

      const submitBtn = document.getElementById('ni-recursos-form-submit');
      if (submitBtn) submitBtn.disabled = true;
      setStatus(formStatus, 'Guardando…', 'info');

      if (state.pendingFile) {
        const up = await uploadResourceFile(state.pendingFile, {
          previousKey: state.editingFileKey,
        });
        if (up.error) {
          if (submitBtn) submitBtn.disabled = false;
          setStatus(formStatus, up.error.message || 'Error al subir el archivo.', 'error');
          return;
        }
        payload.file_key = up.data.key;
        payload.file_name = up.data.file_name;
        payload.file_ext = up.data.file_ext;
        payload.mime_type = up.data.mime_type;
        payload.size_bytes = up.data.size_bytes;
      } else if (payload.id) {
        const existing = state.itemsById.get(payload.id);
        payload.file_key = existing?.file_key;
        payload.file_name = existing?.file_name;
        payload.file_ext = existing?.file_ext;
        payload.mime_type = existing?.mime_type;
        payload.size_bytes = existing?.size_bytes;
      }

      let result;
      if (payload.id) {
        const { id, ...patch } = payload;
        result = await updateResource(id, patch);
      } else {
        result = await createResource(payload);
      }

      if (submitBtn) submitBtn.disabled = false;
      if (result.error) {
        setStatus(formStatus, result.error.message || 'No se pudo guardar.', 'error');
        return;
      }

      setStatus(formStatus, 'Recurso guardado.', 'ok');
      getBootstrapModal(modalEl)?.hide();
      await refresh();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = searchInput.value;
        refresh();
      }, SEARCH_DEBOUNCE_MS);
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      state.category = categorySelect.value || '';
      refresh();
    });
  }

  wireFilterGroup(document.getElementById('ni-recursos-pub'), 'data-ni-pub', (v) => {
    state.pubStatus = v;
    refresh();
  });

  return {
    async init() {
      const insforge = getClient();
      const { data: userData } = await insforge.auth.getCurrentUser();
      state.loggedIn = !!userData?.user;

      const { data: adminData, error: adminError } = await rpcIsAdmin();
      if (adminError) {
        state.isAdmin = false;
      } else {
        const row = Array.isArray(adminData) ? adminData[0] : adminData;
        state.isAdmin = adminData === true || row === true;
      }

      if (state.loggedIn) {
        const { data: lvl } = await rpcMembershipLevel();
        const n = Array.isArray(lvl) ? lvl[0] : lvl;
        state.membershipLevel = typeof n === 'number' ? n : Number(n) || 0;
      }

      if (createBtn) createBtn.hidden = !state.isAdmin;
      if (pubWrap) pubWrap.hidden = !state.isAdmin;
      await refresh();
    },
  };
}

registerModule('recursos', {
  pages: ['recursos'],
  async mount({ hook }) {
    const controller = createController();
    await controller.init();
    if (hook) hook.setAttribute('data-ni-ready', '1');
  },
});

export {};
