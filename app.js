document.documentElement.classList.add('js');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.body.classList.add('ready');

const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const progress = document.querySelector('.scroll-progress');
const heroPhoto = document.querySelector('.hero-photo');
let scrollScheduled = false;
function updateScroll() {
  const available = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${available > 0 ? scrollY / available : 0})`;
  if (!reducedMotion.matches && innerWidth > 760 && scrollY < innerHeight) {
    heroPhoto.style.transform = `translateY(${scrollY * -0.075}px)`;
  } else heroPhoto.style.transform = '';
  scrollScheduled = false;
}
addEventListener('scroll', () => {
  if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
addEventListener('resize', updateScroll);
updateScroll();

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  mobileNav.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

document.querySelectorAll('[data-project]').forEach(link => {
  link.addEventListener('click', () => { document.querySelector('#project').value = link.dataset.project; });
});

const form = document.querySelector('#project-form');
const dialog = document.querySelector('#consultation');
const preview = document.querySelector('#request-preview');
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  preview.textContent = `Hola, Vidrios VECA.\n\nSoy ${String(data.get('name')).trim()}.\nMi proyecto: ${data.get('project')}.\n\n${String(data.get('idea')).trim()}`;
  document.querySelector('#whatsapp-request').href = 'https://wa.me/51908917621?text=' + encodeURIComponent(preview.textContent);
  document.querySelector('#copy-status').textContent = '';
  dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }
});
document.querySelector('#copy-request').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try { await navigator.clipboard.writeText(preview.textContent); status.textContent = 'Consulta copiada.'; }
  catch { status.textContent = 'Selecciona el texto de arriba para copiar tu consulta.'; }
});
