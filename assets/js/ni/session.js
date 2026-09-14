import { getClient } from './client.js';

/**
 * Auth session helpers for the static frontend.
 * Exposes loading + user so UI can avoid flash of logged-out state.
 */

let cached = { user: null, loading: true, error: null };
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(cached);
    } catch (_) {
      /* ignore listener errors */
    }
  });
}

export function subscribeSession(fn) {
  listeners.add(fn);
  fn(cached);
  return () => listeners.delete(fn);
}

export function getSessionSnapshot() {
  return cached;
}

export async function refreshSession() {
  cached = { ...cached, loading: true };
  emit();
  const insforge = getClient();
  const { data, error } = await insforge.auth.getCurrentUser();
  cached = {
    user: error ? null : data?.user ?? null,
    loading: false,
    error: error || null,
  };
  emit();
  return cached;
}

export async function signInWithPassword(email, password) {
  const insforge = getClient();
  const { data, error } = await insforge.auth.signInWithPassword({ email, password });
  if (!error) await refreshSession();
  return { data, error };
}

export async function signUp({ email, password, name }) {
  const insforge = getClient();
  const { data, error } = await insforge.auth.signUp({
    email,
    password,
    name,
  });
  if (!error && data?.accessToken) await refreshSession();
  return { data, error };
}

export async function verifyEmail(email, otp) {
  const insforge = getClient();
  const { data, error } = await insforge.auth.verifyEmail({ email, otp });
  if (!error) await refreshSession();
  return { data, error };
}

export async function resendVerificationEmail(email) {
  const insforge = getClient();
  return insforge.auth.resendVerificationEmail({ email });
}

export async function sendResetPasswordEmail(email) {
  const insforge = getClient();
  return insforge.auth.sendResetPasswordEmail({ email });
}

export async function exchangeResetPasswordToken(email, code) {
  const insforge = getClient();
  return insforge.auth.exchangeResetPasswordToken({ email, code });
}

export async function resetPassword(newPassword, otp) {
  const insforge = getClient();
  return insforge.auth.resetPassword({ newPassword, otp });
}

export async function signInWithOAuth(provider) {
  const insforge = getClient();
  const redirectTo = new URL('perfil.html', window.location.href).href;
  return insforge.auth.signInWithOAuth(provider, { redirectTo });
}

export async function signOut() {
  const insforge = getClient();
  const { error } = await insforge.auth.signOut();
  cached = { user: null, loading: false, error: null };
  emit();
  return { error };
}

export async function getProfile(userId) {
  const insforge = getClient();
  return insforge.auth.getProfile(userId);
}

export async function setProfile(fields) {
  const insforge = getClient();
  return insforge.auth.setProfile(fields);
}
