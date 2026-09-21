import {
  signInWithPassword,
  signUp,
  verifyEmail,
  resendVerificationEmail,
  sendResetPasswordEmail,
  exchangeResetPasswordToken,
  resetPassword,
  signInWithOAuth,
  refreshSession,
  getSessionSnapshot,
  signOut,
} from './session.js';
import { fetchIdentity } from './identity.js';
import {
  displayName,
  fetchInterestsCatalog,
  fetchOwnProfile,
  fetchProfileStats,
  isProfileComplete,
  membershipPlanLabel,
  needsProfileOnboarding,
  profileInitial,
  saveOwnInterests,
  saveOwnProfile,
} from './modules/profile.js';

function $(sel, root = document) {
  return root.querySelector(sel);
}

function setMsg(el, text, isError = false) {
  if (!el) return;
  el.textContent = text || '';
  el.hidden = !text;
  if (!text) {
    el.dataset.niStatus = '';
    el.style.color = '';
    return;
  }
  el.dataset.niStatus = isError ? 'error' : 'ok';
  // Fallback for pages without ni-auth styles
  el.style.color = isError ? '#b42318' : '#027a48';
}

function show(el, on = true) {
  if (!el) return;
  el.hidden = !on;
}

/** login.html */
/** Safe relative next path from ?next= (same-origin page only). */
function safeNextPath() {
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('next');
    let next = fromQuery;
    if (!next) {
      try {
        next = sessionStorage.getItem('ni_oauth_next') || '';
        if (next) sessionStorage.removeItem('ni_oauth_next');
      } catch {
        next = '';
      }
    }
    if (!next) return null;
    if (next.startsWith('http') || next.startsWith('//') || next.includes('..')) return null;
    if (!/^[a-zA-Z0-9_./?#&=%-]+$/.test(next)) return null;
    return next;
  } catch {
    return null;
  }
}

function postLoginHref() {
  return safeNextPath() || 'perfil.html';
}

/** Dedicated first-registration pre-page (modal-style). */
function profileOnboardingHref() {
  const next = safeNextPath();
  return next
    ? `completar-perfil.html?next=${encodeURIComponent(next)}`
    : 'completar-perfil.html';
}

const PENDING_NAME_KEY = 'ni_pending_name';

function stashPendingName(name) {
  try {
    const value = String(name || '').trim();
    if (value) sessionStorage.setItem(PENDING_NAME_KEY, value);
    else sessionStorage.removeItem(PENDING_NAME_KEY);
  } catch {
    /* ignore */
  }
}

function takePendingName() {
  try {
    const value = sessionStorage.getItem(PENDING_NAME_KEY) || '';
    sessionStorage.removeItem(PENDING_NAME_KEY);
    return value;
  } catch {
    return '';
  }
}

function suggestUsername(user) {
  const fromName = (user?.profile?.name || '').toLowerCase().replace(/\s+/g, '_');
  const fromEmail = String(user?.email || '').split('@')[0] || '';
  const base = (fromName || fromEmail || 'estudiante')
    .replace(/[^a-z0-9_]/gi, '')
    .slice(0, 24);
  return base.length >= 3 ? base : `user_${String(user?.id || '').slice(0, 6)}`;
}

function showLoginPanel() {
  show($('#ni-login-panel'), true);
}

function splitDisplayName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { nombres: parts[0] || '', apellidos: parts.slice(1).join(' ') || '' };
}

function fillOnboardingForm(form, { profile, privateContact, user, pendingName = '' }) {
  if (!form) return;
  const p = profile || {};
  const fromPending = splitDisplayName(pendingName);
  const fromUser = splitDisplayName(user?.profile?.name || user?.name || '');
  const whatsapp = privateContact?.whatsapp || '';
  if (form.nombres) form.nombres.value = p.nombres || fromPending.nombres || fromUser.nombres || '';
  if (form.apellidos) form.apellidos.value = p.apellidos || fromPending.apellidos || fromUser.apellidos || '';
  if (form.username) form.username.value = p.username || suggestUsername(user);
  if (form.universidad) form.universidad.value = p.universidad || '';
  if (form.carrera) form.carrera.value = p.carrera || '';
  if (form.ciclo_academico) form.ciclo_academico.value = p.ciclo_academico || '';
  if (form.whatsapp) form.whatsapp.value = whatsapp;
  if (form.linkedin_url) form.linkedin_url.value = p.linkedin_url || '';
  if (form.bio) form.bio.value = p.bio || '';
}

