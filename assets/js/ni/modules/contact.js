import { registerModule } from './registry.js';

/**
 * Contact form: Netlify Function in production, mail.php on local XAMPP.
 */

function setStatus(el, text, kind = '') {
  if (!el) return;
  el.textContent = text || '';
  el.dataset.niStatus = kind || '';
  el.hidden = !text;
}

function payloadFromForm(form) {
  return {
    name: String(form.querySelector('[name="contact-name"]')?.value || '').trim(),
    email: String(form.querySelector('[name="contact-email"]')?.value || '').trim(),
    career: String(form.querySelector('[name="contact-career"]')?.value || '').trim(),
    university: String(form.querySelector('[name="contact-university"]')?.value || '').trim(),
    message: String(form.querySelector('[name="contact-message"]')?.value || '').trim(),
    company: String(form.querySelector('[name="contact-company"]')?.value || '').trim(),
  };
}

function isJsonResponse(res) {
  const type = res.headers.get('content-type') || '';
  return type.includes('application/json');
}

async function sendViaNetlify(body) {
  const res = await fetch('/.netlify/functions/send-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 404 || !isJsonResponse(res)) {
    return { missing: true };
  }
  const data = await res.json().catch(() => null);
  return { missing: false, data };
}

async function sendViaPhp(form) {
  const res = await fetch('mail.php', {
    method: 'POST',
    body: new FormData(form),
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404 || !isJsonResponse(res)) {
    return { missing: true };
  }
  const data = await res.json().catch(() => null);
  return { missing: false, data };
}

registerModule('contact', {
  pages: ['contact'],
  mount() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const statusEl = document.getElementById('ni-contact-form-msg');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus(statusEl, '', '');

      const body = payloadFromForm(form);
      if (!body.name) {
        setStatus(statusEl, 'El nombre no puede estar vacío.', 'error');
        form.querySelector('[name="contact-name"]')?.focus();
        return;
      }
      if (!body.email) {
        setStatus(statusEl, 'El correo no puede estar vacío.', 'error');
        form.querySelector('[name="contact-email"]')?.focus();
        return;
      }
      if (!body.message) {
        setStatus(statusEl, 'El mensaje no puede estar vacío.', 'error');
        form.querySelector('[name="contact-message"]')?.focus();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus(statusEl, 'Enviando…', 'info');

      try {
        let result = await sendViaNetlify(body);
        if (result.missing) {
          result = await sendViaPhp(form);
        }
        const data = result.data;
        if (result.missing || !data || data.code !== true) {
          const err = data?.err || 'No se pudo enviar el mensaje. Inténtalo nuevamente.';
          setStatus(statusEl, err, 'error');
          const field = data?.field ? form.querySelector(`[name="${data.field}"]`) : null;
          field?.focus();
          return;
        }
        setStatus(statusEl, data.success || '¡Mensaje enviado correctamente!', 'ok');
        form.reset();
      } catch (err) {
        console.error('[ni/contact]', err);
        setStatus(statusEl, 'No se pudo enviar el mensaje. Inténtalo nuevamente.', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  },
});

export {};
