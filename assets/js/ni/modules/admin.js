import { mountAdminContent } from './admin-content.js';
import { getClient } from '../client.js';
import { rpcIsAdmin } from '../identity.js';
import { registerModule } from './registry.js';

/**
 * Admin panel: Elite review + workshop enrollments (grouped by workshop).
 * Announcement CRUD lives on anuncios.html.
 */

const LOGIN_HREF = 'login.html';
const HOME_HREF = 'index.html';
const PAGE_SIZE = 10;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstRow(data) {
  if (!data) return null;
  return Array.isArray(data) ? data[0] || null : data;
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 16);
  }
}

function statusLabel(status) {
  const map = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  };
  return map[status] || status || '—';
}

function statusBadge(status) {
  const kind =
    status === 'approved' ? 'ok' : status === 'rejected' ? 'error' : status === 'pending' ? 'warn' : '';
  return `<span class="ni-admin-pill${kind ? ` ni-admin-pill--${kind}` : ''}">${escapeHtml(statusLabel(status))}</span>`;
}

function detailField(label, value, { multiline = false } = {}) {
  const text = value == null || value === '' ? '—' : String(value);
  return `
    <div class="ni-admin-field${multiline ? ' ni-admin-field--block' : ''}">
      <span class="ni-admin-field__label">${escapeHtml(label)}</span>
      <span class="ni-admin-field__value${multiline ? ' is-multiline' : ''}">${escapeHtml(text)}</span>
    </div>`;
}

function parseAnswers(row) {
  let answers = row?.answers;
  if (typeof answers === 'string') {
    try {
      answers = JSON.parse(answers);
    } catch {
      answers = null;
    }
  }
  if (answers && typeof answers === 'object' && !Array.isArray(answers)) return answers;
  return null;
}

const AVAILABILITY_LABELS = {
  alta: 'Alta — casi siempre disponible',
  media: 'Media — varios días a la semana',
  baja: 'Baja — solo fines de semana / ocasional',
};

function renderEliteAnswers(row) {
  const answers = parseAnswers(row);
  if (answers) {
    const disponibilidad =
      AVAILABILITY_LABELS[answers.disponibilidad] || answers.disponibilidad || '—';
    return `
      <div class="ni-admin-fields">
        ${detailField('Motivo', answers.motivo, { multiline: true })}
        ${detailField('Objetivos', answers.objetivos, { multiline: true })}
        ${detailField('Temas', answers.temas, { multiline: true })}
        ${detailField('Participación previa', answers.participacion, { multiline: true })}
        ${detailField('Aporte', answers.aporte, { multiline: true })}
        ${detailField('Disponibilidad', disponibilidad)}
        ${detailField('WhatsApp', answers.whatsapp)}
        ${detailField('LinkedIn', answers.linkedin || '—')}
      </div>`;
  }
  return `
    <div class="ni-admin-fields">
      ${detailField('Mensaje', row.message || '(sin mensaje)', { multiline: true })}
    </div>`;
}

async function assertAdminAccess(ctx) {
  const snap = ctx.getSessionSnapshot ? ctx.getSessionSnapshot() : { user: null };
  const user = snap.user || ctx.user || null;
  if (!user) {
    window.location.replace(LOGIN_HREF);
    return false;
  }

  let isAdmin = ctx.identity?.role === 'admin';
  if (!isAdmin) {
    const { data, error } = await rpcIsAdmin();
    if (error) {
      console.error('[ni/admin] is_admin failed', error);
      window.location.replace(HOME_HREF);
      return false;
    }
    isAdmin = data === true || firstRow(data) === true;
  }

  if (!isAdmin) {
    window.location.replace(HOME_HREF);
    return false;
  }
  return true;
}

export async function listEliteApplicationsAdmin() {
  const insforge = getClient();
  const { data, error } = await insforge.database.rpc('list_elite_applications_admin');
  return {
    data: Array.isArray(data) ? data : data ? [data] : [],
    error: error || null,
  };
}

