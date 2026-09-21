import { getClient } from '../client.js';
import { setProfile as setNativeProfile } from '../session.js';

/**
 * Own-profile load/save: public profiles + private WhatsApp + interests.
 * Email stays on Auth and is never written to app tables.
 */

function firstRow(data) {
  if (!data) return null;
  return Array.isArray(data) ? data[0] || null : data;
}

function normalizeUsername(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function profileInitial(profile, user) {
  const fromNames = `${profile?.nombres || ''} ${profile?.apellidos || ''}`.trim();
  const source =
    fromNames ||
    profile?.username ||
    user?.profile?.name ||
    user?.email ||
    '?';
  const letter = source.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '').charAt(0);
  return (letter || '?').toUpperCase();
}

export function displayName(profile, user) {
  const composed = `${profile?.nombres || ''} ${profile?.apellidos || ''}`.trim();
  return composed || profile?.username || user?.profile?.name || user?.email || 'Usuario';
}

/** True when the student filled the required academic/contact fields. */
export function isProfileComplete(profile, privateContact = null) {
  const p = profile || {};
  const required = [
    p.nombres,
    p.apellidos,
    p.username,
    p.universidad,
    p.carrera,
    p.ciclo_academico,
    privateContact?.whatsapp,
  ];
  return required.every((v) => String(v || '').trim().length > 0);
}

/**
 * Force onboarding when profile is missing, incomplete, or could not be verified.
 * (Never treat a fetch error as "complete" — that was skipping the gate.)
 */
export function needsProfileOnboarding(own) {
  if (!own || own.error) return true;
  return !isProfileComplete(own.profile, own.privateContact);
}

export async function fetchInterestsCatalog({ primaryOnly = false } = {}) {
  const insforge = getClient();
  let query = insforge.database
    .from('interests')
    .select('id,slug,label,sort_order,is_primary')
    .order('sort_order', { ascending: true })
    .limit(200);
  if (primaryOnly) {
    query = query.eq('is_primary', true);
  }
  const { data, error } = await query;
  if (error) return { interests: [], error };
  return { interests: Array.isArray(data) ? data : [], error: null };
}

