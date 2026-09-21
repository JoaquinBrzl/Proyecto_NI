import { getClient } from '../client.js';
import { fetchIdentity } from '../identity.js';
import { registerModule } from './registry.js';

/**
 * Pricing / memberships module (pricing-three-white.html + index).
 * Pro upgrade is a payment PLACEHOLDER via activate_pro_membership().
 * Elite: postulación → admin review (Edge Function) → activate_elite_membership() demo.
 */

const LOGIN_HREF = 'login.html';
const ELITE_APPLY_HREF = 'postular-elite.html';

/** Visual catalog aligned with Zenit pricing cards (includes / excludes). */
const PLAN_UI = {
  ni_free: {
    period: 'Gratis para siempre',
    tagline: 'Ideal para estudiantes que recién conocen la comunidad.',
    includes: [
      'Perfil en Grupo NI',
      'Acceso a anuncios generales',
      'Eventos abiertos de la comunidad',
      'Algunos materiales gratuitos',
      'Match Académico básico',
      'Soporte por correo',
    ],
    excludes: [
      'Descarga de certificados',
      'Talleres exclusivos Pro',
      'Recursos premium completos',
      'Prioridad en inscripciones',
      'Comunidad privada Elite',
    ],
  },
  ni_pro: {
    period: 'por mes',
    tagline: 'Para estudiantes que desean una experiencia más completa.',
    includes: [
      'Todo lo de NI Free',
      'Talleres exclusivos Pro',
      'Recursos premium',
      'Prioridad en inscripciones',
      'Certificados descargables',
      'Match Académico ampliado',
      'Networking con la comunidad',
      'Soporte prioritario',
    ],
    excludes: [
      'Comunidad privada Elite',
      'Encuentros con líderes',
      'Mentoría 1:1',
    ],
  },
  ni_elite: {
    period: 'por mes (previa aprobación)',
    tagline: 'Para estudiantes comprometidos que quieren ser parte de una comunidad exclusiva.',
    includes: [
      'Todo lo de NI Pro',
      'Talleres grabados completos',
      'Comunidad privada Elite',
      'Networking directo con líderes',
      'Mentoría y acompañamiento',
      'Eventos exclusivos',
      'Acceso anticipado a convocatorias',
      'Prioridad máxima en cupos',
      'Badge Elite en perfil',
      'Soporte dedicado',
    ],
    excludes: [
      'Acceso automático (requiere aprobación)',
      'Sin postulación previa',
    ],
  },
};

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