function bindOnboardingForm(form, msg, { doneHref = 'perfil.html' } = {}) {
  if (!form || form.dataset.niOnboardingBound) return;
  form.dataset.niOnboardingBound = '1';

  const linkedinInput = form.linkedin_url;
  linkedinInput?.addEventListener('input', () => {
    // Empty LinkedIn is allowed; only validate when the user typed something.
    if (!String(linkedinInput.value || '').trim()) {
      linkedinInput.setCustomValidity('');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(msg, '');
    const snap = getSessionSnapshot();
    if (!snap.user) {
      setMsg(msg, 'Sesión expirada. Vuelve a ingresar.', true);
      return;
    }

    const requiredFields = [
      ['nombres', 'Nombres'],
      ['apellidos', 'Apellidos'],
      ['username', 'Usuario'],
      ['universidad', 'Centro de estudios'],
      ['carrera', 'Carrera'],
      ['ciclo_academico', 'Ciclo académico'],
      ['whatsapp', 'WhatsApp'],
    ];

    for (const [name, label] of requiredFields) {
      const el = form.elements.namedItem(name);
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) continue;
      const value = String(el.value || '').trim();
      el.value = value;
      if (!value) {
        el.setCustomValidity(`Completa ${label}`);
        el.reportValidity();
        setMsg(msg, `El campo "${label}" es obligatorio.`, true);
        el.focus();
        return;
      }
      el.setCustomValidity('');
      if (!el.checkValidity()) {
        el.reportValidity();
        setMsg(msg, `Revisa el campo "${label}".`, true);
        el.focus();
        return;
      }
    }

    if (linkedinInput) {
      const linkedin = String(linkedinInput.value || '').trim();
      linkedinInput.value = linkedin;
      if (!linkedin) {
        linkedinInput.setCustomValidity('');
      } else if (!/^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(linkedin)) {
        linkedinInput.setCustomValidity('Usa una URL válida de LinkedIn (o déjalo vacío).');
        linkedinInput.reportValidity();
        setMsg(msg, 'LinkedIn inválido. Déjalo vacío o usa una URL de linkedin.com.', true);
        linkedinInput.focus();
        return;
      } else {
        linkedinInput.setCustomValidity('');
      }
    }

    const interestIds = Array.from(
      form.querySelectorAll('input[name="interest_ids"]:checked'),
    ).map((el) => el.value);

    const interestsBox = form.querySelector('#ni-onboarding-interests') || form.querySelector('#ni-interests');
    if (interestsBox && interestsBox.querySelector('input[name="interest_ids"]') && interestIds.length < 1) {
      setMsg(msg, 'Elige al menos un interés.', true);
      interestsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      setMsg(msg, 'Completa todos los campos obligatorios.', true);
      return;
    }

    const payload = {
      nombres: form.nombres.value,
      apellidos: form.apellidos.value,
      username: form.username.value,
      universidad: form.universidad.value,
      carrera: form.carrera.value,
      ciclo_academico: form.ciclo_academico.value,
      whatsapp: form.whatsapp.value,
      linkedin_url: form.linkedin_url?.value || '',
      bio: form.bio?.value || '',
      interestIds,
    };

    if (
      !isProfileComplete(
        {
          nombres: payload.nombres,
          apellidos: payload.apellidos,
          username: payload.username,
          universidad: payload.universidad,
          carrera: payload.carrera,
          ciclo_academico: payload.ciclo_academico,
        },
        { whatsapp: payload.whatsapp },
      )
    ) {
      setMsg(msg, 'Completa todos los campos obligatorios para finalizar el registro.', true);
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const { error } = await saveOwnProfile(snap.user.id, payload);
    if (submitBtn) submitBtn.disabled = false;

    if (error) {
      setMsg(msg, error.message || 'No se pudo guardar el perfil', true);
      return;
    }

    window.location.href = doneHref;
  });
}

/** After auth: enter app if profile complete, otherwise open pre-page. */
async function continueAfterAuth(msg) {
  const snap = getSessionSnapshot();
  if (!snap.user) {
    showLoginPanel();
    return { complete: false };
  }

  setMsg(msg, 'Revisando tu perfil…');
  if (msg) msg.dataset.niStatus = 'info';
  msg && (msg.style.color = '');

  const own = await fetchOwnProfile(snap.user.id);
  if (needsProfileOnboarding(own)) {
    window.location.replace(profileOnboardingHref());
    return { complete: false };
  }

  window.location.replace(postLoginHref());
  return { complete: true };
}

export async function initLoginPage() {
  const form = $('#ni-login-form');
  const msg = $('#ni-auth-msg');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get('error') === 'oauth') {
    setMsg(msg, 'No se pudo completar el acceso con Google/LinkedIn. Intenta de nuevo.', true);
  }

  await refreshSession();
  if (getSessionSnapshot().user) {
    await continueAfterAuth(msg);
  } else {
    showLoginPanel();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(msg, '');
    const email = form.email.value.trim();
    const password = form.password.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    const { error } = await signInWithPassword(email, password);
    if (submitBtn) submitBtn.disabled = false;
    if (error) {
      if (error.statusCode === 403) {
        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
        return;
      }
      setMsg(msg, error.message || 'No se pudo iniciar sesión', true);
      return;
    }
    await continueAfterAuth(msg);
  });

  document.querySelectorAll('[data-ni-oauth]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const provider = btn.getAttribute('data-ni-oauth');
      setMsg(msg, 'Redirigiendo…');
      if (msg) {
        msg.dataset.niStatus = 'info';
        msg.style.color = '';
      }
      // Land on login.html (allowlisted), then continueAfterAuth → completar-perfil
      const { error } = await signInWithOAuth(provider, { redirectPage: 'login.html' });
      if (error) setMsg(msg, error.message || 'OAuth falló', true);
    });
  });
}