export function slugifyInterestLabel(label) {
  const base = String(label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base.length >= 2 ? base : `interes-${Date.now().toString(36).slice(-6)}`;
}

export async function createInterest({ label, slug, sort_order = 0, is_primary = false }) {
  const insforge = getClient();
  const cleanLabel = String(label || '').trim();
  if (!cleanLabel) return { error: { message: 'El nombre del interés es obligatorio.' } };
  let cleanSlug = String(slug || '').trim().toLowerCase() || slugifyInterestLabel(cleanLabel);
  cleanSlug = cleanSlug.replace(/[^a-z0-9-]/g, '').slice(0, 40);
  if (cleanSlug.length < 2) {
    return { error: { message: 'Slug inválido (mín. 2 caracteres: a-z, 0-9, -).' } };
  }
  const order = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;
  const { data, error } = await insforge.database
    .from('interests')
    .insert([{
      label: cleanLabel,
      slug: cleanSlug,
      sort_order: order,
      is_primary: Boolean(is_primary),
    }]);
  if (error) {
    const msg = error.message || '';
    if (/unique|duplicate|interests_slug/i.test(msg)) {
      return { error: { message: 'Ese slug ya existe. Elige otro.' } };
    }
    return { error };
  }
  return { data: Array.isArray(data) ? data[0] : data, error: null };
}

export async function updateInterest(id, { label, slug, sort_order, is_primary }) {
  if (!id) return { error: { message: 'Interés inválido.' } };
  const insforge = getClient();
  const patch = {};
  if (label !== undefined) {
    const cleanLabel = String(label || '').trim();
    if (!cleanLabel) return { error: { message: 'El nombre del interés es obligatorio.' } };
    patch.label = cleanLabel;
  }
  if (slug !== undefined) {
    let cleanSlug = String(slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    if (cleanSlug.length < 2) {
      return { error: { message: 'Slug inválido (mín. 2 caracteres: a-z, 0-9, -).' } };
    }
    patch.slug = cleanSlug;
  }
  if (sort_order !== undefined) {
    patch.sort_order = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;
  }
  if (is_primary !== undefined) {
    patch.is_primary = Boolean(is_primary);
  }
  const { data, error } = await insforge.database
    .from('interests')
    .update(patch)
    .eq('id', id);
  if (error) {
    const msg = error.message || '';
    if (/unique|duplicate|interests_slug/i.test(msg)) {
      return { error: { message: 'Ese slug ya existe. Elige otro.' } };
    }
    return { error };
  }
  return { data: Array.isArray(data) ? data[0] : data, error: null };
}

export async function deleteInterest(id) {
  if (!id) return { error: { message: 'Interés inválido.' } };
  const insforge = getClient();
  const { error } = await insforge.database.from('interests').delete().eq('id', id);
  return { error: error || null };
}

/** Persist only the user's interest selections. */
export async function saveOwnInterests(userId, interestIds) {
  if (!userId) return { error: { message: 'Sesión inválida' } };
  return syncUserInterests(userId, interestIds);
}

export async function fetchUserInterestIds(userId) {
  if (!userId) return { ids: [], error: null };
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('user_interests')
    .select('interest_id')
    .eq('user_id', userId)
    .limit(100);
  if (error) return { ids: [], error };
  const rows = Array.isArray(data) ? data : [];
  return { ids: rows.map((r) => r.interest_id).filter(Boolean), error: null };
}

export async function fetchOwnProfile(userId) {
  if (!userId) {
    return { profile: null, privateContact: null, interestIds: [], error: new Error('missing user') };
  }
  const insforge = getClient();
  const [profileRes, privateRes, interestsRes] = await Promise.all([
    insforge.database
      .from('profiles')
      .select('user_id,username,nombres,apellidos,universidad,carrera,ciclo_academico,bio,linkedin_url,updated_at')
      .eq('user_id', userId)
      .limit(1),
    insforge.database
      .from('user_private_contacts')
      .select('user_id,whatsapp')
      .eq('user_id', userId)
      .limit(1),
    fetchUserInterestIds(userId),
  ]);

  const error = profileRes.error || null;
  if (privateRes.error) {
    console.warn('[ni] private contact read failed', privateRes.error);
  }
  if (interestsRes.error) {
    console.warn('[ni] interests read failed', interestsRes.error);
  }
  return {
    profile: firstRow(profileRes.data),
    privateContact: privateRes.error ? null : firstRow(privateRes.data),
    interestIds: interestsRes.ids || [],
    error,
  };
}

/**
 * Public-safe projection helper for future public profile pages.
 * Never includes email or WhatsApp.
 */
export function toPublicProfile(profile, interestLabels = []) {
  if (!profile) return null;
  return {
    user_id: profile.user_id,
    username: profile.username,
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    universidad: profile.universidad,
    carrera: profile.carrera,
    ciclo_academico: profile.ciclo_academico,
    bio: profile.bio,
    linkedin_url: profile.linkedin_url || '',
    interests: interestLabels,
  };
}

/** Normalize / validate LinkedIn URL for storage. Empty string if blank. */
export function normalizeLinkedinUrl(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  let url = t;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) {
      return null;
    }
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

async function upsertProfile(userId, fields) {
  const insforge = getClient();
  const username = normalizeUsername(fields.username);
  if (!username || username.length < 3) {
    return { error: { message: 'El username debe tener entre 3 y 30 caracteres (letras, números o _).' } };
  }

  const linkedin = normalizeLinkedinUrl(fields.linkedin_url);
  if (linkedin === null) {
    return { error: { message: 'LinkedIn inválido. Usa una URL de linkedin.com.' } };
  }

  const row = {
    user_id: userId,
    username,
    nombres: String(fields.nombres || '').trim(),
    apellidos: String(fields.apellidos || '').trim(),
    universidad: String(fields.universidad || '').trim(),
    carrera: String(fields.carrera || '').trim(),
    ciclo_academico: String(fields.ciclo_academico || '').trim(),
    bio: String(fields.bio || '').trim(),
    linkedin_url: linkedin,
  };

  const existing = await insforge.database
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .limit(1);

  if (existing.error) return { error: existing.error };

  if (firstRow(existing.data)) {
    const { user_id: _uid, ...patch } = row;
    const { data, error } = await insforge.database
      .from('profiles')
      .update(patch)
      .eq('user_id', userId);
    return { data, error };
  }

  const { data, error } = await insforge.database.from('profiles').insert([row]);
  return { data, error };
}

async function upsertPrivateContact(userId, whatsapp) {
  const insforge = getClient();
  const row = {
    user_id: userId,
    whatsapp: String(whatsapp || '').trim(),
  };

  const existing = await insforge.database
    .from('user_private_contacts')
    .select('user_id')
    .eq('user_id', userId)
    .limit(1);

  if (existing.error) return { error: existing.error };

  if (firstRow(existing.data)) {
    return insforge.database
      .from('user_private_contacts')
      .update({ whatsapp: row.whatsapp })
      .eq('user_id', userId);
  }

  return insforge.database.from('user_private_contacts').insert([row]);
}

async function syncUserInterests(userId, interestIds) {
  const insforge = getClient();
  const wanted = Array.from(new Set((interestIds || []).filter(Boolean)));

  const { ids: current, error: readError } = await fetchUserInterestIds(userId);
  if (readError) return { error: readError };

  const currentSet = new Set(current);
  const wantedSet = new Set(wanted);
  const toAdd = wanted.filter((id) => !currentSet.has(id));
  const toRemove = current.filter((id) => !wantedSet.has(id));

  if (toRemove.length) {
    for (const interestId of toRemove) {
      const { error } = await insforge.database
        .from('user_interests')
        .delete()
        .eq('user_id', userId)
        .eq('interest_id', interestId);
      if (error) return { error };
    }
  }

  if (toAdd.length) {
    const { error } = await insforge.database.from('user_interests').insert(
      toAdd.map((interest_id) => ({ user_id: userId, interest_id }))
    );
    if (error) return { error };
  }

  return { error: null };
}

/**
 * Persist own profile + private WhatsApp + interests.
 * Also syncs Auth native `name` (public display) — never WhatsApp/email.
 */
export async function saveOwnProfile(userId, payload) {
  if (!userId) return { error: { message: 'Sesión inválida' } };

  const profileResult = await upsertProfile(userId, payload);
  if (profileResult.error) {
    const msg = profileResult.error.message || '';
    if (/unique|duplicate|profiles_username/i.test(msg)) {
      return { error: { message: 'Ese username ya está en uso. Elige otro.' } };
    }
    return { error: profileResult.error };
  }

  const privateResult = await upsertPrivateContact(userId, payload.whatsapp);
  if (privateResult.error) return { error: privateResult.error };

  const interestsResult = await syncUserInterests(userId, payload.interestIds);
  if (interestsResult.error) return { error: interestsResult.error };

  const name = `${String(payload.nombres || '').trim()} ${String(payload.apellidos || '').trim()}`.trim()
    || normalizeUsername(payload.username)
    || undefined;
  if (name) {
    const { error: nativeError } = await setNativeProfile({ name });
    if (nativeError) {
      // Non-fatal: app tables already saved
      console.warn('[ni] native name sync failed', nativeError);
    }
  }

  return { error: null };
}

/**
 * Profile dashboard counts. Failures → zeros (do not break the page).
 * - enrolled: workshop_enrollments for user
 * - completed: enrolled workshops with ends_at in the past
 * - resources: resource_downloads for user
 */
export async function fetchProfileStats(userId) {
  const empty = { completed: 0, enrolled: 0, resources: 0 };
  if (!userId) return empty;

  const insforge = getClient();
  const nowIso = new Date().toISOString();

  try {
    const [enrollRes, downloadsRes] = await Promise.all([
      insforge.database
        .from('workshop_enrollments')
        .select('id,workshop_id')
        .eq('user_id', userId)
        .limit(500),
      insforge.database
        .from('resource_downloads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    const enrollRows = Array.isArray(enrollRes.data) ? enrollRes.data : [];
    const enrolled = enrollRows.length;
    let completed = 0;

    const workshopIds = [...new Set(enrollRows.map((r) => r.workshop_id).filter(Boolean))];
    if (workshopIds.length) {
      const { data: workshops, error: wsError } = await insforge.database
        .from('workshops')
        .select('id,ends_at')
        .in('id', workshopIds)
        .limit(500);
      if (!wsError && Array.isArray(workshops)) {
        const ended = new Set(
          workshops.filter((w) => w.ends_at && String(w.ends_at) < nowIso).map((w) => w.id),
        );
        completed = enrollRows.filter((r) => ended.has(r.workshop_id)).length;
      }
    }

    const resources =
      typeof downloadsRes.count === 'number'
        ? downloadsRes.count
        : Array.isArray(downloadsRes.data)
          ? downloadsRes.data.length
          : 0;

    if (enrollRes.error || downloadsRes.error) {
      console.warn('[ni] profile stats partial', enrollRes.error || downloadsRes.error);
    }

    return { completed, enrolled, resources };
  } catch (err) {
    console.warn('[ni] profile stats failed', err);
    return empty;
  }
}

export function membershipPlanLabel(plan) {
  const p = String(plan || 'ni_free').toLowerCase();
  if (p === 'ni_elite' || p === 'elite') return 'NI Elite';
  if (p === 'ni_pro' || p === 'pro') return 'NI Pro';
  return 'NI Free';
}
