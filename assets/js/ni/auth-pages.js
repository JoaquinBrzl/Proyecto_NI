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
  profileInitial,
  saveOwnProfile,
} from './modules/profile.js';

function $(sel, root = document) {
  return root.querySelector(sel);
}

function setMsg(el, text, isError = false) {
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#b42318' : '#027a48';
  el.hidden = !text;
}

function show(el, on = true) {
  if (!el) return;
  el.hidden = !on;
}

/** login.html */
/** Safe relative next path from ?next= (same-origin page only). */
function safeNextPath() {
  try {
    const next = new URLSearchParams(window.location.search).get('next');
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

export async function initLoginPage() {
  const form = $('#ni-login-form');
  const msg = $('#ni-auth-msg');
  if (!form) return;

  await refreshSession();
  if (getSessionSnapshot().user) {
    window.location.href = postLoginHref();
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(msg, '');
    const email = form.email.value.trim();
    const password = form.password.value;
    const { error } = await signInWithPassword(email, password);
    if (error) {
      if (error.statusCode === 403) {
        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
        return;
      }
      setMsg(msg, error.message || 'No se pudo iniciar sesión', true);
      return;
    }
    window.location.href = postLoginHref();
  });

  document.querySelectorAll('[data-ni-oauth]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const provider = btn.getAttribute('data-ni-oauth');
      const { error } = await signInWithOAuth(provider);
      if (error) setMsg(msg, error.message || 'OAuth falló', true);
    });
  });
}

/** register.html */
export async function initRegisterPage() {
  const form = $('#ni-register-form');
  const verifyBox = $('#ni-verify-box');
  const verifyForm = $('#ni-verify-form');
  const msg = $('#ni-auth-msg');
  if (!form) return;

  let pendingEmail = '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(msg, '');
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const { data, error } = await signUp({ email, password, name });
    if (error) {
      setMsg(msg, error.message || 'No se pudo registrar', true);
      return;
    }
    if (data?.requireEmailVerification) {
      pendingEmail = email;
      show(form, false);
      show(verifyBox, true);
      if ($('#ni-verify-email')) $('#ni-verify-email').value = email;
      setMsg(msg, 'Te enviamos un código de 6 dígitos a tu correo.');
      return;
    }
    window.location.href = 'perfil.html';
  });

  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMsg(msg, '');
      const email = ($('#ni-verify-email')?.value || pendingEmail).trim();
      const otp = verifyForm.otp.value.trim();
      const { error } = await verifyEmail(email, otp);
      if (error) {
        setMsg(msg, error.message || 'Código inválido', true);
        return;
      }
      window.location.href = 'perfil.html';
    });
  }

  const resend = $('#ni-resend-verify');
  if (resend) {
    resend.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = ($('#ni-verify-email')?.value || pendingEmail).trim();
      const { error } = await resendVerificationEmail(email);
      setMsg(msg, error ? error.message : 'Código reenviado.', !!error);
    });
  }
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
    window.location.href = 'perfil.html';
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

function renderInterestOptions(container, catalog, selectedIds) {
  if (!container) return;
  const selected = new Set(selectedIds || []);
  if (!catalog.length) {
    container.innerHTML = '<p class="description mb--0">No hay intereses configurados.</p>';
    return;
  }
  container.innerHTML = catalog
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

function suggestUsername(user) {
  const emailLocal = (user?.email || '').split('@')[0] || '';
  const fromName = (user?.profile?.name || '').toLowerCase().replace(/\s+/g, '_');
  const raw = (fromName || emailLocal || 'usuario').replace(/[^a-z0-9_]/gi, '').toLowerCase();
  return raw.slice(0, 30) || 'usuario';
}

/** perfil.html — edit own profile only; session required */
export async function initProfilePage() {
  const msg = $('#ni-auth-msg');
  const form = $('#ni-profile-form');
  const meta = $('#ni-identity-meta');
  const gate = $('#ni-profile-gate');
  const avatar = $('#ni-profile-avatar');
  const emailEl = $('#ni-profile-email');
  const interestsBox = $('#ni-interests');
  const privacyNote = $('#ni-privacy-note');

  await refreshSession();
  const snap = getSessionSnapshot();
  if (!snap.user) {
    window.location.href = 'login.html';
    return;
  }

  show(gate, true);
  if (privacyNote) show(privacyNote, true);

  const identity = await fetchIdentity(snap.user.id);
  if (meta) {
    const plan = identity.membership?.plan || 'ni_free';
    const planLabel = plan.replace(/^ni_/, 'NI ').replace(/\b\w/g, (c) => c.toUpperCase());
    meta.textContent = `Rol: ${identity.role} · Membresía: ${planLabel} (nivel ${identity.level})`;
  }

  if (emailEl) {
    emailEl.value = snap.user.email || '';
  }

  const [{ interests: catalog }, own] = await Promise.all([
    fetchInterestsCatalog(),
    fetchOwnProfile(snap.user.id),
  ]);

  if (own.error) {
    setMsg(msg, own.error.message || 'No se pudo cargar el perfil', true);
  }

  const profile = own.profile || {};
  const whatsapp = own.privateContact?.whatsapp || '';

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
    if (form.bio) form.bio.value = profile.bio || '';
  }

  renderInterestOptions(interestsBox, catalog, own.interestIds);
  setAvatarInitial(avatar, profileInitial(profile, snap.user));

  const titleName = $('#ni-profile-display-name');
  if (titleName) titleName.textContent = displayName(profile, snap.user);

  if (form) {
    const refreshInitial = () => {
      const draft = {
        nombres: form.nombres?.value,
        apellidos: form.apellidos?.value,
        username: form.username?.value,
      };
      setAvatarInitial(avatar, profileInitial(draft, snap.user));
      if (titleName) titleName.textContent = displayName(draft, snap.user);
    };
    form.nombres?.addEventListener('input', refreshInitial);
    form.apellidos?.addEventListener('input', refreshInitial);
    form.username?.addEventListener('input', refreshInitial);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMsg(msg, '');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const interestIds = Array.from(
        form.querySelectorAll('input[name="interest_ids"]:checked')
      ).map((el) => el.value);

      const { error } = await saveOwnProfile(snap.user.id, {
        nombres: form.nombres.value,
        apellidos: form.apellidos.value,
        username: form.username.value,
        universidad: form.universidad.value,
        carrera: form.carrera.value,
        ciclo_academico: form.ciclo_academico.value,
        whatsapp: form.whatsapp.value,
        bio: form.bio.value,
        interestIds,
      });

      if (submitBtn) submitBtn.disabled = false;
      if (error) {
        setMsg(msg, error.message || 'No se pudo guardar', true);
        return;
      }
      setMsg(msg, 'Perfil guardado.');
      refreshInitial();
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
