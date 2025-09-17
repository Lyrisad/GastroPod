document.addEventListener('DOMContentLoaded', () => {
  const docEl = document.documentElement;
  const header = document.querySelector('[data-header]');
  const menu = document.querySelector('[data-menu]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const themeToggle = document.getElementById('theme-toggle');
  const yearEl = document.querySelector('[data-year]');

  // Dynamic year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  if (navToggle && menu) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      menu.setAttribute('aria-expanded', String(!expanded));
      menu.toggleAttribute('open');
      if (!expanded) menu.setAttribute('aria-expanded', 'true');
    });

    // Close on link click (mobile)
    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 720px)').matches) {
          navToggle.setAttribute('aria-expanded', 'false');
          menu.removeAttribute('open');
          menu.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', id);
      }
    });
  });

  // Header shadow on scroll
  const setHeaderShadow = () => {
    const scrolled = window.scrollY > 8;
    header && header.classList.toggle('has-shadow', scrolled);
  };
  setHeaderShadow();
  window.addEventListener('scroll', setHeaderShadow, { passive: true });

  // Scroll reveal
  const elsToReveal = document.querySelectorAll('[data-animate]');
  if (elsToReveal.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.getAttribute('data-animate-delay');
          if (delay) {
            entry.target.style.transitionDelay = `${parseInt(delay, 10)}ms`;
          }
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elsToReveal.forEach((el) => io.observe(el));
  }

  // Theme toggle (persist in localStorage)
  const persistKey = 'gp-theme';
  const initTheme = () => {
    const stored = localStorage.getItem(persistKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    docEl.setAttribute('data-theme', theme);
  };
  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = docEl.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      docEl.setAttribute('data-theme', next);
      localStorage.setItem(persistKey, next);
    });
  }

  // Interactive phone tilt
  const phone = document.querySelector('.phone-body');
  const phoneMock = document.querySelector('.phone-mock');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (phone && phoneMock && !reduceMotion) {
    let rafId = 0;
    let isPointerOver = false;

    const bounds = () => phone.getBoundingClientRect();
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const onMove = (x, y) => {
      const b = bounds();
      const px = (x - b.left) / b.width; // 0..1
      const py = (y - b.top) / b.height; // 0..1
      const rx = clamp((0.5 - py) * 14, -12, 12); // tilt X
      const ry = clamp((px - 0.5) * 18, -16, 16); // tilt Y
      phone.style.setProperty('--rx', `${rx}deg`);
      phone.style.setProperty('--ry', `${ry}deg`);
      phone.style.setProperty('--gx', `${px * 100}%`);
      phone.style.setProperty('--gy', `${py * 100}%`);
    };

    const follow = (e) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => onMove(e.clientX, e.clientY));
    };

    const reset = () => {
      phone.style.setProperty('--rx', '0deg');
      phone.style.setProperty('--ry', '0deg');
      phone.style.removeProperty('--gx');
      phone.style.removeProperty('--gy');
    };

    phoneMock.addEventListener('pointerenter', () => {
      isPointerOver = true;
      phone.classList.remove('is-floating');
    });
    phoneMock.addEventListener('pointermove', follow);
    phoneMock.addEventListener('pointerleave', () => {
      isPointerOver = false;
      reset();
      phone.classList.add('is-floating');
    });

    // Idle float when not interacting
    phone.classList.add('is-floating');

    // Touch: small parallax on scroll
    const onScroll = () => {
      if (isPointerOver) return;
      const rect = phoneMock.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const delta = clamp((viewportCenter - centerY) / window.innerHeight, -1, 1);
      phone.style.setProperty('--rx', `${delta * 6}deg`);
      phone.style.setProperty('--ry', `${delta * -4}deg`);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Lock-screen notifications sequence (bubbles)
  const phoneBody = document.querySelector('[data-lock-seq]');
  const screen = document.querySelector('.phone-screen');
  const bubbles = Array.from(document.querySelectorAll('.lock-overlay .notif-bubble'));
  const cards = Array.from(document.querySelectorAll('.screen-card.notif'));

  const runSequence = () => {
    if (!screen) return;

    // Reset
    screen.classList.remove('is-waking');
    screen.classList.add('is-off');
    bubbles.forEach((b) => b.classList.remove('show'));
    cards.forEach((c) => c.classList.remove('show'));

    // Wake
    setTimeout(() => {
      screen.classList.remove('is-off');
      screen.classList.add('is-waking');

      // Stagger bubbles like iOS notifications
      setTimeout(() => bubbles[0] && bubbles[0].classList.add('show'), 140);
      setTimeout(() => bubbles[1] && bubbles[1].classList.add('show'), 300);
      setTimeout(() => bubbles[2] && bubbles[2].classList.add('show'), 460);

      // Keep bubbles visible; do not reveal inner cards automatically
    }, 220);
  };

  // Play sequence when app section enters viewport
  const appSection = document.querySelector('#application');
  if (appSection) {
    const onceIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runSequence();
          onceIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    onceIO.observe(appSection);
  }

  // Replay on click/tap on the phone
  if (phoneBody) {
    phoneBody.addEventListener('click', () => runSequence());
  }
});
