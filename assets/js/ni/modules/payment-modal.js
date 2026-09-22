import { getClient } from '../client.js';

/**
 * Membership payment modal (NI Pro / NI Elite).
 * Two steps: summary → Yape/Plin/transfer + operation number.
 * Payment destination is static (edit here if numbers change).
 */

/** Static cobro — change these values in code when needed. */
export const STATIC_PAYMENT = {
  yape_number: '987 654 000',
  plin_number: '987 654 000',
  bank_name: 'BCP',
  account_number: '123-456789-0-01',
  cci: '00219100000000000000',
  account_holder: 'Grupo NI',
  yape_instructions: 'Envía el monto exacto por Yape e ingresa el número de operación.',
  plin_instructions: 'Envía el monto exacto por Plin e ingresa el número de operación.',
  transfer_instructions: 'Realiza la transferencia e ingresa el número de operación o referencia.',
  pro_price_pen: 30,
  elite_price_pen: 50,
};

const PLAN_META = {
  ni_pro: {
    title: 'Activar NI Pro',
    eyebrow: 'Membresía mensual',
    lead: 'Accede a talleres exclusivos, recursos premium y prioridad en inscripciones.',
    benefits: [
      'Talleres exclusivos Pro',
      'Recursos premium',
      'Prioridad en inscripciones',
      'Certificados descargables',
      'Match Académico ampliado',
    ],
  },
  ni_elite: {
    title: 'Activar NI Elite',
    eyebrow: 'Membresía mensual · previa aprobación',
    lead: 'Comunidad privada, mentoría y acceso anticipado a convocatorias.',
    benefits: [
      'Todo lo de NI Pro',
      'Comunidad privada Elite',
      'Mentoría y acompañamiento',
      'Eventos exclusivos',
      'Badge Elite en perfil',
    ],
  },
};

const METHOD_LABELS = {
  yape: 'Yape',
  plin: 'Plin',
  transfer: 'Transferencia',
};

