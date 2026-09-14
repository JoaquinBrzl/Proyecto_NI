import { getClient } from '../client.js';
import { fetchIdentity } from '../identity.js';
import { registerModule } from './registry.js';

/**
 * Pricing / memberships module (pricing-three-white.html only).
 * Pro upgrade is a payment PLACEHOLDER via activate_pro_membership().
 * Elite: postulación → admin review (Edge Function) → activate_elite_membership() demo.
 */

const LOGIN_HREF = 'login.html';

function firstRow(data) {
  if (!data) return null;
  return Array.isArray(data) ? data[0] || null : data;
}

function featureList(features) {
  if (Array.isArray(features)) return features.map(String);
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatPrice(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

async function fetchPlans() {
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('membership_plans')
    .select('slug,name,level,price_monthly_pen,currency,tagline,features,sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(10);
  if (error) return { plans: [], error };
  return { plans: Array.isArray(data) ? data : [], error: null };
}

async function fetchLatestEliteApplication(userId) {
  if (!userId) return { application: null, error: null };
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('elite_applications')
    .select('id,status,message,created_at,reviewed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) return { application: null, error };
  return { application: firstRow(data), error: null };
}

/** PLACEHOLDER — no real payment gateway. */
export async function activateProMembership() {
  const insforge = getClient();
  return insforge.database.rpc('activate_pro_membership');
}

/** PLACEHOLDER — Elite after admin approval (no Stripe). */
export async function activateEliteMembership() {
  const insforge = getClient();
  return insforge.database.rpc('activate_elite_membership');
}

export async function submitEliteApplication(message = '', userId = null) {
  const insforge = getClient();
  let uid = userId;
  if (!uid) {
    const { data, error: userError } = await insforge.auth.getCurrentUser();
    uid = data?.user?.id || null;
    if (userError || !uid) {
      return { data: null, error: userError || new Error('Debes iniciar sesión') };
    }
  }
  return insforge.database
    .from('elite_applications')
    .insert([
      {
        user_id: uid,
        status: 'pending',
        message: String(message || '').trim().slice(0, 1000),
      },
    ])
    .select('id,status,message,created_at');
}

function setStatus(el, text, kind = '') {
  if (!el) return;
  el.textContent = text || '';
  el.dataset.niStatus = kind || '';
  el.hidden = !text;
}

function renderFeatures(ul, features) {
  if (!ul) return;
  ul.innerHTML = '';
  const items = featureList(features);
  const list = items.length
    ? items
    : ['Beneficios del plan según el catálogo NI'];
  for (const item of list) {
    const li = document.createElement('li');
    li.innerHTML = `<i class="feather-check"></i> ${escapeHtml(item)}`;
    ul.appendChild(li);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fillPlanCard(root, plan) {
  if (!root || !plan) return;
  const title = root.querySelector('[data-ni-plan-title]');
  const price = root.querySelector('[data-ni-plan-price]');
  const tagline = root.querySelector('[data-ni-plan-tagline]');
  const features = root.querySelector('[data-ni-plan-features]');
  if (title) title.textContent = plan.name || title.textContent;
  if (price) price.textContent = formatPrice(plan.price_monthly_pen);
  if (tagline) tagline.textContent = plan.tagline || '';
  renderFeatures(features, plan.features);
}

function wireCta(button, { label, disabled, href, onClick }) {
  if (!button) return;
  const textEl = button.querySelector('.btn-text') || button;
  if (textEl) textEl.textContent = label;
  button.classList.toggle('disabled', !!disabled);
  if (disabled) {
    button.setAttribute('aria-disabled', 'true');
    button.removeAttribute('href');
    button.onclick = (e) => e.preventDefault();
    return;
  }
  button.removeAttribute('aria-disabled');
  if (href) {
    button.setAttribute('href', href);
    button.onclick = null;
    return;
  }
  button.setAttribute('href', '#');
  button.onclick = (e) => {
    e.preventDefault();
    if (typeof onClick === 'function') onClick(e);
  };
}

async function refreshUi(ctx) {
  const snap = ctx.getSessionSnapshot ? ctx.getSessionSnapshot() : { user: null };
  const user = snap.user || ctx.user || null;
  const statusEl = document.querySelector('[data-ni-pricing-status]');

  const { plans, error: plansError } = await fetchPlans();
  if (plansError) {
    setStatus(statusEl, 'No se pudo cargar el catálogo de planes.', 'error');
  }

  const bySlug = Object.fromEntries((plans || []).map((p) => [p.slug, p]));
  fillPlanCard(document.querySelector('[data-ni-plan="ni_free"]'), bySlug.ni_free);
  fillPlanCard(document.querySelector('[data-ni-plan="ni_pro"]'), bySlug.ni_pro);
  fillPlanCard(document.querySelector('[data-ni-plan="ni_elite"]'), bySlug.ni_elite);

  let level = 0;
  let identity = ctx.identity || null;
  let eliteApp = null;

  if (user?.id) {
    identity = await fetchIdentity(user.id);
    level = identity?.level ?? 0;
    const appRes = await fetchLatestEliteApplication(user.id);
    eliteApp = appRes.application;
    if (appRes.error) {
      console.warn('[ni/pricing] elite application read failed', appRes.error);
    }
  }

  const freeBtn = document.querySelector('[data-ni-cta="free"]');
  const proBtn = document.querySelector('[data-ni-cta="pro"]');
  const eliteBtn = document.querySelector('[data-ni-cta="elite"]');
  const eliteNote = document.querySelector('[data-ni-elite-note]');

  if (!user) {
    wireCta(freeBtn, { label: 'Iniciar sesión', href: LOGIN_HREF });
    wireCta(proBtn, { label: 'Iniciar sesión', href: LOGIN_HREF });
    wireCta(eliteBtn, { label: 'Iniciar sesión', href: LOGIN_HREF });
    setStatus(eliteNote, 'Inicia sesión para postular a NI Elite.', 'info');
    setStatus(statusEl, 'Inicia sesión para gestionar tu membresía.', 'info');
    return;
  }

  // Free
  if (level === 0) {
    wireCta(freeBtn, { label: 'Plan actual · Incluido', disabled: true });
  } else {
    wireCta(freeBtn, { label: 'Incluido en tu cuenta', disabled: true });
  }

  // Pro — PLACEHOLDER payment
  if (level >= 2) {
    wireCta(proBtn, { label: 'Incluido en Elite', disabled: true });
  } else if (level >= 1) {
    wireCta(proBtn, { label: 'Plan actual', disabled: true });
  } else {
    wireCta(proBtn, {
      label: 'Activar Pro (demo)',
      onClick: async () => {
        setStatus(statusEl, 'Activando NI Pro (sin pago real)…', 'info');
        const { data, error } = await activateProMembership();
        if (error) {
          setStatus(statusEl, error.message || 'No se pudo activar Pro.', 'error');
          return;
        }
        setStatus(
          statusEl,
          'NI Pro activado (placeholder — no hay pasarela de pago).',
          'ok'
        );
        await refreshUi(ctx);
        void data;
      },
    });
  }

  // Elite — application → approval → payment demo
  const eliteStatus = eliteApp?.status || null;
  if (level >= 2) {
    wireCta(eliteBtn, { label: 'Elite activa', disabled: true });
    setStatus(eliteNote, 'Tu membresía NI Elite está activa.', 'ok');
  } else if (eliteStatus === 'approved') {
    wireCta(eliteBtn, {
      label: 'Activar Elite (demo)',
      onClick: async () => {
        setStatus(statusEl, 'Activando NI Elite (sin pago real)…', 'info');
        const { data, error } = await activateEliteMembership();
        if (error) {
          setStatus(statusEl, error.message || 'No se pudo activar Elite.', 'error');
          return;
        }
        setStatus(
          statusEl,
          'NI Elite activado (placeholder — no hay pasarela de pago).',
          'ok'
        );
        await refreshUi(ctx);
        void data;
      },
    });
    setStatus(
      eliteNote,
      'Tu postulación fue aprobada. Activa Elite con el pago demo (sin cobro real).',
      'ok'
    );
  } else if (eliteStatus === 'pending') {
    wireCta(eliteBtn, { label: 'Postulación pendiente', disabled: true });
    setStatus(eliteNote, 'Tu postulación a NI Elite está en revisión.', 'info');
  } else if (eliteStatus === 'rejected') {
    wireCta(eliteBtn, {
      label: 'Volver a postular',
      onClick: () => postularElite(ctx, statusEl),
    });
    setStatus(eliteNote, 'Tu postulación anterior fue rechazada. Puedes volver a postular.', 'warn');
  } else {
    wireCta(eliteBtn, {
      label: 'Postular a Elite',
      onClick: () => postularElite(ctx, statusEl),
    });
    setStatus(
      eliteNote,
      'NI Elite: postula, un admin aprueba y luego activas el pago demo.',
      'info'
    );
  }

  if (!statusEl?.textContent) {
    const planLabel =
      level >= 2 ? 'NI Elite' : level >= 1 ? 'NI Pro' : 'NI Free';
    setStatus(statusEl, `Membresía actual: ${planLabel}`, 'ok');
  }
}

async function postularElite(ctx, statusEl) {
  setStatus(statusEl, 'Enviando postulación…', 'info');
  const snap = ctx.getSessionSnapshot ? ctx.getSessionSnapshot() : { user: null };
  const userId = snap.user?.id || ctx.user?.id || null;
  const { data, error } = await submitEliteApplication(
    'Postulación desde pricing-three-white.html',
    userId
  );
  if (error) {
    const msg = error.message || String(error);
    if (/unique|duplicate|one_pending/i.test(msg)) {
      setStatus(statusEl, 'Ya tienes una postulación pendiente.', 'warn');
    } else {
      setStatus(statusEl, msg || 'No se pudo enviar la postulación.', 'error');
    }
    return;
  }
  setStatus(statusEl, 'Postulación enviada. Estado: pendiente.', 'ok');
  await refreshUi(ctx);
  void data;
}

registerModule('pricing', {
  pages: ['pricing'],
  async mount(ctx) {
    const hook = ctx.hook;
    if (hook) {
      hook.setAttribute('data-ni-ready', '1');
      hook.hidden = true;
    }

    try {
      await refreshUi(ctx);
    } catch (err) {
      console.error('[ni/pricing] mount failed', err);
      setStatus(
        document.querySelector('[data-ni-pricing-status]'),
        err.message || 'Error al cargar membresías.',
        'error'
      );
    }

    if (typeof ctx.subscribeSession === 'function') {
      ctx.subscribeSession(() => {
        refreshUi(ctx).catch((e) => console.warn('[ni/pricing] refresh', e));
      });
    }
  },
});

export {};
