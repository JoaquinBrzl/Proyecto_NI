import { getClient } from '../client.js';
import { rpcIsAdmin } from '../identity.js';
import { registerModule } from './registry.js';

/**
 * Admin panel: Elite review + workshop enrollments (grouped by workshop).
 * Announcement CRUD lives on anuncios.html.
 */

const LOGIN_HREF = 'login.html';
const HOME_HREF = 'index.html';

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

function createAdminController(root) {
  const eliteStatusEl = document.getElementById('ni-admin-elite-status');
  const wsEnrollStatusEl = document.getElementById('ni-admin-ws-enroll-status');
  const eliteTableBody = document.querySelector('#ni-admin-elite-table tbody');
  const wsEnrollGroups = document.getElementById('ni-admin-ws-enroll-groups');
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
    selectedEliteId: null,
    wsEnrollRows: [],
  };

  async function refreshElite() {
    if (!eliteTableBody) return;
    setStatus(eliteStatusEl, 'Cargando postulaciones…', 'info');
    const { data, error } = await listEliteApplicationsAdmin();
    eliteTableBody.innerHTML = '';
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
    for (const row of data) {
      const name = `${row.nombres || ''} ${row.apellidos || ''}`.trim() || '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(row.email || '—')}</td>
        <td>${escapeHtml(row.universidad || '—')}</td>
        <td>${escapeHtml(row.carrera || '—')}</td>
        <td>${escapeHtml(formatDate(row.created_at))}</td>
        <td><span class="tmp-badge">${escapeHtml(row.status)}</span></td>
        <td>
          <button type="button" class="tmp-btn btn-border btn-small" data-ni-elite-open="${escapeHtml(row.id)}">Ver</button>
        </td>
      `;
      eliteTableBody.appendChild(tr);
    }
  }

  function openEliteDetail(id) {
    const row = state.eliteRows.find((r) => r.id === id);
    if (!row || !detailPanel || !detailBody) return;
    state.selectedEliteId = id;
    const name = `${row.nombres || ''} ${row.apellidos || ''}`.trim() || 'Sin nombre';
    const pending = row.status === 'pending';
    detailBody.innerHTML = `
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(row.email || '—')}</p>
      <p><strong>Universidad:</strong> ${escapeHtml(row.universidad || '—')}</p>
      <p><strong>Carrera:</strong> ${escapeHtml(row.carrera || '—')}</p>
      <p><strong>Fecha:</strong> ${escapeHtml(formatDate(row.created_at))}</p>
      <p><strong>Estado:</strong> ${escapeHtml(row.status)}</p>
      <p class="mb--0"><strong>Mensaje:</strong></p>
      <p style="white-space:pre-wrap;">${escapeHtml(row.message || '(sin mensaje)')}</p>
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

  async function refreshWorkshopEnrollments() {
    if (!wsEnrollGroups) return;
    setStatus(wsEnrollStatusEl, 'Cargando inscripciones…', 'info');
    const { data, error } = await listWorkshopEnrollmentsAdmin();
    wsEnrollGroups.innerHTML = '';
    state.wsEnrollRows = data;
    if (error) {
      setStatus(wsEnrollStatusEl, error.message || 'No se pudieron cargar inscripciones.', 'error');
      return;
    }
    if (!data.length) {
      setStatus(wsEnrollStatusEl, 'No hay inscripciones a talleres.', 'empty');
      return;
    }
    setStatus(wsEnrollStatusEl, '', '');

    const groups = groupEnrollmentsByWorkshop(data);
    for (const group of groups) {
      const details = document.createElement('details');
      details.className = 'ni-admin-enroll-group';
      details.open = groups.length <= 3;

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
  }

  function openWsEnrollDetail(id) {
    const row = state.wsEnrollRows.find((r) => r.id === id);
    if (!row || !wsDetailPanel || !wsDetailBody) return;
    const name = `${row.nombres || ''} ${row.apellidos || ''}`.trim() || 'Sin nombre';
    wsDetailBody.innerHTML = `
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(row.email || '—')}</p>
      <p><strong>Universidad:</strong> ${escapeHtml(row.universidad || '—')}</p>
      <p><strong>Carrera:</strong> ${escapeHtml(row.carrera || '—')}</p>
      <p><strong>Taller:</strong> ${escapeHtml(row.workshop_title || '—')}</p>
      <p class="mb--0"><strong>Fecha de inscripción:</strong> ${escapeHtml(formatDate(row.created_at))}</p>
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

  void root;

  return {
    async refresh() {
      await Promise.all([refreshElite(), refreshWorkshopEnrollments()]);
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
