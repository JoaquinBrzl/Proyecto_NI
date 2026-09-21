/**
 * Match Académico: peer discovery from real InsForge profiles.
 * Compatibility weights are encapsulated in MATCH_WEIGHTS for easy retuning.
 */
import { getClient } from '../client.js';
import { registerModule } from './registry.js';
import {
  displayName,
  fetchInterestsCatalog,
  fetchOwnProfile,
  membershipPlanLabel,
  profileInitial,
} from './profile.js';
import { showCatalogLoading, clearCatalogLoading } from '../catalog-loading.js';

/** Tunable scoring weights (must sum to 1). */
export const MATCH_WEIGHTS = Object.freeze({
  interests: 0.6,
  carrera: 0.2,
  universidad: 0.1,
  ciclo: 0.1,
});

const CICLO_MAX_DISTANCE = 10;

function $(sel, root = document) {
  return root.querySelector(sel);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Extract first integer from ciclo strings like "7mo", "Ciclo 5", "VIII". */
export function parseCicloNumber(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const digit = s.match(/(\d{1,2})/);
  if (digit) {
    const n = Number(digit[1]);
    return n >= 1 && n <= 20 ? n : null;
  }
  const romanMap = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10,
    xi: 11,
    xii: 12,
  };
  const roman = s.toLowerCase().match(/\b(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/);
  if (roman) return romanMap[roman[1]] || null;
  return null;
}

function interestOverlapScore(selfIds, otherIds) {
  const a = new Set((selfIds || []).filter(Boolean));
  const b = new Set((otherIds || []).filter(Boolean));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const id of a) {
    if (b.has(id)) shared += 1;
  }
  const union = a.size + b.size - shared;
  return union ? shared / union : 0;
}

function exactFieldScore(selfVal, otherVal) {
  const a = normalizeText(selfVal);
  const b = normalizeText(otherVal);
  if (!a || !b) return 0;
  return a === b ? 1 : 0;
}

function cicloProximityScore(selfCiclo, otherCiclo) {
  const a = parseCicloNumber(selfCiclo);
  const b = parseCicloNumber(otherCiclo);
  if (a == null || b == null) return 0;
  const dist = Math.abs(a - b);
  return Math.max(0, 1 - dist / CICLO_MAX_DISTANCE);
}

/**
 * Dynamic compatibility 0–100. Weights are injectable for future A/B or admin tuning.
 */
export function computeCompatibility(self, other, weights = MATCH_WEIGHTS) {
  const w = { ...MATCH_WEIGHTS, ...(weights || {}) };
  const parts = {
    interests: interestOverlapScore(self.interestIds, other.interest_ids || other.interestIds),
    carrera: exactFieldScore(self.carrera, other.carrera),
    universidad: exactFieldScore(self.universidad, other.universidad),
    ciclo: cicloProximityScore(self.ciclo_academico, other.ciclo_academico),
  };
  const raw =
    parts.interests * w.interests +
    parts.carrera * w.carrera +
    parts.universidad * w.universidad +
    parts.ciclo * w.ciclo;
  return {
    percent: Math.round(Math.min(1, Math.max(0, raw)) * 100),
    parts,
  };
}

function normalizeIdArray(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === 'string') {
    const inner = raw.trim().replace(/^\{|\}$/g, '');
    if (!inner) return [];
    return inner
      .split(',')
      .map((s) => s.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);
  }
  return [];
}

function mapCandidateRow(row) {
  if (!row || typeof row !== 'object') return null;
  // PostgREST may wrap jsonb SETOF as the object itself or { list_match_candidates: {...} }
  const raw = row.list_match_candidates && typeof row.list_match_candidates === 'object'
    ? row.list_match_candidates
    : row;
  return {
    ...raw,
    interest_ids: normalizeIdArray(raw.interest_ids),
    plan: raw.plan || 'ni_free',
    level: Number(raw.level) || 0,
  };
}