/** First-registration pre-page: completar-perfil.html */
export async function initCompletarPerfilPage() {
  const form = $('#ni-onboarding-form');
  const msg = $('#ni-auth-msg');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  let fromOAuth = params.has('insforge_code') || params.get('oauth') === '1';
  try {
    if (sessionStorage.getItem('ni_oauth_pending') === '1') {
      fromOAuth = true;
      sessionStorage.removeItem('ni_oauth_pending');
    }
  } catch {
    /* ignore */
  }

  // Ensure OAuth PKCE exchange finished before reading the session.
  await refreshSession();
  let snap = getSessionSnapshot();

  if (!snap.user && fromOAuth) {
    setMsg(msg, 'Confirmando tu cuenta…');
    if (msg) {
      msg.dataset.niStatus = 'info';
      msg.style.color = '';
    }
    for (let i = 0; i < 3 && !snap.user; i += 1) {
      await new Promise((r) => setTimeout(r, 350));
      snap = await refreshSession();
    }
  }

  if (!snap.user) {
    window.location.replace(fromOAuth ? 'login.html?error=oauth' : 'login.html');
    return;
  }

  // Clean oauth flag from the URL without losing ?next=
  if (params.has('oauth') || params.has('insforge_code')) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('oauth');
      url.searchParams.delete('insforge_code');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    } catch {
      /* ignore */
    }
  }

  const own = await fetchOwnProfile(snap.user.id);
  if (!needsProfileOnboarding(own)) {
    window.location.replace(postLoginHref());
    return;
  }

  if (fromOAuth) {
    setMsg(msg, 'Cuenta lista. Completa tus datos para entrar.');
    if (msg) {
      msg.dataset.niStatus = 'info';
      msg.style.color = '';
    }
  }

  fillOnboardingForm(form, {
    profile: own.profile,
    privateContact: own.privateContact,
    user: snap.user,
    pendingName: takePendingName(),
  });

  const interestsBox = $('#ni-onboarding-interests');
  if (interestsBox) {
    const { interests: catalog, error: catalogError } = await fetchInterestsCatalog({ primaryOnly: true });
    if (catalogError) {
      interestsBox.innerHTML = `<p class="ni-auth-hint ni-auth-hint--left">${escapeHtml(catalogError.message || 'No se pudieron cargar los intereses.')}</p>`;
    } else if (!catalog.length) {
      interestsBox.innerHTML =
        '<p class="ni-auth-hint ni-auth-hint--left">Aún no hay intereses configurados. Pide al admin que los agregue.</p>';
    } else {
      renderInterestOptions(interestsBox, catalog, own.interestIds || []);
    }
  }

  bindOnboardingForm(form, msg, { doneHref: postLoginHref() });
}