export async function reviewEliteApplication(applicationId, decision) {
  const insforge = getClient();
  return insforge.functions.invoke('review-elite-application', {
    body: { applicationId, decision },
  });
}

export async function listWorkshopEnrollmentsAdmin() {
  const insforge = getClient();
  const { data, error } = await insforge.database.rpc('list_workshop_enrollments_admin');
  return {
    data: Array.isArray(data) ? data : data ? [data] : [],
    error: error || null,
  };
}

export async function listPaymentSubmissionsAdmin() {
  const insforge = getClient();
  const { data, error } = await insforge.database.rpc('list_membership_payment_submissions_admin');
  return {
    data: Array.isArray(data) ? data : data ? [data] : [],
    error: error || null,
  };
}

export async function reviewMembershipPayment(submissionId, decision, adminNote = null) {
  const insforge = getClient();
  return insforge.database.rpc('review_membership_payment', {
    p_submission_id: submissionId,
    p_decision: decision,
    p_admin_note: adminNote,
  });
}

export async function listActiveMembershipsAdmin() {
  const insforge = getClient();
  const { data, error } = await insforge.database.rpc('list_active_memberships_admin');
  return {
    data: Array.isArray(data) ? data : data ? [data] : [],
    error: error || null,
  };
}

export async function deactivateMembershipAdmin(membershipId) {
  const insforge = getClient();
  return insforge.database.rpc('deactivate_membership_admin', {
    p_membership_id: membershipId,
  });
}

function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function planPayLabel(plan) {
  if (plan === 'ni_pro') return 'NI Pro';
  if (plan === 'ni_elite') return 'NI Elite';
  return plan || '—';
}

function methodLabel(method) {
  const map = { yape: 'Yape', plin: 'Plin', transfer: 'Transferencia' };
  return map[method] || method || '—';
}

function groupEnrollmentsByWorkshop(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = row.workshop_id || row.workshop_title || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        workshop_id: row.workshop_id || key,
        workshop_title: row.workshop_title || 'Taller sin título',
        rows: [],
      });
    }
    map.get(key).rows.push(row);
  }
  return Array.from(map.values()).sort((a, b) =>
    String(a.workshop_title).localeCompare(String(b.workshop_title), 'es'),
  );
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