async function fetchMatchCandidatesFallback(userId) {
  const insforge = getClient();
  const { data: profiles, error } = await insforge.database
    .from('profiles')
    .select('user_id,username,nombres,apellidos,universidad,carrera,ciclo_academico,bio,linkedin_url,updated_at')
    .neq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) return { candidates: [], error };

  let rows = Array.isArray(profiles) ? profiles : [];
  const ids = rows.map((r) => r.user_id).filter(Boolean);
  let adminIds = new Set();
  let interestByUser = new Map();

  if (ids.length) {
    const [{ data: roles }, { data: links }] = await Promise.all([
      insforge.database.from('user_roles').select('user_id,role').in('user_id', ids).eq('role', 'admin').limit(500),
      insforge.database.from('user_interests').select('user_id,interest_id').in('user_id', ids).limit(5000),
    ]);
    for (const role of Array.isArray(roles) ? roles : []) {
      if (role?.user_id) adminIds.add(role.user_id);
    }
    for (const link of Array.isArray(links) ? links : []) {
      const list = interestByUser.get(link.user_id) || [];
      list.push(link.interest_id);
      interestByUser.set(link.user_id, list);
    }
  }

  // Best-effort: RLS may hide other users' roles for non-admins.
  rows = rows.filter((r) => !adminIds.has(r.user_id));

  return {
    candidates: rows.map((r) => ({
      ...r,
      plan: 'ni_free',
      level: 0,
      interest_ids: interestByUser.get(r.user_id) || [],
    })),
    error: null,
  };
}

export async function fetchMatchCandidates(userId) {
  const insforge = getClient();
  const { data, error } = await insforge.database.rpc('list_match_candidates', {});

  if (!error) {
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    const candidates = rows.map(mapCandidateRow).filter(Boolean);
    if (candidates.length || !userId) {
      return { candidates, error: null };
    }
  } else {
    console.warn('[ni] list_match_candidates failed, using profiles fallback', error);
  }

  if (!userId) return { candidates: [], error: error || { message: 'Sesión inválida' } };
  return fetchMatchCandidatesFallback(userId);
}

