import { getClient } from '../client.js';
import { rpcIsAdmin, rpcMembershipLevel } from '../identity.js';
import { registerModule } from './registry.js';
import { showCatalogLoading, clearCatalogLoading, ensureCatalogLoadingStyles } from '../catalog-loading.js';

/**
 * Talleres: listado, CRUD admin (modal), inscripción y grabaciones gated.
 * recording_url never selected from workshops — only via get_workshop_recording_access RPC.
 */

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 300;
const IMAGE_BUCKET = 'workshop-images';
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const COLUMNS =
  'id,title,short_description,speaker,starts_at,ends_at,modality,location,virtual_url,required_membership_level,capacity,registration_deadline,status,image_url,image_key,has_recording,created_by,created_at,updated_at';

const MODALITY_LABELS = {
  virtual: 'Virtual',
  presencial: 'Presencial',
  hibrido: 'Híbrido',
};

const TEMPORAL_LABELS = {
  upcoming: 'Próximo',
  live: 'Disponible',
  ended: 'Finalizado',
};

const TEMPORAL_PILL_CLASS = {
  upcoming: 'ni-catalog-pill--upcoming',
  live: 'ni-catalog-pill--live',
  ended: 'ni-catalog-pill--ended',
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

function formatDateTime(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 16);
  }
}

