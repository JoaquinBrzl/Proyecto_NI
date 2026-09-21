/**
 * Global search: talleres, recursos, anuncios, estudiantes (profiles).
 * UI open/close is owned by header.js; this module runs queries + renders results.
 */
import { getClient } from '../client.js';
import { getSessionSnapshot } from '../session.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function displayName(p) {
  const n = `${p?.nombres || ''} ${p?.apellidos || ''}`.trim();
  return n || p?.username || 'Estudiante';
}

async function searchWorkshops(q) {
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('workshops')
    .select('id,title,status')
    .eq('status', 'published')
    .ilike('title', `%${q}%`)
    .limit(8);
  if (error) return [];
  return (Array.isArray(data) ? data : []).map((row) => ({
    type: 'taller',
    typeLabel: 'Talleres',
    title: row.title,
    href: `talleres.html?q=${encodeURIComponent(row.title || q)}`,
  }));
}

async function searchResources(q) {
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('resources')
    .select('id,title,status')
    .eq('status', 'published')
    .ilike('title', `%${q}%`)
    .limit(8);
  if (error) return [];
  return (Array.isArray(data) ? data : []).map((row) => ({
    type: 'recurso',
    typeLabel: 'Recursos',
    title: row.title,
    href: `recursos.html?q=${encodeURIComponent(row.title || q)}`,
  }));
}

async function searchAnnouncements(q) {
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('announcements')
    .select('id,title,status')
    .eq('status', 'published')
    .ilike('title', `%${q}%`)
    .limit(8);
  if (error) return [];
  return (Array.isArray(data) ? data : []).map((row) => ({
    type: 'anuncio',
    typeLabel: 'Anuncios',
    title: row.title,
    href: `anuncios.html?q=${encodeURIComponent(row.title || q)}`,
  }));
}

async function searchStudents(q) {
  const snap = getSessionSnapshot();
  if (!snap.user) return [];
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('profiles')
    .select('user_id,username,nombres,apellidos,universidad')
    .or(
      `nombres.ilike.%${q}%,apellidos.ilike.%${q}%,username.ilike.%${q}%,universidad.ilike.%${q}%`,
    )
    .limit(8);
  if (error) return [];
  return (Array.isArray(data) ? data : []).map((row) => ({
    type: 'estudiante',
    typeLabel: 'Estudiantes',
    title: displayName(row),
    meta: row.universidad || row.username || '',
    href: `match.html?q=${encodeURIComponent(displayName(row))}`,
  }));
}

export async function runGlobalSearch(rawQuery) {
  const q = String(rawQuery || '').trim();
  if (q.length < 2) {
    return { query: q, groups: [], error: null };
  }

  const [talleres, recursos, anuncios, estudiantes] = await Promise.all([
    searchWorkshops(q),
    searchResources(q),
    searchAnnouncements(q),
    searchStudents(q),
  ]);

  const groups = [
    { key: 'talleres', label: 'Talleres', items: talleres },
    { key: 'recursos', label: 'Recursos', items: recursos },
    { key: 'anuncios', label: 'Anuncios', items: anuncios },
    { key: 'estudiantes', label: 'Estudiantes', items: estudiantes },
  ].filter((g) => g.items.length);

  return { query: q, groups, error: null };
}

export function renderSearchResults(container, result) {
  if (!container) return;
  if (!result.query || result.query.length < 2) {
    container.innerHTML = '';
    container.hidden = true;
    return;
  }
  if (!result.groups.length) {
    container.hidden = false;
    container.innerHTML = `<p class="ni-zenit-search-empty">Sin resultados para “${escapeHtml(result.query)}”.</p>`;
    return;
  }
  container.hidden = false;
  container.innerHTML = result.groups
    .map((g) => {
      const items = g.items
        .map((item) => {
          const meta = item.meta
            ? `<span class="ni-zenit-search-meta">${escapeHtml(item.meta)}</span>`
            : '';
          return `<a class="ni-zenit-search-item" href="${escapeHtml(item.href)}">
            <span class="ni-zenit-search-type">${escapeHtml(item.typeLabel)}</span>
            <span class="ni-zenit-search-title">${escapeHtml(item.title)}</span>
            ${meta}
          </a>`;
        })
        .join('');
      return `<div class="ni-zenit-search-group">
        <h4>${escapeHtml(g.label)}</h4>
        ${items}
      </div>`;
    })
    .join('');
}