function avatarHue(userId) {
  const s = String(userId || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return 200 + (h % 40);
}

function matchToneClass(percent) {
  if (percent >= 75) return 'is-high';
  if (percent >= 50) return 'is-mid';
  return 'is-low';
}

function planBadgeClass(plan) {
  const p = String(plan || '').toLowerCase();
  if (p === 'ni_elite' || p === 'elite') return 'ni-match-plan--elite';
  if (p === 'ni_pro' || p === 'pro') return 'ni-match-plan--pro';
  return 'ni-match-plan--free';
}

function sharedInterestSet(selfIds, otherIds) {
  const mine = new Set(selfIds || []);
  return new Set((otherIds || []).filter((id) => mine.has(id)));
}

function renderInterestPills(catalogById, interestIds, sharedIds) {
  const ids = interestIds || [];
  if (!ids.length) {
    return '<p class="ni-match-empty-interests">Sin intereses</p>';
  }
  return ids
    .map((id) => {
      const label = catalogById.get(id)?.label || 'Interés';
      const shared = sharedIds.has(id);
      return `<span class="ni-match-tag${shared ? ' is-shared' : ''}">${
        shared ? '<i class="feather-check" aria-hidden="true"></i>' : ''
      }${escapeHtml(label)}</span>`;
    })
    .join('');
}

function metaLine(candidate) {
  const uni = String(candidate.universidad || '').trim();
  const ciclo = String(candidate.ciclo_academico || '').trim();
  if (uni && ciclo) return `${escapeHtml(uni)} · ${escapeHtml(ciclo)}`;
  if (uni) return escapeHtml(uni);
  if (ciclo) return escapeHtml(ciclo);
  return '—';
}

function cardHtml(row, catalogById, selfInterestIds) {
  const name = displayName(row, { email: '' });
  const initial = profileInitial(row, {});
  const planLabel = membershipPlanLabel(row.plan);
  const percent = row._compat?.percent ?? 0;
  const shared = sharedInterestSet(selfInterestIds, row.interest_ids);
  const linkedin = String(row.linkedin_url || '').trim();
  const hue = avatarHue(row.user_id);
  const bio = String(row.bio || '').trim() || 'Sin bio todavía.';

  const connectBtn = linkedin
    ? `<a class="ni-match-btn ni-match-btn--ghost" href="${escapeHtml(linkedin)}" target="_blank" rel="noopener noreferrer">Conectar</a>`
    : `<button type="button" class="ni-match-btn ni-match-btn--ghost" disabled title="Sin LinkedIn público">Conectar</button>`;

  return `
    <article class="ni-match-card" data-user-id="${escapeHtml(row.user_id)}">
      <div class="ni-match-card-top">
        <div class="ni-match-avatar" style="background:hsl(${hue} 45% 38%)" aria-hidden="true">${escapeHtml(initial)}</div>
        <span class="ni-match-score ${matchToneClass(percent)}">${percent}% match</span>
      </div>
      <h3 class="ni-match-card-name">${escapeHtml(name)}</h3>
      <p class="ni-match-card-meta">${metaLine(row)}</p>
      <span class="ni-match-plan ${planBadgeClass(row.plan)}">${escapeHtml(planLabel)}</span>
      <p class="ni-match-card-bio">${escapeHtml(bio)}</p>
      <div class="ni-match-tags">${renderInterestPills(catalogById, row.interest_ids, shared)}</div>
      <div class="ni-match-card-actions">
        <button type="button" class="ni-match-btn ni-match-btn--primary" data-ni-view="${escapeHtml(row.user_id)}">Ver perfil</button>
        ${connectBtn}
      </div>
    </article>`;
}

function applyFilters(rows, filters) {
  const q = normalizeText(filters.q);
  const interest = filters.interest || '';
  const universidad = normalizeText(filters.universidad);
  const plan = filters.plan || '';

  return rows.filter((row) => {
    if (interest && !(row.interest_ids || []).includes(interest)) return false;
    if (plan && String(row.plan || 'ni_free') !== plan) return false;
    if (universidad) {
      const u = normalizeText(row.universidad);
      if (u !== universidad) return false;
    }
    if (q) {
      const hay = normalizeText(`${row.nombres} ${row.apellidos} ${row.username} ${row.universidad}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function uniqueUniversidades(rows) {
  const set = new Map();
  for (const row of rows) {
    const raw = String(row.universidad || '').trim();
    if (!raw) continue;
    const key = normalizeText(raw);
    if (!set.has(key)) set.set(key, raw);
  }
  return Array.from(set.values()).sort((a, b) => a.localeCompare(b, 'es'));
}

function fillSelect(select, options, placeholder) {
  if (!select) return;
  const current = select.value;
  select.innerHTML =
    `<option value="">${escapeHtml(placeholder)}</option>` +
    options
      .map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
      })
      .join('');
  if ([...select.options].some((o) => o.value === current)) select.value = current;
}

function openProfileModal(modalEl, row, catalogById, selfInterestIds) {
  if (!modalEl || !window.bootstrap?.Modal) return;
  const name = displayName(row, {});
  const initial = profileInitial(row, {});
  const planLabel = membershipPlanLabel(row.plan);
  const shared = sharedInterestSet(selfInterestIds, row.interest_ids);
  const linkedin = String(row.linkedin_url || '').trim();
  const percent = row._compat?.percent ?? 0;

  $('#ni-match-modal-avatar', modalEl).textContent = initial;
  $('#ni-match-modal-avatar', modalEl).style.background = `hsl(${avatarHue(row.user_id)} 45% 38%)`;
  $('#ni-match-modal-name', modalEl).textContent = name;
  $('#ni-match-modal-meta', modalEl).textContent = [
    row.universidad,
    row.carrera,
    row.ciclo_academico,
  ]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join(' · ') || '—';
  $('#ni-match-modal-plan', modalEl).textContent = planLabel;
  $('#ni-match-modal-plan', modalEl).className = `ni-match-plan ${planBadgeClass(row.plan)}`;
  $('#ni-match-modal-score', modalEl).textContent = `${percent}% match`;
  $('#ni-match-modal-score', modalEl).className = `ni-match-score ${matchToneClass(percent)}`;
  $('#ni-match-modal-bio', modalEl).textContent = String(row.bio || '').trim() || 'Sin bio todavía.';
  $('#ni-match-modal-interests', modalEl).innerHTML = renderInterestPills(
    catalogById,
    row.interest_ids,
    shared,
  );

  const connect = $('#ni-match-modal-connect', modalEl);
  if (connect) {
    if (linkedin) {
      connect.href = linkedin;
      connect.classList.remove('disabled');
      connect.removeAttribute('aria-disabled');
      connect.setAttribute('target', '_blank');
      connect.setAttribute('rel', 'noopener noreferrer');
    } else {
      connect.href = '#';
      connect.classList.add('disabled');
      connect.setAttribute('aria-disabled', 'true');
      connect.removeAttribute('target');
    }
  }

  window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

registerModule('match', {
  pages: ['match'],
  async mount({ hook, user }) {
    const root = $('#ni-match-root') || hook;
    if (!root) return;

    const statusEl = $('#ni-match-status');
    const listEl = $('#ni-match-list');
    const countEl = $('#ni-match-count');
    const selfTagsEl = $('#ni-match-self-tags');
    const selfNameEl = $('#ni-match-self-name');
    const selfInitialEl = $('#ni-match-self-initial');
    const selfInterestCountEl = $('#ni-match-self-interest-count');
    const searchEl = $('#ni-match-search');
    const interestFilter = $('#ni-match-filter-interest');
    const uniFilter = $('#ni-match-filter-universidad');
    const planFilter = $('#ni-match-filter-plan');
    const modalEl = $('#ni-match-modal');

    if (!user) {
      window.location.href = `login.html?next=${encodeURIComponent('match.html')}`;
      return;
    }

    root.hidden = false;
    showCatalogLoading(listEl, { count: 6, variant: 'match' });
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = 'Cargando compatibilidades…';
    }

    const [{ interests: catalog }, own, { candidates, error }] = await Promise.all([
      fetchInterestsCatalog(),
      fetchOwnProfile(user.id),
      fetchMatchCandidates(user.id),
    ]);

    if (error) {
      clearCatalogLoading(listEl);
      if (listEl) listEl.innerHTML = '';
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.dataset.niStatus = 'error';
        statusEl.textContent = error.message || 'No se pudieron cargar los matches.';
      }
      if (hook) hook.setAttribute('data-ni-ready', '0');
      return;
    }

    const catalogById = new Map((catalog || []).map((i) => [i.id, i]));
    const selfProfile = own.profile || {};
    const selfInterestIds = own.interestIds || [];
    const selfCtx = {
      interestIds: selfInterestIds,
      carrera: selfProfile.carrera,
      universidad: selfProfile.universidad,
      ciclo_academico: selfProfile.ciclo_academico,
    };

    if (selfNameEl) selfNameEl.textContent = displayName(selfProfile, user);
    if (selfInitialEl) selfInitialEl.textContent = profileInitial(selfProfile, user);
    if (selfInterestCountEl) {
      selfInterestCountEl.textContent = `${selfInterestIds.length} interés${
        selfInterestIds.length === 1 ? '' : 'es'
      }`;
    }
    if (selfTagsEl) {
      selfTagsEl.innerHTML = selfInterestIds.length
        ? selfInterestIds
            .map((id) => {
              const label = catalogById.get(id)?.label || 'Interés';
              return `<span class="ni-match-tag">${escapeHtml(label)}</span>`;
            })
            .join('')
        : '<span class="ni-match-tag ni-match-tag--muted">Agrega intereses en Mi Perfil</span>';
    }

    fillSelect(
      interestFilter,
      (catalog || []).map((i) => ({ value: i.id, label: i.label })),
      'Todos los intereses',
    );
    fillSelect(uniFilter, uniqueUniversidades(candidates), 'Todas las universidades');
    fillSelect(
      planFilter,
      [
        { value: 'ni_free', label: 'NI Free' },
        { value: 'ni_pro', label: 'NI Pro' },
        { value: 'ni_elite', label: 'NI Elite' },
      ],
      'Cualquier plan',
    );

    const scored = candidates.map((c) => {
      const interest_ids = Array.isArray(c.interest_ids) ? c.interest_ids : [];
      const row = { ...c, interest_ids };
      row._compat = computeCompatibility(selfCtx, row);
      return row;
    });
    scored.sort((a, b) => (b._compat.percent || 0) - (a._compat.percent || 0));

    const state = {
      rows: scored,
      filters: { q: '', interest: '', universidad: '', plan: '' },
    };

    function render() {
      const filtered = applyFilters(state.rows, state.filters);
      if (countEl) countEl.textContent = String(filtered.length);
      if (listEl) {
        clearCatalogLoading(listEl);
        if (!filtered.length) {
          listEl.innerHTML =
            '<p class="ni-match-empty col-12">No hay estudiantes que coincidan con estos filtros.</p>';
        } else {
          listEl.innerHTML = filtered
            .map((row) => cardHtml(row, catalogById, selfInterestIds))
            .join('');
        }
      }
      if (statusEl) {
        statusEl.hidden = true;
        statusEl.textContent = '';
      }
    }

    function syncFiltersFromDom() {
      state.filters = {
        q: searchEl?.value || '',
        interest: interestFilter?.value || '',
        universidad: uniFilter?.value || '',
        plan: planFilter?.value || '',
      };
      render();
    }

    searchEl?.addEventListener('input', syncFiltersFromDom);
    interestFilter?.addEventListener('change', syncFiltersFromDom);
    uniFilter?.addEventListener('change', syncFiltersFromDom);
    planFilter?.addEventListener('change', syncFiltersFromDom);

    listEl?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ni-view]');
      if (!btn) return;
      const id = btn.getAttribute('data-ni-view');
      const row = state.rows.find((r) => r.user_id === id);
      if (row) openProfileModal(modalEl, row, catalogById, selfInterestIds);
    });

    render();
    if (hook) hook.setAttribute('data-ni-ready', '1');
  },
});
