/**
 * Runs in <head> (no defer) so the Zenit header class exists before first paint.
 * Full chrome (logo, search, account) is still filled by header.js.
 */
(function () {
  var root = document.documentElement;
  root.classList.add('ni-zenit', 'ni-header-compact');

  var theme = 'light';
  try {
    var stored = localStorage.getItem('ni_theme_mode');
    if (stored === 'dark' || stored === 'light') theme = stored;
  } catch (e) {
    /* ignore */
  }
  root.dataset.niTheme = theme;

  function hideLegacyChrome() {
    document
      .querySelectorAll('.inverweb-side-bar-close, .tmp-search-input-area, #anywhere-home, footer.tmp-footer:not(.ni-footer)')
      .forEach(function (el) {
        el.setAttribute('hidden', '');
        el.style.setProperty('display', 'none', 'important');
      });
  }

  function applyBody() {
    if (!document.body) return;
    document.body.classList.add('ni-zenit', 'ni-header-compact');
    document.body.classList.remove('active-dark-mode', 'active-light-mode');
    document.body.classList.add(theme === 'dark' ? 'active-dark-mode' : 'active-light-mode');
    hideLegacyChrome();
  }

  if (document.body) applyBody();
  else document.addEventListener('DOMContentLoaded', applyBody);
})();
