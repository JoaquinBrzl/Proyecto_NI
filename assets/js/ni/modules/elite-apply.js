import { getClient } from '../client.js';
import { fetchIdentity } from '../identity.js';
import { fetchOwnProfile } from './profile.js';
import { registerModule } from './registry.js';

/**
 * Elite application form (postular-elite.html).
 * Flow: fill form → pending → admin approves → activate button (placeholder for now).
 */

const LOGIN_HREF = 'login.html';
const PRICING_HREF = 'pricing-three-white.html';

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

function buildMessage(answers) {
  return [
    `Motivo: ${answers.motivo}`,
    `Objetivos: ${answers.objetivos}`,
    `Temas: ${answers.temas}`,
    `Participación previa: ${answers.participacion}`,
    `Aporte: ${answers.aporte}`,
    `Disponibilidad: ${answers.disponibilidad}`,
    `WhatsApp: ${answers.whatsapp}`,
    answers.linkedin ? `LinkedIn: ${answers.linkedin}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function fetchLatestApplication(userId) {
  if (!userId) return { application: null, error: null };
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('elite_applications')
    .select('id,status,message,answers,created_at,reviewed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) return { application: null, error };
  return { application: firstRow(data), error: null };
}

export async function submitEliteApplicationForm(userId, answers) {
  const insforge = getClient();
  const payload = {
    user_id: userId,
    status: 'pending',
    message: buildMessage(answers).slice(0, 4000),
    answers,
  };
  return insforge.database
    .from('elite_applications')
    .insert([payload])
    .select('id,status,created_at');
}

function setFormDisabled(form, disabled) {
  if (!form) return;
  form.querySelectorAll('input, select, textarea, button[type="submit"]').forEach((el) => {
    if (el.id === 'ni-elite-activate') return;
    el.disabled = disabled;
  });
}

function fillFromProfile(form, { user, profile, privateContact }) {
  if (!form) return;
  const fullName = `${profile?.nombres || ''} ${profile?.apellidos || ''}`.trim()
    || user?.profile?.name
    || user?.name
    || '';
  form.nombre.value = fullName;
  form.email.value = user?.email || '';
  form.universidad.value = profile?.universidad || '';
  form.carrera.value = profile?.carrera || '';
  form.ciclo.value = profile?.ciclo_academico || '';
  form.whatsapp.value = privateContact?.whatsapp || '';
  form.linkedin.value = profile?.linkedin_url || '';
}

function showActivatePlaceholder(activateBtn, { visible, ready = false }) {
  if (!activateBtn) return;
  activateBtn.classList.toggle('is-visible', visible);
  activateBtn.classList.toggle('is-ready', ready);
  activateBtn.disabled = !ready;
  if (ready) {
    activateBtn.removeAttribute('title');
    activateBtn.textContent = 'Activar acceso Elite →';
  } else if (visible) {
    activateBtn.title = 'Se habilitará en una próxima versión';
    activateBtn.textContent = 'Activar acceso Elite (próximamente)';
  }
}

registerModule('elite-apply', {
  pages: ['postular-elite'],
  async mount(ctx) {
    const hook = ctx.hook;
    if (hook) {
      hook.setAttribute('data-ni-ready', '1');
      hook.hidden = true;
    }

    const form = document.getElementById('ni-elite-apply-form');
    const statusEl = document.getElementById('ni-elite-apply-status');
    const submitBtn = document.getElementById('ni-elite-apply-submit');
    const activateBtn = document.getElementById('ni-elite-activate');
    if (!form) return;

    const snap = ctx.getSessionSnapshot ? ctx.getSessionSnapshot() : { user: null };
    const user = snap.user || ctx.user || null;
    if (!user?.id) {
      window.location.replace(
        `${LOGIN_HREF}?next=${encodeURIComponent('postular-elite.html')}`,
      );
      return;
    }

    const identity = ctx.identity || (await fetchIdentity(user.id));
    const level = identity?.level ?? 0;
    const own = await fetchOwnProfile(user.id);
    fillFromProfile(form, {
      user,
      profile: own.profile,
      privateContact: own.privateContact,
    });

    const { application, error: appError } = await fetchLatestApplication(user.id);
    if (appError) {
      console.warn('[ni/elite-apply] read failed', appError);
    }

    if (level >= 2) {
      setStatus(statusEl, 'Ya tienes NI Elite activo.', 'ok');
      setFormDisabled(form, true);
      showActivatePlaceholder(activateBtn, { visible: false });
      if (submitBtn) submitBtn.hidden = true;
      return;
    }

    const status = application?.status || null;
    if (status === 'pending') {
      setStatus(
        statusEl,
        'Tu postulación ya está en revisión. Te avisaremos cuando el equipo responda.',
        'info',
      );
      setFormDisabled(form, true);
      if (submitBtn) {
        submitBtn.textContent = 'Postulación pendiente';
        submitBtn.disabled = true;
      }
      showActivatePlaceholder(activateBtn, { visible: false });
    } else if (status === 'approved') {
      setStatus(
        statusEl,
        '¡Tu postulación fue aceptada! Pronto podrás activar tu acceso Elite desde aquí.',
        'ok',
      );
      setFormDisabled(form, true);
      if (submitBtn) submitBtn.hidden = true;
      // Placeholder: button visible but disabled until activation is programmed.
      showActivatePlaceholder(activateBtn, { visible: true, ready: false });
    } else if (status === 'rejected') {
      setStatus(
        statusEl,
        'Tu postulación anterior fue rechazada. Puedes volver a enviar una nueva solicitud.',
        'warn',
      );
      showActivatePlaceholder(activateBtn, { visible: false });
    } else {
      showActivatePlaceholder(activateBtn, { visible: false });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.acepto.checked) {
        setStatus(statusEl, 'Debes aceptar las condiciones de evaluación.', 'error');
        return;
      }

      const answers = {
        nombre: String(form.nombre.value || '').trim(),
        email: String(form.email.value || '').trim(),
        universidad: String(form.universidad.value || '').trim(),
        carrera: String(form.carrera.value || '').trim(),
        ciclo: String(form.ciclo.value || '').trim(),
        whatsapp: String(form.whatsapp.value || '').trim(),
        linkedin: String(form.linkedin.value || '').trim(),
        motivo: String(form.motivo.value || '').trim(),
        objetivos: String(form.objetivos.value || '').trim(),
        temas: String(form.temas.value || '').trim(),
        participacion: String(form.participacion.value || '').trim(),
        aporte: String(form.aporte.value || '').trim(),
        disponibilidad: String(form.disponibilidad.value || '').trim(),
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando…';
      }
      setStatus(statusEl, 'Enviando solicitud…', 'info');

      const { error } = await submitEliteApplicationForm(user.id, answers);
      if (error) {
        const msg = error.message || String(error);
        if (/unique|duplicate|one_pending/i.test(msg)) {
          setStatus(statusEl, 'Ya tienes una postulación pendiente.', 'warn');
        } else {
          setStatus(statusEl, msg || 'No se pudo enviar la solicitud.', 'error');
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar solicitud →';
        }
        return;
      }

      setStatus(
        statusEl,
        'Solicitud enviada. Estado: pendiente de evaluación.',
        'ok',
      );
      setFormDisabled(form, true);
      if (submitBtn) {
        submitBtn.textContent = 'Postulación enviada';
        submitBtn.disabled = true;
      }
    });
  },
});

export { PRICING_HREF };