/** register.html */
export async function initRegisterPage() {
  const form = $('#ni-register-form');
  const registerPanel = $('#ni-register-panel');
  const verifyBox = $('#ni-verify-box');
  const verifyForm = $('#ni-verify-form');
  const msg = $('#ni-auth-msg');
  if (!form) return;

  let pendingEmail = '';
  let pendingName = '';

  await refreshSession();
  if (getSessionSnapshot().user) {
    await continueAfterAuth(msg);
  }

  async function goToProfileStep() {
    if (pendingName) stashPendingName(pendingName);
    await refreshSession();
    if (!getSessionSnapshot().user) {
      setMsg(msg, 'Cuenta creada. Inicia sesión para completar tu perfil.', true);
      window.location.href = 'login.html';
      return;
    }
    window.location.href = profileOnboardingHref();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(msg, '');
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const passwordConfirm = form.password_confirm?.value || '';
    if (password !== passwordConfirm) {
      setMsg(msg, 'Las contraseñas no coinciden', true);
      return;
    }
    pendingName = name;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    const { data, error } = await signUp({ email, password, name });
    if (submitBtn) submitBtn.disabled = false;
    if (error) {
      setMsg(msg, error.message || 'No se pudo registrar', true);
      return;
    }
    if (data?.requireEmailVerification) {
      pendingEmail = email;
      stashPendingName(pendingName);
      show(registerPanel || form, false);
      show(verifyBox, true);
      if ($('#ni-verify-email')) $('#ni-verify-email').value = email;
      setMsg(msg, 'Te enviamos un código de 6 dígitos a tu correo.');
      if (msg) {
        msg.dataset.niStatus = 'info';
        msg.style.color = '';
      }
      return;
    }
    await goToProfileStep();
  });

  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMsg(msg, '');
      const email = ($('#ni-verify-email')?.value || pendingEmail).trim();
      const otp = verifyForm.otp.value.trim();
      const submitBtn = verifyForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      const { error } = await verifyEmail(email, otp);
      if (submitBtn) submitBtn.disabled = false;
      if (error) {
        setMsg(msg, error.message || 'Código inválido', true);
        return;
      }
      await goToProfileStep();
    });
  }

  const resend = $('#ni-resend-verify');
  if (resend) {
    resend.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = ($('#ni-verify-email')?.value || pendingEmail).trim();
      const { error } = await resendVerificationEmail(email);
      setMsg(msg, error ? error.message : 'Código reenviado.', !!error);
      if (!error && msg) {
        msg.dataset.niStatus = 'ok';
        msg.style.color = '';
      }
    });
  }

  document.querySelectorAll('[data-ni-oauth]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const provider = btn.getAttribute('data-ni-oauth');
      setMsg(msg, 'Redirigiendo…');
      if (msg) {
        msg.dataset.niStatus = 'info';
        msg.style.color = '';
      }
      const { error } = await signInWithOAuth(provider, { redirectPage: 'register.html' });
      if (error) setMsg(msg, error.message || 'OAuth falló', true);
    });
  });
}

/** verify.html */
export async function initVerifyPage() {
  const form = $('#ni-verify-form');
  const msg = $('#ni-auth-msg');
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('email') && form.email) form.email.value = params.get('email');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(msg, '');
    const email = form.email.value.trim();
    const otp = form.otp.value.trim();
    const { error } = await verifyEmail(email, otp);
    if (error) {
      setMsg(msg, error.message || 'Código inválido', true);
      return;
    }
    // Sesión activa → pre-página de perfil si es primer registro.
    window.location.href = 'completar-perfil.html';
  });

  const resend = $('#ni-resend-verify');
  if (resend) {
    resend.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const { error } = await resendVerificationEmail(email);
      setMsg(msg, error ? error.message : 'Código reenviado.', !!error);
    });
  }
}