function formatDateShort(iso) {
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

function formatDuration(startsAt, endsAt) {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return '';
  const hours = Math.round(((end - start) / 3600000) * 10) / 10;
  if (hours === 1) return '1 hora';
  return `${hours} horas`;
}

function truncate(text, max = 140) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

function refreshIcons(root) {
  try {
    if (window.feather?.replace) window.feather.replace({ root: root || document });
  } catch {
    /* ignore */
  }
}

function renderEmpty({ filtered = false } = {}) {
  const col = document.createElement('div');
  col.className = 'col-12';
  col.innerHTML = `
    <div class="resource-no-results">
      <div class="no-results-icon"><i class="feather-inbox"></i></div>
      <div class="no-results-title">No se encontraron talleres</div>
      <p class="no-results-text">${
        filtered
          ? 'Prueba con otra búsqueda o filtro.'
          : 'Aún no hay talleres publicados.'
      }</p>
    </div>
  `;
  return col;
}

export function temporalStatus(item, now = new Date()) {
  const start = new Date(item.starts_at).getTime();
  const end = new Date(item.ends_at).getTime();
  const t = now.getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 'upcoming';
  if (t < start) return 'upcoming';
  if (t > end) return 'ended';
  return 'live';
}

function registrationOpen(item, now = new Date()) {
  if (item.status !== 'published') return false;
  const deadline = new Date(item.registration_deadline).getTime();
  return !Number.isNaN(deadline) && now.getTime() <= deadline;
}

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function emptyToNull(s) {
  const t = String(s || '').trim();
  return t || null;
}

function loginWithReturn() {
  const next = encodeURIComponent(
    `${window.location.pathname.split('/').pop() || 'talleres.html'}${window.location.search}${window.location.hash}`,
  );
  window.location.href = `login.html?next=${next}`;
}

export async function listWorkshops({
  modality = '',
  level = '',
  temporal = '',
  pubStatus = '',
  search = '',
  page = 1,
  pageSize = PAGE_SIZE,
  isAdmin = false,
} = {}) {
  const insforge = getClient();
  const safePage = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || PAGE_SIZE);
  const from = (safePage - 1) * size;
  const to = from + size - 1;
  const nowIso = new Date().toISOString();

  let query = insforge.database
    .from('workshops')
    .select(COLUMNS, { count: 'exact' })
    .order('starts_at', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to);

  if (isAdmin) {
    if (pubStatus === 'published' || pubStatus === 'draft') {
      query = query.eq('status', pubStatus);
    }
  } else {
    query = query.eq('status', 'published');
  }

  if (modality) query = query.eq('modality', modality);
  if (level !== '' && level !== null && level !== undefined) {
    query = query.eq('required_membership_level', Number(level));
  }

  if (temporal === 'upcoming') query = query.gt('starts_at', nowIso);
  else if (temporal === 'live') query = query.lte('starts_at', nowIso).gte('ends_at', nowIso);
  else if (temporal === 'ended') query = query.lt('ends_at', nowIso);

  const term = sanitizeSearchTerm(search);
  if (term) {
    const pattern = `"%${term.replace(/"/g, '')}%"`;
    query = query.or(`title.ilike.${pattern},speaker.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  return {
    data: Array.isArray(data) ? data : [],
    count: typeof count === 'number' ? count : 0,
    error: error || null,
  };
}

export async function fetchEnrollmentStats(ids) {
  if (!ids?.length) return { data: [], error: null };
  const insforge = getClient();
  return insforge.database.rpc('get_workshop_enrollment_stats', { p_ids: ids });
}

export async function enrollInWorkshop(workshopId) {
  const insforge = getClient();
  return insforge.database.rpc('enroll_in_workshop', { p_workshop_id: workshopId });
}

export async function getRecordingAccess(workshopId) {
  const insforge = getClient();
  return insforge.database.rpc('get_workshop_recording_access', { p_workshop_id: workshopId });
}

export async function setWorkshopRecording(workshopId, url) {
  const insforge = getClient();
  return insforge.database.rpc('set_workshop_recording', {
    p_workshop_id: workshopId,
    p_url: url || '',
  });
}

export async function getWorkshopRecordingAdmin(workshopId) {
  const insforge = getClient();
  return insforge.database.rpc('get_workshop_recording_admin', { p_workshop_id: workshopId });
}

export async function uploadWorkshopImage(file, { previousKey = null } = {}) {
  if (!IMAGE_TYPES.includes(file.type)) {
    return { data: null, error: new Error('Formato inválido. Usa JPEG, PNG o WebP.') };
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return { data: null, error: new Error('La imagen supera 2 MB.') };
  }
  const insforge = getClient();
  const { data, error } = await insforge.storage.from(IMAGE_BUCKET).uploadAuto(file);
  if (error) return { data: null, error };
  if (previousKey) {
    try {
      await insforge.storage.from(IMAGE_BUCKET).remove(previousKey);
    } catch {
      /* ignore */
    }
  }
  return {
    data: { url: data?.url || null, key: data?.key || null },
    error: null,
  };
}

export async function createWorkshop(payload = {}) {
  const insforge = getClient();
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
  const uid = userData?.user?.id || null;
  if (userError || !uid) {
    return { data: null, error: userError || new Error('Debes iniciar sesión') };
  }

  const row = {
    title: String(payload.title || '').trim(),
    short_description: String(payload.short_description || '').trim(),
    speaker: String(payload.speaker || '').trim(),
    starts_at: payload.starts_at,
    ends_at: payload.ends_at,
    modality: String(payload.modality || '').trim(),
    location: emptyToNull(payload.location),
    virtual_url: emptyToNull(payload.virtual_url),
    required_membership_level: Number(payload.required_membership_level) || 0,
    capacity: Number(payload.capacity) || 0,
    registration_deadline: payload.registration_deadline,
    status: payload.status === 'published' ? 'published' : 'draft',
    image_url: payload.image_url || null,
    image_key: payload.image_key || null,
    created_by: uid,
  };

  const { data, error } = await insforge.database.from('workshops').insert([row]).select(COLUMNS);
  if (error) return { data: null, error };
  const created = Array.isArray(data) ? data[0] : data;
  if (created?.id && Object.prototype.hasOwnProperty.call(payload, 'recording_url')) {
    await setWorkshopRecording(created.id, payload.recording_url || '');
  }
  return { data, error: null };
}

export async function updateWorkshop(id, patch = {}) {
  const insforge = getClient();
  const allowed = {};
  const keys = [
    'title',
    'short_description',
    'speaker',
    'starts_at',
    'ends_at',
    'modality',
    'location',
    'virtual_url',
    'required_membership_level',
    'capacity',
    'registration_deadline',
    'status',
    'image_url',
    'image_key',
  ];
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    if (key === 'location' || key === 'virtual_url' || key === 'image_url' || key === 'image_key') {
      allowed[key] = emptyToNull(patch[key]);
    } else if (key === 'required_membership_level' || key === 'capacity') {
      allowed[key] = Number(patch[key]);
    } else if (key === 'status') {
      allowed[key] = patch[key] === 'published' ? 'published' : 'draft';
    } else {
      allowed[key] = patch[key];
    }
  }
  const { data, error } = await insforge.database
    .from('workshops')
    .update(allowed)
    .eq('id', id)
    .select(COLUMNS);
  if (error) return { data: null, error };
  if (Object.prototype.hasOwnProperty.call(patch, 'recording_url')) {
    await setWorkshopRecording(id, patch.recording_url || '');
  }
  return { data, error: null };
}

export async function deleteWorkshop(id) {
  const insforge = getClient();
  return insforge.database.from('workshops').delete().eq('id', id);
}

function recordingButtonHtml(item) {
  const temp = temporalStatus(item);
  if (temp !== 'ended') return '';
  if (!item.has_recording) {
    return `<button type="button" class="ni-catalog-btn ni-catalog-btn--locked" disabled>
      <i class="feather-lock"></i> Grabación
    </button>`;
  }
  return `
    <button type="button" class="ni-catalog-btn ni-catalog-btn--recording" data-ni-ws-recording="${escapeAttr(item.id)}">
      <i class="feather-play"></i> Grabación
    </button>
    <button type="button" class="ni-catalog-btn ni-catalog-btn--icon" data-ni-ws-recording="${escapeAttr(item.id)}" aria-label="Descargar grabación" title="Abrir grabación">
      <i class="feather-download"></i>
    </button>
  `;
}

function primaryActionHtml(item, stats, { loggedIn, membershipLevel }) {
  const temp = temporalStatus(item);
  if (temp === 'ended') {
    return recordingButtonHtml(item);
  }

  if (item.status !== 'published') {
    return `<button type="button" class="ni-catalog-btn ni-catalog-btn--locked" disabled>Borrador</button>`;
  }

  const required = Number(item.required_membership_level) || 0;
  const userLevel = Number(membershipLevel) || 0;
  if (userLevel < required) {
    if (!loggedIn) {
      return `<button type="button" class="ni-catalog-btn ni-catalog-btn--locked" data-ni-ws-enroll-login="${escapeAttr(item.id)}" style="cursor:pointer;">
        <i class="feather-lock"></i> Bloqueado
      </button>`;
    }
    return `<a class="ni-catalog-btn ni-catalog-btn--locked" href="pricing-three-white.html">
      <i class="feather-lock"></i> Bloqueado
    </a>`;
  }

  const enrolled = !!stats?.i_am_enrolled;
  const taken = Number(stats?.seats_taken || 0);
  const full = taken >= Number(item.capacity || 0);
  const open = registrationOpen(item);

  if (enrolled) {
    return `<button type="button" class="ni-catalog-btn ni-catalog-btn--primary" disabled>Inscrito</button>`;
  }
  if (!open) {
    return `<button type="button" class="ni-catalog-btn ni-catalog-btn--locked" disabled>Inscripción cerrada</button>`;
  }
  if (full) {
    return `<button type="button" class="ni-catalog-btn ni-catalog-btn--locked" disabled>Sin cupos</button>`;
  }
  if (!loggedIn) {
    return `<button type="button" class="ni-catalog-btn ni-catalog-btn--primary" data-ni-ws-enroll-login="${escapeAttr(item.id)}">Inscribirse</button>`;
  }
  return `<button type="button" class="ni-catalog-btn ni-catalog-btn--primary" data-ni-ws-enroll="${escapeAttr(item.id)}">Inscribirse</button>`;
}

function renderCard(item, { isAdmin = false, loggedIn = false, stats = null, membershipLevel = 0 } = {}) {
  const col = document.createElement('div');
  col.className = 'col-lg-4 col-md-6';

  const temp = temporalStatus(item);
  const tempLabel = TEMPORAL_LABELS[temp] || temp;
  const tempClass = TEMPORAL_PILL_CLASS[temp] || '';
  const modality = MODALITY_LABELS[item.modality] || item.modality || '';
  const required = Number(item.required_membership_level) || 0;
  const lockedByMembership = (Number(membershipLevel) || 0) < required;
  const lockLabel =
    required >= 2 ? 'NI Elite requerido' : required >= 1 ? 'NI Pro requerido' : '';
  const title = escapeHtml(item.title || 'Sin título');
  const desc = escapeHtml(truncate(item.short_description || ''));
  const speaker = escapeHtml(item.speaker || '');
  const dateStr = formatDateShort(item.starts_at);
  const duration = formatDuration(item.starts_at, item.ends_at);
  const imageUrl = String(item.image_url || '').trim();
  const media = imageUrl
    ? `<img src="${escapeAttr(imageUrl)}" alt="${title}" loading="lazy">`
    : `<div class="ni-catalog-card__media-placeholder"><i class="feather-calendar"></i></div>`;

  const draftBadge =
    isAdmin && item.status === 'draft'
      ? `<span class="ni-catalog-pill" style="background:#F3F4F6;color:#6B7280;">Borrador</span>`
      : '';

  const lockOverlay =
    lockedByMembership && lockLabel
      ? `<div class="ni-catalog-card__lock">
          <span class="ni-catalog-card__lock-badge"><i class="feather-lock"></i> ${escapeHtml(lockLabel)}</span>
        </div>`
      : '';

  const adminActions = isAdmin
    ? `<div class="ni-catalog-card__admin">
        <button type="button" class="tmp-btn btn-border btn-small" data-ni-ws-edit="${escapeAttr(item.id)}">Editar</button>
        <button type="button" class="tmp-btn btn-small" data-ni-ws-delete="${escapeAttr(item.id)}" data-title="${escapeAttr(item.title || '')}" data-image-key="${escapeAttr(item.image_key || '')}">Eliminar</button>
      </div>`
    : '';

  col.innerHTML = `
    <article class="ni-catalog-card">
      <div class="ni-catalog-card__media">
        ${media}
        ${lockOverlay}
        <div class="ni-catalog-card__badges">
          <span class="ni-catalog-pill ${tempClass}">${escapeHtml(tempLabel)}</span>
          <span class="ni-catalog-pill ni-catalog-pill--modality">${escapeHtml(modality)}</span>
          ${draftBadge}
        </div>
      </div>
      <div class="ni-catalog-card__body">
        <h3 class="ni-catalog-card__title">${title}</h3>
        ${speaker ? `<p class="ni-catalog-card__speaker">${speaker}</p>` : ''}
        <div class="ni-catalog-card__meta">
          ${dateStr ? `<span><i class="feather-calendar"></i>${escapeHtml(dateStr)}</span>` : ''}
          ${duration ? `<span><i class="feather-clock"></i>${escapeHtml(duration)}</span>` : ''}
        </div>
        <p class="ni-catalog-card__desc">${desc}</p>
        <div class="ni-catalog-card__actions">
          ${primaryActionHtml(item, stats, { loggedIn, membershipLevel })}
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

function readFormPayload(form) {
  const fd = new FormData(form);
  return {
    id: String(fd.get('id') || '').trim(),
    title: String(fd.get('title') || '').trim(),
    short_description: String(fd.get('short_description') || '').trim(),
    speaker: String(fd.get('speaker') || '').trim(),
    modality: String(fd.get('modality') || '').trim(),
    starts_at: fromLocalInputValue(fd.get('starts_at')),
    ends_at: fromLocalInputValue(fd.get('ends_at')),
    location: String(fd.get('location') || '').trim(),
    virtual_url: String(fd.get('virtual_url') || '').trim(),
    required_membership_level: Number(fd.get('required_membership_level')),
    capacity: Number(fd.get('capacity')),
    registration_deadline: fromLocalInputValue(fd.get('registration_deadline')),
    recording_url: String(fd.get('recording_url') || '').trim(),
    status: String(fd.get('status') || 'draft'),
  };
}

function fillForm(form, item) {
  form.querySelector('#ni-ws-id').value = item?.id || '';
  form.querySelector('#ni-ws-title').value = item?.title || '';
  form.querySelector('#ni-ws-desc').value = item?.short_description || '';
  form.querySelector('#ni-ws-speaker').value = item?.speaker || '';
  form.querySelector('#ni-ws-modality').value = item?.modality || 'virtual';
  form.querySelector('#ni-ws-starts').value = toLocalInputValue(item?.starts_at);
  form.querySelector('#ni-ws-ends').value = toLocalInputValue(item?.ends_at);
  form.querySelector('#ni-ws-location').value = item?.location || '';
  form.querySelector('#ni-ws-virtual').value = item?.virtual_url || '';
  form.querySelector('#ni-ws-level').value = String(item?.required_membership_level ?? 0);
  form.querySelector('#ni-ws-capacity').value = String(item?.capacity ?? 30);
  form.querySelector('#ni-ws-deadline').value = toLocalInputValue(item?.registration_deadline);
  form.querySelector('#ni-ws-recording').value = item?.recording_url || '';
  form.querySelector('#ni-ws-status').value = item?.status === 'published' ? 'published' : 'draft';
  const preview = form.querySelector('#ni-ws-image-preview');
  const fileInput = form.querySelector('#ni-ws-image');
  if (fileInput) fileInput.value = '';
  if (preview) {
    if (item?.image_url) {
      preview.src = item.image_url;
      preview.hidden = false;
    } else {
      preview.removeAttribute('src');
      preview.hidden = true;
    }
  }
}

function getBootstrapModal(el) {
  const BS = window.bootstrap;
  if (!BS?.Modal || !el) return null;
  return BS.Modal.getOrCreateInstance(el);
}

function recordingAccessMessage(access) {
  switch (access) {
    case 'unauthenticated':
      return 'Inicia sesión para ver la grabación.';
    case 'locked_no_recording':
      return 'Grabación bloqueada: aún no hay URL disponible.';
    case 'locked_not_enrolled':
      return 'Grabación bloqueada: debes estar inscrito.';
    case 'locked_membership':
      return 'Grabación bloqueada: tu membresía no es suficiente.';
    case 'not_ended':
      return 'La grabación estará disponible cuando finalice el taller.';
    case 'enabled':
      return '';
    default:
      return 'No se pudo acceder a la grabación.';
  }
}

function createController() {
  const listEl = document.getElementById('ni-talleres-list');
  const paginationEl = document.getElementById('ni-talleres-pagination');
  const statusEl = document.getElementById('ni-talleres-status');
  const createBtn = document.getElementById('ni-talleres-admin-create');
  const pubWrap = document.getElementById('ni-talleres-pub-wrap');
  const modalEl = document.getElementById('ni-talleres-modal');
  const modalTitle = document.getElementById('ni-talleres-modal-title');
  const form = document.getElementById('ni-talleres-form');
  const formStatus = document.getElementById('ni-talleres-form-status');
  const searchInput = document.getElementById('ni-talleres-search');
  const imageInput = document.getElementById('ni-ws-image');
  const imagePreview = document.getElementById('ni-ws-image-preview');

  const state = {
    page: 1,
    modality: '',
    level: '',
    temporal: '',
    pubStatus: '',
    search: '',
    isAdmin: false,
    loggedIn: false,
    membershipLevel: 0,
    itemsById: new Map(),
    statsById: new Map(),
    pendingImageFile: null,
    editingImageKey: null,
  };

  let searchTimer = null;

  async function refresh() {
    if (!listEl) return;
    showCatalogLoading(listEl, { count: 6, variant: 'cards' });
    setStatus(statusEl, 'Cargando talleres…', 'info');
    const { data, count, error } = await listWorkshops({
      modality: state.modality,
      level: state.level,
      temporal: state.temporal,
      pubStatus: state.pubStatus,
      search: state.search,
      page: state.page,
      pageSize: PAGE_SIZE,
      isAdmin: state.isAdmin,
    });

    if (error) {
      clearCatalogLoading(listEl);
      listEl.innerHTML = '';
      setStatus(statusEl, error.message || 'No se pudieron cargar los talleres.', 'error');
      return;
    }

    const ids = data.map((r) => r.id);
    const { data: statsRaw } = await fetchEnrollmentStats(ids);
    const statsRows = Array.isArray(statsRaw) ? statsRaw : [];
    state.statsById = new Map(statsRows.map((s) => [s.workshop_id, s]));
    state.itemsById = new Map(data.map((row) => [row.id, row]));

    clearCatalogLoading(listEl);
    listEl.innerHTML = '';
    if (!data.length) {
      setStatus(statusEl, '', '');
      listEl.appendChild(
        renderEmpty({
          filtered: Boolean(state.search || state.temporal || state.pubStatus || state.modality || state.level),
        }),
      );
    } else {
      setStatus(statusEl, '', '');
      data.forEach((item) =>
        listEl.appendChild(
          renderCard(item, {
            isAdmin: state.isAdmin,
            loggedIn: state.loggedIn,
            stats: state.statsById.get(item.id),
            membershipLevel: state.membershipLevel,
          }),
        ),
      );
    }
    refreshIcons(listEl);

    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    if (state.page > totalPages) {
      state.page = totalPages;
      return refresh();
    }
    renderPagination(paginationEl, {
      page: state.page,
      totalPages: count > PAGE_SIZE ? totalPages : 1,
      onPage: (p) => {
        state.page = p;
        refresh();
      },
    });
  }

  async function openModal(mode, item = null) {
    if (!form || !modalEl) return;
    setStatus(formStatus, '', '');
    state.pendingImageFile = null;
    state.editingImageKey = item?.image_key || null;

    if (mode === 'edit' && item) {
      if (modalTitle) modalTitle.textContent = 'Editar taller';
      let recordingUrl = '';
      const { data: rec } = await getWorkshopRecordingAdmin(item.id);
      recordingUrl = typeof rec === 'string' ? rec : rec || '';
      fillForm(form, { ...item, recording_url: recordingUrl });
    } else {
      if (modalTitle) modalTitle.textContent = 'Crear taller';
      form.reset();
      fillForm(form, {
        capacity: 30,
        modality: 'virtual',
        required_membership_level: 0,
        status: 'draft',
      });
      form.querySelector('#ni-ws-id').value = '';
      state.editingImageKey = null;
    }
    getBootstrapModal(modalEl)?.show();
  }

  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const file = imageInput.files?.[0] || null;
      state.pendingImageFile = file;
      if (file && imagePreview) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.hidden = false;
      }
    });
  }

  if (createBtn) {
    createBtn.addEventListener('click', () => openModal('create'));
  }

  if (listEl) {
    listEl.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-ni-ws-edit]');
      const delBtn = e.target.closest('[data-ni-ws-delete]');
      const enrollBtn = e.target.closest('[data-ni-ws-enroll]');
      const enrollLogin = e.target.closest('[data-ni-ws-enroll-login]');
      const recBtn = e.target.closest('[data-ni-ws-recording]');

      if (enrollLogin) {
        loginWithReturn();
        return;
      }

      if (enrollBtn) {
        const id = enrollBtn.getAttribute('data-ni-ws-enroll');
        enrollBtn.disabled = true;
        const { error } = await enrollInWorkshop(id);
        if (error) {
          setStatus(statusEl, error.message || 'No se pudo inscribir.', 'error');
          enrollBtn.disabled = false;
          return;
        }
        setStatus(statusEl, 'Inscripción confirmada.', 'ok');
        await refresh();
        return;
      }

      if (recBtn) {
        const id = recBtn.getAttribute('data-ni-ws-recording');
        if (!state.loggedIn) {
          loginWithReturn();
          return;
        }
        recBtn.disabled = true;
        const { data, error } = await getRecordingAccess(id);
        recBtn.disabled = false;
        const payload = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return null; } })() : data;
        if (error) {
          setStatus(statusEl, error.message || 'Error al obtener grabación.', 'error');
          return;
        }
        const access = payload?.access;
        const url = payload?.url;
        if (access === 'enabled' && url) {
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
        if (access === 'unauthenticated') {
          loginWithReturn();
          return;
        }
        setStatus(statusEl, recordingAccessMessage(access), 'warn');
        return;
      }

      if (editBtn) {
        const id = editBtn.getAttribute('data-ni-ws-edit');
        const item = state.itemsById.get(id);
        if (item) openModal('edit', item);
        return;
      }

      if (delBtn) {
        const id = delBtn.getAttribute('data-ni-ws-delete');
        const title = delBtn.getAttribute('data-title') || 'este taller';
        const imageKey = delBtn.getAttribute('data-image-key') || '';
        if (!window.confirm(`¿Eliminar «${title}»? Esta acción no se puede deshacer.`)) return;
        setStatus(statusEl, 'Eliminando…', 'info');
        const { error } = await deleteWorkshop(id);
        if (error) {
          setStatus(statusEl, error.message || 'No se pudo eliminar.', 'error');
          return;
        }
        if (imageKey) {
          try {
            await getClient().storage.from(IMAGE_BUCKET).remove(imageKey);
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
      if (!payload.starts_at || !payload.ends_at || !payload.registration_deadline) {
        setStatus(formStatus, 'Completa las fechas de inicio, fin e inscripción.', 'error');
        return;
      }
      if (new Date(payload.ends_at) < new Date(payload.starts_at)) {
        setStatus(formStatus, 'La fecha de fin debe ser posterior al inicio.', 'error');
        return;
      }
      if (!payload.capacity || payload.capacity < 1) {
        setStatus(formStatus, 'Los cupos deben ser al menos 1.', 'error');
        return;
      }

      const submitBtn = document.getElementById('ni-talleres-form-submit');
      if (submitBtn) submitBtn.disabled = true;
      setStatus(formStatus, 'Guardando…', 'info');

      if (state.pendingImageFile) {
        const up = await uploadWorkshopImage(state.pendingImageFile, {
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
        const existing = state.itemsById.get(payload.id);
        payload.image_url = existing?.image_url || null;
        payload.image_key = existing?.image_key || null;
      }

      let result;
      if (payload.id) {
        const { id, ...patch } = payload;
        result = await updateWorkshop(id, patch);
      } else {
        result = await createWorkshop(payload);
      }

      if (submitBtn) submitBtn.disabled = false;
      if (result.error) {
        setStatus(formStatus, result.error.message || 'No se pudo guardar.', 'error');
        return;
      }

      setStatus(formStatus, 'Taller guardado.', 'ok');
      getBootstrapModal(modalEl)?.hide();
      await refresh();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = searchInput.value;
        state.page = 1;
        refresh();
      }, SEARCH_DEBOUNCE_MS);
    });
  }

  wireFilterGroup(document.getElementById('ni-talleres-temporal'), 'data-ni-temporal', (v) => {
    state.temporal = v;
    state.page = 1;
    refresh();
  });
  wireFilterGroup(document.getElementById('ni-talleres-pub'), 'data-ni-pub', (v) => {
    state.pubStatus = v;
    state.page = 1;
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

registerModule('talleres', {
  pages: ['talleres'],
  async mount({ hook }) {
    ensureCatalogLoadingStyles();
    showCatalogLoading(document.getElementById('ni-talleres-list'), { count: 6, variant: 'cards' });
    const controller = createController();
    await controller.init();
    if (hook) hook.setAttribute('data-ni-ready', '1');
  },
});

export {};
