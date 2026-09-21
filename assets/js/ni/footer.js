/**
 * Shared Zenit site footer — only links to pages that exist in the project.
 */

const FOOTER_SKIP_PAGES = new Set([
  'admin',
  'login',
  'register',
  'verify',
  'reset',
  'completar-perfil',
]);

const YEAR = new Date().getFullYear();

const FOOTER_HTML = `
<div class="container">
  <div class="ni-footer__inner">
    <div class="ni-footer__brand">
      <div class="ni-footer__brand-row">
        <span class="ni-footer__mark" aria-hidden="true">
          <img src="assets/images/logo/ni-logo.png" alt="">
        </span>
        <div class="ni-footer__brand-text">
          <strong>Zenit</strong>
          <span>por Grupo NI</span>
        </div>
      </div>
      <p class="ni-footer__tagline">Tu espacio para aprender, conectar y crecer con la comunidad de Negocios Internacionales más activa del Perú.</p>
    </div>

    <nav class="ni-footer__col" aria-label="Plataforma">
      <h3 class="ni-footer__col-title">Plataforma</h3>
      <ul class="ni-footer__links">
        <li><a href="index.html">Inicio</a></li>
        <li><a href="anuncios.html">Anuncios</a></li>
        <li><a href="talleres.html">Talleres</a></li>
        <li><a href="recursos.html">Recursos</a></li>
        <li><a href="match.html">Match</a></li>
      </ul>
    </nav>

    <nav class="ni-footer__col" aria-label="Membresías">
      <h3 class="ni-footer__col-title">Membresías</h3>
      <ul class="ni-footer__links">
        <li><a href="pricing-three-white.html#plan-ni-free">NI Free</a></li>
        <li><a href="pricing-three-white.html#plan-ni-pro">NI Pro</a></li>
        <li><a href="pricing-three-white.html#plan-ni-elite">NI Elite</a></li>
      </ul>
    </nav>

    <nav class="ni-footer__col" aria-label="Grupo NI">
      <h3 class="ni-footer__col-title">Grupo NI</h3>
      <ul class="ni-footer__links">
        <li><a href="about-white.html">Sobre nosotros</a></li>
        <li><a href="contact-white.html">Contacto</a></li>
      </ul>
    </nav>
  </div>

  <div class="ni-footer__bottom">
    <p>© ${YEAR} Grupo NI. Todos los derechos reservados.</p>
    <p>Hecho con <span class="ni-footer__heart" aria-hidden="true">❤️</span> para estudiantes de Negocios Internacionales</p>
  </div>
</div>
`;

function ensureFooterStyles() {
  if (document.getElementById('ni-footer-css')) return;
  const link = document.createElement('link');
  link.id = 'ni-footer-css';
  link.rel = 'stylesheet';
  link.href = `${new URL('../../css/ni-footer.css', import.meta.url).href}?v=1.0.9`;
  document.head.appendChild(link);
}

function findFooterHost() {
  return (
    document.getElementById('ni-site-footer') ||
    document.querySelector('footer.ni-footer') ||
    document.querySelector('footer.tmp-footer') ||
    document.querySelector('main.page-wrapper > footer') ||
    document.querySelector('footer')
  );
}

export function mountFooter() {
  const page = document.body?.dataset?.niPage || '';
  if (FOOTER_SKIP_PAGES.has(page) || document.body.classList.contains('ni-admin-page')) {
    return;
  }

  ensureFooterStyles();

  let footer = findFooterHost();
  if (!footer) {
    const main = document.querySelector('main.page-wrapper') || document.body;
    footer = document.createElement('footer');
    main.appendChild(footer);
  }

  footer.id = 'ni-site-footer';
  footer.className = 'ni-footer';
  footer.setAttribute('aria-label', 'Pie de página');
  footer.innerHTML = FOOTER_HTML;
}