/** reset-password.html — code flow */
export async function initResetPage() {
  const requestForm = $('#ni-reset-request');
  const codeForm = $('#ni-reset-code');
  const newForm = $('#ni-reset-new');
  const msg = $('#ni-auth-msg');
  let resetToken = null;
  let email = '';

  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMsg(msg, '');
      email = requestForm.email.value.trim();
      const { error } = await sendResetPasswordEmail(email);
      if (error) {
        setMsg(msg, error.message || 'No se pudo enviar el correo', true);
        return;
      }
      show(requestForm, false);
      show(codeForm, true);
      setMsg(msg, 'Revisa tu correo e ingresa el código.');
    });
  }

  if (codeForm) {
    codeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMsg(msg, '');
      const code = codeForm.code.value.trim();
      const { data, error } = await exchangeResetPasswordToken(email, code);
      if (error) {
        setMsg(msg, error.message || 'Código inválido', true);
        return;
      }
      resetToken = data?.token;
      show(codeForm, false);
      show(newForm, true);
    });
  }

  if (newForm) {
    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMsg(msg, '');
      const newPassword = newForm.password.value;
      const { error } = await resetPassword(newPassword, resetToken);
      if (error) {
        setMsg(msg, error.message || 'No se pudo actualizar la contraseña', true);
        return;
      }
      setMsg(msg, 'Contraseña actualizada. Ya puedes ingresar.');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    });
  }
}

function setAvatarInitial(el, letter) {
  if (!el) return;
  el.textContent = letter || '?';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text || '—';
}

function dash(value) {
  const t = String(value || '').trim();
  return t || '—';
}

function refreshFeatherIcons(root) {
  try {
    if (window.feather?.replace) window.feather.replace({ root: root || document });
  } catch {
    /* ignore */
  }
}

function renderInterestTags(container, catalog, selectedIds) {
  if (!container) return;
  const selected = new Set(selectedIds || []);
  const labels = (catalog || [])
    .filter((item) => selected.has(item.id))
    .map((item) => item.label)
    .filter(Boolean);

  if (!labels.length) {
    container.innerHTML = '<p class="ni-profile-empty">Sin intereses seleccionados.</p>';
    return;
  }
  container.innerHTML = labels
    .map((label) => `<span class="ni-profile-interest-tag">${escapeHtml(label)}</span>`)
    .join('');
}

function renderInterestOptions(container, catalog, selectedIds, { filter = '' } = {}) {
  if (!container) return;
  const selected = new Set(selectedIds || []);
  const q = String(filter || '')
    .trim()
    .toLowerCase();
  const filtered = (catalog || []).filter((item) => {
    if (!q) return true;
    const hay = `${item.label || ''} ${item.slug || ''}`.toLowerCase();
    return hay.includes(q);
  });
  if (!catalog.length) {
    container.innerHTML = '<p class="ni-profile-empty">No hay intereses configurados.</p>';
    return;
  }
  if (!filtered.length) {
    container.innerHTML = '<p class="ni-profile-empty">Sin resultados para esa búsqueda.</p>';
    return;
  }
  container.innerHTML = filtered
    .map((item) => {
      const checked = selected.has(item.id) ? 'checked' : '';
      return `
        <label class="ni-interest-chip">
          <input type="checkbox" name="interest_ids" value="${escapeHtml(item.id)}" ${checked}>
          <span>${escapeHtml(item.label)}</span>
        </label>`;
    })
    .join('');
}

