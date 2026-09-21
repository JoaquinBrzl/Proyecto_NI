/**
 * Custom centered file picker UI for .ni-admin-modal inputs.
 */

function syncFileName(wrap, input) {
  const nameEl = wrap.querySelector('[data-ni-admin-file-name]');
  if (!nameEl) return;
  const file = input.files?.[0];
  nameEl.textContent = file ? file.name : 'Ningún archivo seleccionado';
  wrap.classList.toggle('has-file', Boolean(file));
}

export function bindAdminFileInputs(root = document) {
  const scope = root || document;
  scope.querySelectorAll('.ni-admin-modal input[type="file"]').forEach((input) => {
    if (input.closest('.ni-admin-file')) return;

    const wrap = document.createElement('label');
    wrap.className = 'ni-admin-file';
    wrap.setAttribute('for', input.id || '');

    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const ui = document.createElement('span');
    ui.className = 'ni-admin-file__ui';
    ui.innerHTML = `
      <span class="ni-admin-file__btn">Seleccionar archivo</span>
      <span class="ni-admin-file__name" data-ni-admin-file-name>Ningún archivo seleccionado</span>
    `;
    wrap.appendChild(ui);

    const sync = () => syncFileName(wrap, input);
    input.addEventListener('change', sync);
    input.form?.addEventListener('reset', () => {
      window.setTimeout(sync, 0);
    });
    sync();
  });
}