function firstRow(data) {
  if (!data) return null;
  return Array.isArray(data) ? data[0] || null : data;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrice(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function formatDiscountLabel(discount, discountPen) {
  if (!discount) return '';
  const off = Number(discountPen) || 0;
  if (discount.type === 'percent') {
    return `−${formatPrice(discount.value)}% ${discount.label || ''}`.trim();
  }
  return `−S/ ${formatPrice(off || discount.value)} ${discount.label || ''}`.trim();
}

function ensureModalDom() {
  let root = document.getElementById('ni-pay-modal');
  if (root) return root;

  root = document.createElement('div');
  root.id = 'ni-pay-modal';
  root.className = 'ni-pay-modal';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'ni-pay-modal-title');
  root.innerHTML = `
    <button type="button" class="ni-pay-modal__backdrop" data-ni-pay-close aria-label="Cerrar"></button>
    <div class="ni-pay-modal__dialog">
      <header class="ni-pay-modal__header">
        <div>
          <p class="ni-pay-modal__eyebrow" data-ni-pay-eyebrow></p>
          <h2 class="ni-pay-modal__title" id="ni-pay-modal-title" data-ni-pay-title>Activar membresía</h2>
          <div class="ni-pay-modal__price-row">
            <span class="ni-pay-modal__amount-old" data-ni-pay-list-price hidden></span>
            <span class="ni-pay-modal__amount" data-ni-pay-amount>S/ 0</span>
            <span class="ni-pay-modal__period">/ mes</span>
          </div>
          <span class="ni-pay-modal__discount-chip" data-ni-pay-discount-chip hidden></span>
        </div>
        <button type="button" class="ni-pay-modal__close" data-ni-pay-close aria-label="Cerrar">&times;</button>
      </header>
      <div class="ni-pay-modal__body">
        <div class="ni-pay-modal__step" data-ni-pay-step="summary">
          <p class="ni-pay-modal__lead" data-ni-pay-lead></p>
          <ul class="ni-pay-modal__benefits" data-ni-pay-benefits></ul>
          <p class="ni-pay-modal__msg" data-ni-pay-status hidden aria-live="polite"></p>
          <div class="ni-pay-modal__actions">
            <button type="button" class="ni-pay-modal__btn ni-pay-modal__btn--primary" data-ni-pay-continue>
              Continuar al pago
            </button>
            <button type="button" class="ni-pay-modal__btn ni-pay-modal__btn--ghost" data-ni-pay-close>
              Cancelar
            </button>
          </div>
        </div>
        <div class="ni-pay-modal__step" data-ni-pay-step="pay" hidden>
          <p class="ni-pay-modal__lead">Elige el método, paga el monto indicado e ingresa el número de operación. Un admin validará el pago para activar tu membresía (30 días).</p>
          <div class="ni-pay-modal__methods" role="group" aria-label="Método de pago">
            <button type="button" class="ni-pay-modal__method is-active" data-ni-pay-method="yape">Yape</button>
            <button type="button" class="ni-pay-modal__method" data-ni-pay-method="plin">Plin</button>
            <button type="button" class="ni-pay-modal__method" data-ni-pay-method="transfer">Transferencia</button>
          </div>
          <div class="ni-pay-modal__instructions" data-ni-pay-instructions></div>
          <div class="ni-pay-modal__field">
            <label for="ni-pay-operation">Número de operación</label>
            <input id="ni-pay-operation" type="text" maxlength="64" autocomplete="off" placeholder="Ej. 123456789" data-ni-pay-operation>
          </div>
          <p class="ni-pay-modal__msg" data-ni-pay-pay-status hidden aria-live="polite"></p>
          <div class="ni-pay-modal__actions">
            <button type="button" class="ni-pay-modal__btn ni-pay-modal__btn--primary" data-ni-pay-submit>
              Enviar comprobante
            </button>
            <button type="button" class="ni-pay-modal__btn ni-pay-modal__btn--ghost" data-ni-pay-back>
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  return root;
}

function setMsg(el, text, kind = '') {
  if (!el) return;
  el.textContent = text || '';
  el.dataset.niStatus = kind || '';
  el.hidden = !text;
}

function paymentDetails() {
  return STATIC_PAYMENT;
}

function renderInstructions(el, method) {
  if (!el) return;
  const p = paymentDetails();
  if (method === 'yape') {
    el.innerHTML = `
      <strong>Yape</strong>
      <dl>
        <dt>Número</dt><dd>${escapeHtml(p.yape_number || '—')}</dd>
      </dl>
      <p>${escapeHtml(p.yape_instructions)}</p>
    `;
    return;
  }
  if (method === 'plin') {
    el.innerHTML = `
      <strong>Plin</strong>
      <dl>
        <dt>Número</dt><dd>${escapeHtml(p.plin_number || '—')}</dd>
      </dl>
      <p>${escapeHtml(p.plin_instructions)}</p>
    `;
    return;
  }
  el.innerHTML = `
    <strong>Transferencia bancaria</strong>
    <dl>
      <dt>Banco</dt><dd>${escapeHtml(p.bank_name || '—')}</dd>
      <dt>Titular</dt><dd>${escapeHtml(p.account_holder || '—')}</dd>
      <dt>Cuenta</dt><dd>${escapeHtml(p.account_number || '—')}</dd>
      <dt>CCI</dt><dd>${escapeHtml(p.cci || '—')}</dd>
    </dl>
    <p>${escapeHtml(p.transfer_instructions)}</p>
  `;
}

let state = {
  open: false,
  plan: null,
  quote: null,
  method: 'yape',
  step: 'summary',
  onDone: null,
  busy: false,
};

function paintQuote(root) {
  const quote = state.quote;
  const meta = PLAN_META[state.plan] || PLAN_META.ni_pro;
  const title = root.querySelector('[data-ni-pay-title]');
  const eyebrow = root.querySelector('[data-ni-pay-eyebrow]');
  const lead = root.querySelector('[data-ni-pay-lead]');
  const amount = root.querySelector('[data-ni-pay-amount]');
  const listPrice = root.querySelector('[data-ni-pay-list-price]');
  const chip = root.querySelector('[data-ni-pay-discount-chip]');
  const benefits = root.querySelector('[data-ni-pay-benefits]');

  if (title) title.textContent = meta.title;
  if (eyebrow) eyebrow.textContent = meta.eyebrow;
  if (lead) lead.textContent = meta.lead;
  if (benefits) {
    benefits.innerHTML = meta.benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join('');
  }

  const listFallback =
    state.plan === 'ni_elite' ? STATIC_PAYMENT.elite_price_pen : STATIC_PAYMENT.pro_price_pen;
  const list = Number(quote?.list_price_pen ?? listFallback);
  const total = Number(quote?.amount_pen ?? list);
  const discountPen = Number(quote?.discount_pen ?? 0);
  const hasDiscount = discountPen > 0 && total < list;

  if (amount) amount.textContent = `S/ ${formatPrice(total)}`;
  if (listPrice) {
    listPrice.textContent = `S/ ${formatPrice(list)}`;
    listPrice.hidden = !hasDiscount;
  }
  if (chip) {
    const label = formatDiscountLabel(quote?.discount, discountPen);
    chip.textContent = label;
    chip.hidden = !hasDiscount || !label;
  }

  renderInstructions(root.querySelector('[data-ni-pay-instructions]'), state.method);
}

function setStep(root, step) {
  state.step = step;
  root.querySelectorAll('[data-ni-pay-step]').forEach((el) => {
    el.hidden = el.getAttribute('data-ni-pay-step') !== step;
  });
}

function setMethod(root, method) {
  state.method = method;
  root.querySelectorAll('[data-ni-pay-method]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-ni-pay-method') === method);
  });
  renderInstructions(root.querySelector('[data-ni-pay-instructions]'), method);
}

function closeModal() {
  const root = document.getElementById('ni-pay-modal');
  if (!root) return;
  root.hidden = true;
  state.open = false;
  state.busy = false;
  document.body.style.removeProperty('overflow');
}

export async function fetchPaymentQuote(plan) {
  const insforge = getClient();
  const { data, error } = await insforge.database.rpc('get_membership_payment_quote', {
    p_plan: plan,
  });
  if (error) return { quote: null, error };
  const quote = firstRow(data) || data;
  return { quote, error: null };
}

export async function submitMembershipPayment({ plan, method, operationNumber }) {
  const insforge = getClient();
  return insforge.database.rpc('submit_membership_payment', {
    p_plan: plan,
    p_method: method,
    p_operation_number: operationNumber,
  });
}

export async function openPaymentModal({ plan, onDone } = {}) {
  if (plan !== 'ni_pro' && plan !== 'ni_elite') {
    throw new Error('plan inválido');
  }

  const root = ensureModalDom();
  const statusEl = root.querySelector('[data-ni-pay-status]');
  const payStatusEl = root.querySelector('[data-ni-pay-pay-status]');
  setMsg(statusEl, 'Cargando…', 'info');
  setMsg(payStatusEl, '');
  state = {
    open: true,
    plan,
    quote: null,
    method: 'yape',
    step: 'summary',
    onDone: typeof onDone === 'function' ? onDone : null,
    busy: false,
  };
  setStep(root, 'summary');
  setMethod(root, 'yape');
  root.hidden = false;
  document.body.style.overflow = 'hidden';

  const { quote, error } = await fetchPaymentQuote(plan);
  if (error) {
    setMsg(statusEl, error.message || 'No se pudo cargar el pago.', 'error');
    return { ok: false, error };
  }
  if (quote?.has_pending) {
    setMsg(
      statusEl,
      'Ya tienes un comprobante en revisión. Espera la validación del admin.',
      'info',
    );
    const cont = root.querySelector('[data-ni-pay-continue]');
    if (cont) cont.disabled = true;
  } else {
    setMsg(statusEl, '');
    const cont = root.querySelector('[data-ni-pay-continue]');
    if (cont) cont.disabled = false;
  }
  // Always show static destination numbers in the modal.
  state.quote = { ...(quote || {}), payment: paymentDetails() };
  paintQuote(root);
  return { ok: true, quote: state.quote };
}

function wireOnce() {
  const root = ensureModalDom();
  if (root.dataset.niPayWired === '1') return root;
  root.dataset.niPayWired = '1';

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-ni-pay-close]')) {
      closeModal();
      return;
    }
    const methodBtn = e.target.closest('[data-ni-pay-method]');
    if (methodBtn) {
      setMethod(root, methodBtn.getAttribute('data-ni-pay-method'));
      return;
    }
    if (e.target.closest('[data-ni-pay-back]')) {
      setStep(root, 'summary');
      return;
    }
    if (e.target.closest('[data-ni-pay-continue]')) {
      if (state.quote?.has_pending) return;
      setStep(root, 'pay');
      return;
    }
    if (e.target.closest('[data-ni-pay-submit]')) {
      handleSubmit(root).catch((err) => {
        console.error('[ni/payment-modal] submit', err);
        setMsg(
          root.querySelector('[data-ni-pay-pay-status]'),
          err.message || 'No se pudo enviar el comprobante.',
          'error',
        );
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.open) closeModal();
  });

  return root;
}

async function handleSubmit(root) {
  if (state.busy) return;
  const payStatusEl = root.querySelector('[data-ni-pay-pay-status]');
  const opInput = root.querySelector('[data-ni-pay-operation]');
  const submitBtn = root.querySelector('[data-ni-pay-submit]');
  const op = String(opInput?.value || '').trim();
  if (op.length < 4) {
    setMsg(payStatusEl, 'Ingresa un número de operación válido (mín. 4 caracteres).', 'error');
    opInput?.focus();
    return;
  }

  state.busy = true;
  if (submitBtn) submitBtn.disabled = true;
  setMsg(payStatusEl, 'Enviando comprobante…', 'info');

  const { data, error } = await submitMembershipPayment({
    plan: state.plan,
    method: state.method,
    operationNumber: op,
  });

  state.busy = false;
  if (submitBtn) submitBtn.disabled = false;

  if (error) {
    setMsg(payStatusEl, error.message || 'No se pudo enviar el comprobante.', 'error');
    return;
  }

  setMsg(payStatusEl, 'Comprobante enviado. Un admin lo validará para activar tu plan (30 días).', 'ok');
  const done = state.onDone;
  window.setTimeout(() => {
    closeModal();
    if (done) done(firstRow(data) || data);
  }, 1100);
}

/** Call once (e.g. from pricing mount) so the modal DOM + listeners exist. */
export function initPaymentModal() {
  wireOnce();
}

export { METHOD_LABELS, closeModal as closePaymentModal };

export {};