function fillProfileView({ profile, whatsapp, email, identity, catalog, interestIds, stats }) {
  const planLabel = membershipPlanLabel(identity?.membership?.plan);
  const active = !identity?.membership || identity.membership.status === 'active';

  setText($('#ni-profile-display-name'), displayName(profile, { email }));
  setText($('#ni-profile-email-view'), email || '—');
  setText($('#ni-profile-plan-label'), planLabel);
  setText($('#ni-membership-plan-label'), planLabel);

  const statusEl = $('#ni-membership-status');
  if (statusEl) {
    statusEl.textContent = active ? 'Activa' : 'Inactiva';
    statusEl.classList.toggle('is-inactive', !active);
  }

  setText($('#ni-view-universidad'), dash(profile?.universidad));
  setText($('#ni-view-carrera'), dash(profile?.carrera));
  setText($('#ni-view-ciclo'), dash(profile?.ciclo_academico));
  setText($('#ni-view-whatsapp'), dash(whatsapp));

  const linkedinEl = $('#ni-view-linkedin');
  if (linkedinEl) {
    const url = String(profile?.linkedin_url || '').trim();
    if (url) {
      linkedinEl.innerHTML = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Ver LinkedIn</a>`;
    } else {
      linkedinEl.textContent = '—';
    }
  }

  renderInterestTags($('#ni-view-interests'), catalog, interestIds);

  setText($('#ni-stat-completed'), String(stats?.completed ?? 0));
  setText($('#ni-stat-enrolled'), String(stats?.enrolled ?? 0));
  setText($('#ni-stat-resources'), String(stats?.resources ?? 0));

  const eliteCta = $('#ni-elite-cta');
  if (eliteCta) {
    const level = Number(identity?.level) || 0;
    eliteCta.hidden = level >= 2;
  }
}

/** perfil.html — dashboard view + edit panel; session required */
export async function initProfilePage() {
  const msg = $('#ni-auth-msg');
  const form = $('#ni-profile-form');
  const gate = $('#ni-profile-gate');
  const avatar = $('#ni-profile-avatar');
  const emailEl = $('#ni-profile-email');
  const privacyNote = $('#ni-privacy-note');
  const editPanel = $('#ni-profile-edit-panel');
  const editToggle = $('#ni-profile-edit-toggle');
  const editCancel = $('#ni-profile-edit-cancel');

  await refreshSession();
  const snap = getSessionSnapshot();
  if (!snap.user) {
    window.location.href = 'login.html';
    return;
  }

  const ownEarly = await fetchOwnProfile(snap.user.id);
  if (needsProfileOnboarding(ownEarly)) {
    window.location.replace('completar-perfil.html');
    return;
  }

  show(gate, true);
  if (privacyNote) show(privacyNote, true);

  const identity = await fetchIdentity(snap.user.id);

  if (emailEl) {
    emailEl.value = snap.user.email || '';
  }

  const [{ interests: catalog }, own, stats] = await Promise.all([
    fetchInterestsCatalog(),
    fetchOwnProfile(snap.user.id),
    fetchProfileStats(snap.user.id),
  ]);

  if (own.error) {
    setMsg(msg, own.error.message || 'No se pudo cargar el perfil', true);
  }

  const profile = own.profile || {};
  const whatsapp = own.privateContact?.whatsapp || '';
  let currentInterestIds = [...(own.interestIds || [])];
  let modalDraftIds = [...currentInterestIds];

  fillProfileView({
    profile,
    whatsapp,
    email: snap.user.email || '',
    identity,
    catalog,
    interestIds: currentInterestIds,
    stats,
  });

  if (form) {
    if (form.nombres) form.nombres.value = profile.nombres || '';
    if (form.apellidos) form.apellidos.value = profile.apellidos || '';
    if (form.username) {
      form.username.value = profile.username || suggestUsername(snap.user);
    }
    if (form.universidad) form.universidad.value = profile.universidad || '';
    if (form.carrera) form.carrera.value = profile.carrera || '';
    if (form.ciclo_academico) form.ciclo_academico.value = profile.ciclo_academico || '';
    if (form.whatsapp) form.whatsapp.value = whatsapp;
    if (form.linkedin_url) form.linkedin_url.value = profile.linkedin_url || '';
    if (form.bio) form.bio.value = profile.bio || '';
  }

  setAvatarInitial(avatar, profileInitial(profile, snap.user));
  refreshFeatherIcons(gate);

  // Interests modal (full catalog + search)
  const interestsOpenBtn = $('#ni-interests-open');
  const interestsModalEl = $('#ni-interests-modal');
  const interestsModalList = $('#ni-interests-modal-list');
  const interestsSearch = $('#ni-interests-search');
  const interestsSaveBtn = $('#ni-interests-save');
  const interestsModalMsg = $('#ni-interests-modal-msg');

  function getBsModal(el) {
    const BS = window.bootstrap;
    if (!BS?.Modal || !el) return null;
    return BS.Modal.getOrCreateInstance(el);
  }

  function collectModalSelectedIds() {
    if (!interestsModalList) return [...modalDraftIds];
    const visibleChecked = Array.from(
      interestsModalList.querySelectorAll('input[name="interest_ids"]:checked'),
    ).map((el) => el.value);
    const visibleIds = new Set(
      Array.from(interestsModalList.querySelectorAll('input[name="interest_ids"]')).map((el) => el.value),
    );
    const keptHidden = modalDraftIds.filter((id) => !visibleIds.has(id));
    return [...new Set([...keptHidden, ...visibleChecked])];
  }

  function paintInterestsModal(filter = '') {
    modalDraftIds = collectModalSelectedIds();
    renderInterestOptions(interestsModalList, catalog, modalDraftIds, { filter });
  }

  interestsOpenBtn?.addEventListener('click', () => {
    modalDraftIds = [...currentInterestIds];
    if (interestsSearch) interestsSearch.value = '';
    setMsg(interestsModalMsg, '');
    paintInterestsModal('');
    getBsModal(interestsModalEl)?.show();
  });

  interestsSearch?.addEventListener('input', () => {
    paintInterestsModal(interestsSearch.value);
  });

  interestsModalList?.addEventListener('change', () => {
    modalDraftIds = collectModalSelectedIds();
  });

  interestsSaveBtn?.addEventListener('click', async () => {
    modalDraftIds = collectModalSelectedIds();
    if (modalDraftIds.length < 1) {
      setMsg(interestsModalMsg, 'Elige al menos un interés.', true);
      return;
    }
    interestsSaveBtn.disabled = true;
    setMsg(interestsModalMsg, 'Guardando…');
    if (interestsModalMsg) interestsModalMsg.dataset.niStatus = 'info';
    const { error } = await saveOwnInterests(snap.user.id, modalDraftIds);
    interestsSaveBtn.disabled = false;
    if (error) {
      setMsg(interestsModalMsg, error.message || 'No se pudo guardar', true);
      return;
    }
    currentInterestIds = [...modalDraftIds];
    renderInterestTags($('#ni-view-interests'), catalog, currentInterestIds);
    setMsg(msg, 'Intereses actualizados.');
    if (msg) msg.dataset.niStatus = 'ok';
    getBsModal(interestsModalEl)?.hide();
  });

  function setEditOpen(open) {
    if (!editPanel) return;
    editPanel.hidden = !open;
    if (editToggle) {
      editToggle.textContent = open ? 'Ocultar edición' : 'Editar perfil';
    }
    if (open) {
      editPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (editToggle) {
    editToggle.addEventListener('click', () => {
      setEditOpen(!!editPanel?.hidden);
    });
  }
  if (editCancel) {
    editCancel.addEventListener('click', () => setEditOpen(false));
  }

  if (form) {
    const refreshInitial = () => {
      const draft = {
        nombres: form.nombres?.value,
        apellidos: form.apellidos?.value,
        username: form.username?.value,
        universidad: form.universidad?.value,
        carrera: form.carrera?.value,
        ciclo_academico: form.ciclo_academico?.value,
      };
      setAvatarInitial(avatar, profileInitial(draft, snap.user));
      setText($('#ni-profile-display-name'), displayName(draft, snap.user));
    };
    form.nombres?.addEventListener('input', refreshInitial);
    form.apellidos?.addEventListener('input', refreshInitial);
    form.username?.addEventListener('input', refreshInitial);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMsg(msg, '');
      if (msg) msg.dataset.niStatus = '';
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const interestIds = currentInterestIds;

      const payload = {
        nombres: form.nombres.value,
        apellidos: form.apellidos.value,
        username: form.username.value,
        universidad: form.universidad.value,
        carrera: form.carrera.value,
        ciclo_academico: form.ciclo_academico.value,
        whatsapp: form.whatsapp.value,
        linkedin_url: form.linkedin_url?.value || '',
        bio: form.bio.value,
        interestIds,
      };

      const { error } = await saveOwnProfile(snap.user.id, payload);

      if (submitBtn) submitBtn.disabled = false;
      if (error) {
        setMsg(msg, error.message || 'No se pudo guardar', true);
        if (msg) msg.dataset.niStatus = 'error';
        return;
      }

      setMsg(msg, 'Perfil guardado.');
      if (msg) msg.dataset.niStatus = 'ok';

      fillProfileView({
        profile: payload,
        whatsapp: payload.whatsapp,
        email: snap.user.email || '',
        identity,
        catalog,
        interestIds,
        stats,
      });
      refreshInitial();
      setEditOpen(false);
      refreshFeatherIcons(gate);
    });
  }

  const logout = $('#ni-logout');
  if (logout) {
    logout.addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut();
      window.location.href = 'index.html';
    });
  }
}