function splitFeatures(features, slug) {
  const fallback = PLAN_UI[slug] || { includes: [], excludes: [] };
  if (features && typeof features === 'object' && !Array.isArray(features)) {
    const includes = featureList(features.includes || features.include || []);
    const excludes = featureList(features.excludes || features.exclude || []);
    return {
      includes: includes.length ? includes : fallback.includes,
      excludes: excludes.length ? excludes : fallback.excludes,
    };
  }
  // Legacy string[] from DB — keep visual catalog for includes/excludes.
  return {
    includes: fallback.includes,
    excludes: fallback.excludes,
  };
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFeatureList(ul, items, { excluded = false } = {}) {
  if (!ul) return;
  const cls = excluded ? 'ni-pricing-ico ni-pricing-ico--x' : 'ni-pricing-ico ni-pricing-ico--check';
  const list = Array.isArray(items) ? items : [];
  ul.innerHTML = list
    .map((item) => `<li><span class="${cls}" aria-hidden="true"></span><span>${escapeHtml(item)}</span></li>`)
    .join('');
}

function fillPlanCard(root, plan, slug) {
  if (!root) return;
  const ui = PLAN_UI[slug] || {};
  const title = root.querySelector('[data-ni-plan-title]');
  const price = root.querySelector('[data-ni-plan-price]');
  const tagline = root.querySelector('[data-ni-plan-tagline]');
  const period = root.querySelector('[data-ni-plan-period]');
  const includes = root.querySelector('[data-ni-plan-includes]');
  const excludes = root.querySelector('[data-ni-plan-excludes]');
  const highlights = root.querySelector('[data-ni-plan-highlights]');

  if (title) title.textContent = plan?.name || title.textContent;
  if (price) price.textContent = formatPrice(plan?.price_monthly_pen ?? (slug === 'ni_free' ? 0 : slug === 'ni_pro' ? 30 : 50));
  if (tagline) tagline.textContent = ui.tagline || plan?.tagline || '';
  if (period) period.textContent = ui.period || '';

  const split = splitFeatures(plan?.features, slug);
  renderFeatureList(includes, split.includes, { excluded: false });
  renderFeatureList(excludes, split.excludes, { excluded: true });

  // Home teaser: show a short highlights list (no "no incluye").
  if (highlights) {
    const preview = (split.includes || ui.includes || []).slice(0, 4);
    renderFeatureList(highlights, preview, { excluded: false });
  }
}

function wireCta(button, { label, disabled, href, onClick }) {
  if (!button) return;
  const textEl = button.querySelector('.btn-text');
  if (textEl) textEl.textContent = label;
  else button.textContent = label;

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
  const isTeaser = Boolean(document.querySelector('.ni-pricing-card--teaser'));

  const { plans, error: plansError } = await fetchPlans();
  if (plansError && !isTeaser) {
    setStatus(statusEl, 'No se pudo cargar el catálogo de planes.', 'error');
  }

  const bySlug = Object.fromEntries((plans || []).map((p) => [p.slug, p]));
  fillPlanCard(document.querySelector('[data-ni-plan="ni_free"]'), bySlug.ni_free, 'ni_free');
  fillPlanCard(document.querySelector('[data-ni-plan="ni_pro"]'), bySlug.ni_pro, 'ni_pro');
  fillPlanCard(document.querySelector('[data-ni-plan="ni_elite"]'), bySlug.ni_elite, 'ni_elite');

  // Home teaser: only summary + link to membresías (no CTA / benefits logic).
  if (isTeaser) return;

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
  const freeCard = document.querySelector('[data-ni-plan="ni_free"]');
  const proCard = document.querySelector('[data-ni-plan="ni_pro"]');
  const eliteCard = document.querySelector('[data-ni-plan="ni_elite"]');

  freeCard?.classList.toggle('is-current', level === 0 && !!user);
  proCard?.classList.toggle('is-current', level === 1);
  eliteCard?.classList.toggle('is-current', level >= 2);

  if (!user) {
    wireCta(freeBtn, { label: 'Iniciar sesión', href: LOGIN_HREF });
    wireCta(proBtn, { label: 'Elegir NI Pro →', href: LOGIN_HREF });
    wireCta(eliteBtn, {
      label: 'Postular a NI Elite →',
      href: `${LOGIN_HREF}?next=${encodeURIComponent(ELITE_APPLY_HREF)}`,
    });
    setStatus(eliteNote, 'Inicia sesión para postular a NI Elite.', 'info');
    setStatus(statusEl, 'Inicia sesión para gestionar tu membresía.', 'info');
    return;
  }

  if (level === 0) {
    wireCta(freeBtn, { label: '✓ Plan actual', disabled: true });
  } else {
    wireCta(freeBtn, { label: 'Incluido en tu cuenta', disabled: true });
  }

  if (level >= 2) {
    wireCta(proBtn, { label: 'Incluido en Elite', disabled: true });
  } else if (level >= 1) {
    wireCta(proBtn, { label: '✓ Plan actual', disabled: true });
  } else {
    wireCta(proBtn, {
      label: 'Elegir NI Pro →',
      onClick: async () => {
        setStatus(statusEl, 'Activando NI Pro (sin pago real)…', 'info');
        const { data, error } = await activateProMembership();
        if (error) {
          setStatus(statusEl, error.message || 'No se pudo activar Pro.', 'error');
          return;
        }
        setStatus(statusEl, 'NI Pro activado (placeholder — no hay pasarela de pago).', 'ok');
        await refreshUi(ctx);
        void data;
      },
    });
  }

  const eliteStatus = eliteApp?.status || null;
  if (level >= 2) {
    wireCta(eliteBtn, { label: '✓ Elite activa', disabled: true });
    setStatus(eliteNote, 'Tu membresía NI Elite está activa.', 'ok');
  } else if (eliteStatus === 'approved') {
    wireCta(eliteBtn, {
      label: 'Ver activación Elite →',
      href: ELITE_APPLY_HREF,
    });
    setStatus(
      eliteNote,
      'Tu postulación fue aceptada. El botón de activación se habilitará pronto.',
      'ok',
    );
  } else if (eliteStatus === 'pending') {
    wireCta(eliteBtn, { label: 'Postulación pendiente', href: ELITE_APPLY_HREF });
    setStatus(eliteNote, 'Tu postulación a NI Elite está en revisión.', 'info');
  } else if (eliteStatus === 'rejected') {
    wireCta(eliteBtn, { label: 'Volver a postular →', href: ELITE_APPLY_HREF });
    setStatus(eliteNote, 'Tu postulación anterior fue rechazada. Puedes volver a postular.', 'warn');
  } else {
    wireCta(eliteBtn, { label: 'Postular a NI Elite →', href: ELITE_APPLY_HREF });
    setStatus(eliteNote, 'Completa el formulario de postulación. Un admin revisará tu solicitud.', 'info');
  }

  if (!statusEl?.textContent) {
    const planLabel = level >= 2 ? 'NI Elite' : level >= 1 ? 'NI Pro' : 'NI Free';
    setStatus(statusEl, `Membresía actual: ${planLabel}`, 'ok');
  }
}

registerModule('pricing', {
  pages: ['pricing', 'home'],
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
        'error',
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