function createAdminController(root) {
  const eliteStatusEl = document.getElementById('ni-admin-elite-status');
  const wsEnrollStatusEl = document.getElementById('ni-admin-ws-enroll-status');
  const eliteTableBody = document.querySelector('#ni-admin-elite-table tbody');
  const elitePager = document.getElementById('ni-admin-elite-pagination');
  const eliteSearch = document.getElementById('ni-admin-elite-search');
  const eliteFilterChips = document.getElementById('ni-admin-elite-filter-chips');
  const wsEnrollGroups = document.getElementById('ni-admin-ws-enroll-groups');
  const wsEnrollPager = document.getElementById('ni-admin-ws-enroll-pagination');
  const detailPanel = document.getElementById('ni-admin-elite-detail');
  const detailBody = document.getElementById('ni-admin-elite-detail-body');
  const approveBtn = document.getElementById('ni-admin-elite-approve');
  const rejectBtn = document.getElementById('ni-admin-elite-reject');
  const detailClose = document.getElementById('ni-admin-elite-detail-close');
  const wsDetailPanel = document.getElementById('ni-admin-ws-enroll-detail');
  const wsDetailBody = document.getElementById('ni-admin-ws-enroll-detail-body');
  const wsDetailClose = document.getElementById('ni-admin-ws-enroll-detail-close');

  const state = {
    eliteRows: [],
    elitePage: 1,
    eliteQuery: '',
    eliteStatus: '',
    selectedEliteId: null,
    wsEnrollRows: [],
    wsGroups: [],
    wsPage: 1,
  };

  function filteredEliteRows() {
    const q = state.eliteQuery.trim().toLowerCase();
    const status = state.eliteStatus;
    return state.eliteRows.filter((row) => {
      if (status && row.status !== status) return false;
      if (!q) return true;
      const name = `${row.nombres || ''} ${row.apellidos || ''}`.trim().toLowerCase();
      const hay = [
        name,
        row.email,
        row.universidad,
        row.carrera,
        statusLabel(row.status),
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      return hay.includes(q);
    });
  }

  function paintElitePage() {
    if (!eliteTableBody) return;
    eliteTableBody.innerHTML = '';
    const rows = filteredEliteRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.elitePage > totalPages) state.elitePage = totalPages;
    const start = (state.elitePage - 1) * PAGE_SIZE;
    const slice = rows.slice(start, start + PAGE_SIZE);

    if (!state.eliteRows.length) {
      setStatus(eliteStatusEl, 'No hay postulaciones Elite.', 'empty');
    } else if (!rows.length) {
      setStatus(eliteStatusEl, 'No hay resultados con este filtro o búsqueda.', 'empty');
    } else {
      setStatus(eliteStatusEl, '', '');
    }

    for (const row of slice) {
      const name = `${row.nombres || ''} ${row.apellidos || ''}`.trim() || '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(row.email || '—')}</td>
        <td>${escapeHtml(row.universidad || '—')}</td>
        <td>${escapeHtml(row.carrera || '—')}</td>
        <td>${escapeHtml(formatDate(row.created_at))}</td>
        <td>${statusBadge(row.status)}</td>
        <td>
          <button type="button" class="tmp-btn btn-border btn-small" data-ni-elite-open="${escapeHtml(row.id)}">Ver</button>
        </td>
      `;
      eliteTableBody.appendChild(tr);
    }
    renderPagination(elitePager, {
      page: state.elitePage,
      totalPages: rows.length ? totalPages : 1,
      onPage: (next) => {
        state.elitePage = next;
        paintElitePage();
      },
    });
  }

  async function refreshElite() {
    if (!eliteTableBody) return;
    setStatus(eliteStatusEl, 'Cargando postulaciones…', 'info');
    const { data, error } = await listEliteApplicationsAdmin();
    eliteTableBody.innerHTML = '';
    if (elitePager) elitePager.innerHTML = '';
    state.eliteRows = data;
    if (error) {
      setStatus(eliteStatusEl, error.message || 'No se pudieron cargar postulaciones.', 'error');
      return;
    }
    if (!data.length) {
      setStatus(eliteStatusEl, 'No hay postulaciones Elite.', 'empty');
      return;
    }
    setStatus(eliteStatusEl, '', '');
    paintElitePage();
  }

  function openEliteDetail(id) {
    const row = state.eliteRows.find((r) => r.id === id);
    if (!row || !detailPanel || !detailBody) return;
    state.selectedEliteId = id;
    const name = `${row.nombres || ''} ${row.apellidos || ''}`.trim() || 'Sin nombre';
    const pending = row.status === 'pending';
    const answers = parseAnswers(row);
    detailBody.innerHTML = `
      <div class="ni-admin-fields">
        ${detailField('Nombre', name)}
        ${detailField('Email', row.email || '—')}
        ${detailField('Universidad', answers?.universidad || row.universidad || '—')}
        ${detailField('Carrera', answers?.carrera || row.carrera || '—')}
        ${detailField('Ciclo académico', answers?.ciclo || '—')}
        ${detailField('Fecha', formatDate(row.created_at))}
        <div class="ni-admin-field">
          <span class="ni-admin-field__label">Estado</span>
          <span class="ni-admin-field__value">${statusBadge(row.status)}</span>
        </div>
      </div>
      <h4 class="ni-admin-detail__section">Respuestas de la postulación</h4>
      ${renderEliteAnswers(row)}
    `;
    if (approveBtn) {
      approveBtn.disabled = !pending;
      approveBtn.hidden = !pending;
    }
    if (rejectBtn) {
      rejectBtn.disabled = !pending;
      rejectBtn.hidden = !pending;
    }
    detailPanel.hidden = false;
    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeEliteDetail() {
    state.selectedEliteId = null;
    if (detailPanel) detailPanel.hidden = true;
  }

  function paintWsEnrollPage() {
    if (!wsEnrollGroups) return;
    wsEnrollGroups.innerHTML = '';
    const groups = state.wsGroups;
    const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
    if (state.wsPage > totalPages) state.wsPage = totalPages;
    const start = (state.wsPage - 1) * PAGE_SIZE;
    const slice = groups.slice(start, start + PAGE_SIZE);
    for (const group of slice) {
      const details = document.createElement('details');
      details.className = 'ni-admin-enroll-group';
      details.open = slice.length <= 3;

      const rowsHtml = group.rows
        .map((row) => {
          const name = `${row.nombres || ''} ${row.apellidos || ''}`.trim() || '—';
          return `<tr>
            <td>${escapeHtml(name)}</td>
            <td>${escapeHtml(row.email || '—')}</td>
            <td>${escapeHtml(row.universidad || '—')}</td>
            <td>${escapeHtml(row.carrera || '—')}</td>
            <td>${escapeHtml(formatDate(row.created_at))}</td>
            <td>
              <button type="button" class="tmp-btn btn-border btn-small" data-ni-ws-enroll-open="${escapeHtml(row.id)}">Ver</button>
            </td>
          </tr>`;
        })
        .join('');

      details.innerHTML = `
        <summary>
          <span>${escapeHtml(group.workshop_title)}</span>
          <span class="ni-admin-enroll-count">${group.rows.length} inscrito${group.rows.length === 1 ? '' : 's'}</span>
        </summary>
        <div class="table-responsive">
          <table class="ni-admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Universidad</th>
                <th>Carrera</th>
                <th>Fecha inscripción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      `;
      wsEnrollGroups.appendChild(details);
    }
    renderPagination(wsEnrollPager, {
      page: state.wsPage,
      totalPages,
      onPage: (next) => {
        state.wsPage = next;
        paintWsEnrollPage();
      },
    });
  }

  async function refreshWorkshopEnrollments() {
    if (!wsEnrollGroups) return;
    setStatus(wsEnrollStatusEl, 'Cargando inscripciones…', 'info');
    const { data, error } = await listWorkshopEnrollmentsAdmin();
    wsEnrollGroups.innerHTML = '';
    if (wsEnrollPager) wsEnrollPager.innerHTML = '';
    state.wsEnrollRows = data;
    state.wsGroups = [];
    if (error) {
      setStatus(wsEnrollStatusEl, error.message || 'No se pudieron cargar inscripciones.', 'error');
      return;
    }
    if (!data.length) {
      setStatus(wsEnrollStatusEl, 'No hay inscripciones a talleres.', 'empty');
      return;
    }
    setStatus(wsEnrollStatusEl, '', '');
    state.wsGroups = groupEnrollmentsByWorkshop(data);
    paintWsEnrollPage();
  }

  function openWsEnrollDetail(id) {
    const row = state.wsEnrollRows.find((r) => r.id === id);
    if (!row || !wsDetailPanel || !wsDetailBody) return;
    const name = `${row.nombres || ''} ${row.apellidos || ''}`.trim() || 'Sin nombre';
    wsDetailBody.innerHTML = `
      <div class="ni-admin-fields">
        ${detailField('Nombre', name)}
        ${detailField('Email', row.email || '—')}
        ${detailField('Universidad', row.universidad || '—')}
        ${detailField('Carrera', row.carrera || '—')}
        ${detailField('Taller', row.workshop_title || '—')}
        ${detailField('Fecha de inscripción', formatDate(row.created_at))}
      </div>
    `;
    wsDetailPanel.hidden = false;
    wsDetailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeWsEnrollDetail() {
    if (wsDetailPanel) wsDetailPanel.hidden = true;
  }

  async function handleReview(decision) {
    const id = state.selectedEliteId;
    if (!id) return;
    setStatus(eliteStatusEl, decision === 'approved' ? 'Aprobando…' : 'Rechazando…', 'info');
    if (approveBtn) approveBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;

    const { data, error } = await reviewEliteApplication(id, decision);
    if (error) {
      setStatus(eliteStatusEl, error.message || 'No se pudo completar la revisión.', 'error');
      if (approveBtn) approveBtn.disabled = false;
      if (rejectBtn) rejectBtn.disabled = false;
      return;
    }

    const payload = data?.data ?? data;
    const warning = payload?.warning || data?.warning || null;
    if (warning) {
      setStatus(eliteStatusEl, warning, 'warn');
    } else if (decision === 'rejected' && payload?.emailSent) {
      setStatus(eliteStatusEl, 'Rechazada y correo enviado.', 'ok');
    } else if (decision === 'approved') {
      setStatus(eliteStatusEl, 'Aprobada. El usuario puede activar Elite (demo) en precios.', 'ok');
    } else {
      setStatus(eliteStatusEl, 'Decisión aplicada.', 'ok');
    }

    closeEliteDetail();
    await refreshElite();
  }

  if (eliteSearch) {
    eliteSearch.addEventListener('input', () => {
      state.eliteQuery = eliteSearch.value || '';
      state.elitePage = 1;
      paintElitePage();
    });
  }
  if (eliteFilterChips) {
    eliteFilterChips.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ni-elite-status]');
      if (!btn || !eliteFilterChips.contains(btn)) return;
      eliteFilterChips.querySelectorAll('[data-ni-elite-status]').forEach((b) => {
        b.classList.toggle('is-checked', b === btn);
      });
      state.eliteStatus = btn.getAttribute('data-ni-elite-status') || '';
      state.elitePage = 1;
      paintElitePage();
    });
  }

  if (eliteTableBody) {
    eliteTableBody.addEventListener('click', (e) => {
      const openBtn = e.target.closest('[data-ni-elite-open]');
      if (!openBtn) return;
      openEliteDetail(openBtn.getAttribute('data-ni-elite-open'));
    });
  }

  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      handleReview('approved').catch((err) => {
        console.error(err);
        setStatus(eliteStatusEl, err.message || 'Error al aprobar.', 'error');
      });
    });
  }
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      if (!window.confirm('¿Rechazar esta postulación? Se intentará enviar un correo.')) return;
      handleReview('rejected').catch((err) => {
        console.error(err);
        setStatus(eliteStatusEl, err.message || 'Error al rechazar.', 'error');
      });
    });
  }
  if (detailClose) {
    detailClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeEliteDetail();
    });
  }

  if (wsEnrollGroups) {
    wsEnrollGroups.addEventListener('click', (e) => {
      const openBtn = e.target.closest('[data-ni-ws-enroll-open]');
      if (!openBtn) return;
      openWsEnrollDetail(openBtn.getAttribute('data-ni-ws-enroll-open'));
    });
  }
  if (wsDetailClose) {
    wsDetailClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeWsEnrollDetail();
    });
  }

  // --- Membership payments ---
  const payStatusEl = document.getElementById('ni-admin-pay-status');
  const payTableBody = document.querySelector('#ni-admin-pay-table tbody');
  const payActiveBody = document.querySelector('#ni-admin-pay-active-table tbody');
  const payFilterChips = document.getElementById('ni-admin-pay-filter-chips');
  const payDetailPanel = document.getElementById('ni-admin-pay-detail');
  const payDetailBody = document.getElementById('ni-admin-pay-detail-body');
  const payDetailActions = document.getElementById('ni-admin-pay-detail-actions');
  const payApproveBtn = document.getElementById('ni-admin-pay-approve');
  const payRejectBtn = document.getElementById('ni-admin-pay-reject');
  const payDetailClose = document.getElementById('ni-admin-pay-detail-close');

  const payState = {
    submissions: [],
    active: [],
    statusFilter: 'pending',
    selectedId: null,
  };

  function filteredSubmissions() {
    if (!payState.statusFilter) return payState.submissions;
    return payState.submissions.filter((r) => r.status === payState.statusFilter);
  }

  function paintPayTable() {
    if (!payTableBody) return;
    const rows = filteredSubmissions();
    if (!rows.length) {
      payTableBody.innerHTML = '<tr><td colspan="8">No hay comprobantes.</td></tr>';
      return;
    }
    payTableBody.innerHTML = rows
      .map((r) => {
        const name = [r.nombres, r.apellidos].filter(Boolean).join(' ') || r.email || '—';
        return `<tr>
          <td>${escapeHtml(name)}<br><small>${escapeHtml(r.email || '')}</small></td>
          <td>${escapeHtml(planPayLabel(r.plan))}</td>
          <td>${escapeHtml(methodLabel(r.method))}</td>
          <td><code>${escapeHtml(r.operation_number)}</code></td>
          <td>S/ ${escapeHtml(formatMoney(r.amount_pen))}</td>
          <td>${statusBadge(r.status)}</td>
          <td>${escapeHtml(formatDate(r.created_at))}</td>
          <td><button type="button" class="ni-admin-btn ni-admin-btn--ghost btn-small" data-ni-pay-open="${escapeHtml(r.id)}">Ver</button></td>
        </tr>`;
      })
      .join('');
  }

  function paintActiveMemberships() {
    if (!payActiveBody) return;
    if (!payState.active.length) {
      payActiveBody.innerHTML = '<tr><td colspan="5">No hay membresías Pro/Elite activas.</td></tr>';
      return;
    }
    payActiveBody.innerHTML = payState.active
      .map((r) => {
        const name = [r.nombres, r.apellidos].filter(Boolean).join(' ') || r.email || '—';
        return `<tr>
          <td>${escapeHtml(name)}<br><small>${escapeHtml(r.email || '')}</small></td>
          <td>${escapeHtml(planPayLabel(r.plan))}</td>
          <td>${escapeHtml(formatDate(r.starts_at))}</td>
          <td>${escapeHtml(formatDate(r.ends_at))}</td>
          <td>
            <button type="button" class="ni-admin-btn ni-admin-btn--danger btn-small" data-ni-pay-deactivate="${escapeHtml(r.id)}">
              Desactivar
            </button>
          </td>
        </tr>`;
      })
      .join('');
  }

  function openPayDetail(id) {
    const row = payState.submissions.find((r) => r.id === id);
    if (!row || !payDetailPanel || !payDetailBody) return;
    payState.selectedId = id;
    const name = [row.nombres, row.apellidos].filter(Boolean).join(' ') || '—';
    payDetailBody.innerHTML = `
      <div class="ni-admin-fields">
        ${detailField('Usuario', name)}
        ${detailField('Email', row.email || '—')}
        ${detailField('Plan', planPayLabel(row.plan))}
        ${detailField('Método', methodLabel(row.method))}
        ${detailField('Nº operación', row.operation_number)}
        ${detailField('Total', `S/ ${formatMoney(row.amount_pen)}`)}
        ${detailField('Estado', statusLabel(row.status))}
        ${detailField('Enviado', formatDate(row.created_at))}
        ${detailField('Nota', row.admin_note || '—', { multiline: true })}
      </div>`;
    payDetailPanel.hidden = false;
    if (payDetailActions) payDetailActions.hidden = row.status !== 'pending';
  }

  function closePayDetail() {
    payState.selectedId = null;
    if (payDetailPanel) payDetailPanel.hidden = true;
  }

  async function refreshPayments() {
    if (!payTableBody && !payActiveBody) return;
    const [subsRes, activeRes] = await Promise.all([
      listPaymentSubmissionsAdmin(),
      listActiveMembershipsAdmin(),
    ]);
    if (subsRes.error) {
      setStatus(payStatusEl, subsRes.error.message || 'Error al cargar comprobantes.', 'error');
    } else {
      payState.submissions = subsRes.data || [];
    }
    if (activeRes.error) {
      console.warn('[ni/admin] active memberships', activeRes.error);
    } else {
      payState.active = activeRes.data || [];
    }
    paintPayTable();
    paintActiveMemberships();
  }

  if (payFilterChips) {
    payFilterChips.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ni-pay-status]');
      if (!btn || !payFilterChips.contains(btn)) return;
      payFilterChips.querySelectorAll('[data-ni-pay-status]').forEach((b) => {
        b.classList.toggle('is-checked', b === btn);
      });
      payState.statusFilter = btn.getAttribute('data-ni-pay-status') ?? '';
      paintPayTable();
    });
  }

  if (payTableBody) {
    payTableBody.addEventListener('click', (e) => {
      const openBtn = e.target.closest('[data-ni-pay-open]');
      if (!openBtn) return;
      openPayDetail(openBtn.getAttribute('data-ni-pay-open'));
    });
  }

  if (payActiveBody) {
    payActiveBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-ni-pay-deactivate]');
      if (!btn) return;
      const id = btn.getAttribute('data-ni-pay-deactivate');
      if (!window.confirm('¿Desactivar esta membresía ahora?')) return;
      setStatus(payStatusEl, 'Desactivando…', 'info');
      const { error } = await deactivateMembershipAdmin(id);
      if (error) {
        setStatus(payStatusEl, error.message || 'No se pudo desactivar.', 'error');
        return;
      }
      setStatus(payStatusEl, 'Membresía desactivada.', 'ok');
      await refreshPayments();
    });
  }

  if (payDetailClose) {
    payDetailClose.addEventListener('click', (e) => {
      e.preventDefault();
      closePayDetail();
    });
  }

  async function handlePayReview(decision) {
    if (!payState.selectedId) return;
    setStatus(payStatusEl, decision === 'approved' ? 'Activando…' : 'Rechazando…', 'info');
    const note =
      decision === 'rejected'
        ? window.prompt('Nota para el rechazo (opcional):') || null
        : null;
    const { error } = await reviewMembershipPayment(payState.selectedId, decision, note);
    if (error) {
      setStatus(payStatusEl, error.message || 'No se pudo revisar el comprobante.', 'error');
      return;
    }
    setStatus(
      payStatusEl,
      decision === 'approved'
        ? 'Pago aprobado. Membresía activa por 30 días.'
        : 'Comprobante rechazado.',
      'ok',
    );
    closePayDetail();
    await refreshPayments();
  }

  if (payApproveBtn) {
    payApproveBtn.addEventListener('click', () => {
      handlePayReview('approved').catch((err) => {
        setStatus(payStatusEl, err.message || 'Error al aprobar.', 'error');
      });
    });
  }
  if (payRejectBtn) {
    payRejectBtn.addEventListener('click', () => {
      if (!window.confirm('¿Rechazar este comprobante?')) return;
      handlePayReview('rejected').catch((err) => {
        setStatus(payStatusEl, err.message || 'Error al rechazar.', 'error');
      });
    });
  }

  void root;

  return {
    async refresh() {
      await Promise.all([refreshElite(), refreshWorkshopEnrollments(), refreshPayments()]);
    },
  };
}


registerModule('admin', {
  pages: ['admin'],
  async mount(ctx) {
    const hook = ctx.hook;
    if (hook) {
      hook.setAttribute('data-ni-ready', '1');
      delete hook.dataset.niStub;
      hook.hidden = true;
    }

    const gate = document.getElementById('ni-admin-gate');
    const allowed = await assertAdminAccess(ctx);
    if (!allowed) return;

    if (gate) gate.hidden = false;
    setStatus(document.getElementById('ni-admin-status'), 'Panel administrativo', 'ok');

    const controller = createAdminController(hook);
    try {
      await controller.refresh();
      mountAdminContent();
    } catch (err) {
      console.error('[ni/admin] mount failed', err);
      setStatus(
        document.getElementById('ni-admin-status'),
        err.message || 'Error al cargar el panel.',
        'error',
      );
    }
  },
});

export {};
