// Comportamenti comuni a tutte le pagine.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const hasGsap = () => typeof window.gsap !== 'undefined';

let lenis = null;
export const getLenis = () => lenis;

export function initCommon({ smooth = true } = {}) {
  if (hasGsap()) {
    const plugins = [window.ScrollTrigger, window.SplitText].filter(Boolean);
    window.gsap.registerPlugin(...plugins);
  }
  if (smooth && !reduceMotion && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, anchors: false });
    if (hasGsap() && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }
  initHeader();
  initMenu();
  initAnchors();
  initCursor();
  initMagnetic();
  initTransitions();
  revealCurtain();
}

function initHeader() {
  const header = $('[data-header]');
  if (!header) return;
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    const scrolled = y > 24;
    header.classList.toggle('bg-paper/85', scrolled);
    header.classList.toggle('backdrop-blur-md', scrolled);
    header.classList.toggle('shadow-[0_1px_0_var(--color-line)]', scrolled);
    const hide = y > 420 && y > lastY && !header.contains(document.activeElement) && !header.querySelector('[aria-expanded="true"]');
    header.style.transform = hide ? 'translateY(-100%)' : '';
    lastY = y;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initMenu() {
  const toggle = $('[data-menu-toggle]');
  const menu = $('[data-menu]');
  if (!toggle || !menu) return;
  const label = $('[data-menu-label]', toggle);
  const open = (state) => {
    toggle.setAttribute('aria-expanded', String(state));
    menu.classList.toggle('hidden', !state);
    if (label) label.textContent = state ? label.dataset.close ?? label.textContent : label.dataset.open ?? label.textContent;
  };
  toggle.addEventListener('click', () => open(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) open(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      open(false);
      toggle.focus();
    }
  });
}

function initAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="#"]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.pathname !== window.location.pathname || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', url.hash);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

function initCursor() {
  const cursor = $('.cursor');
  if (!cursor || !finePointer || reduceMotion) return;
  let x = -100;
  let y = -100;
  let cx = x;
  let cy = y;
  window.addEventListener('pointermove', (event) => {
    x = event.clientX;
    y = event.clientY;
    cursor.classList.add('is-visible');
    const target = event.target.closest('a, button, [data-cursor], label, input, textarea, canvas[data-preview]');
    cursor.classList.toggle('is-hover', Boolean(target) && !event.target.closest('input, textarea, canvas[data-preview]'));
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  const tick = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  $$('[data-magnetic]').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const dx = (event.clientX - rect.left - rect.width / 2) * 0.22;
      const dy = (event.clientY - rect.top - rect.height / 2) * 0.3;
      element.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    });
    element.addEventListener('pointerleave', () => {
      element.style.transform = '';
    });
  });
}

function initTransitions() {
  const curtain = $('.page-curtain');
  if (!curtain) return;
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-transition]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || reduceMotion || !hasGsap()) return;
    event.preventDefault();
    try {
      sessionStorage.setItem('cites:curtain', '1');
    } catch {
      /* niente tendina all'arrivo */
    }
    window.gsap.fromTo(curtain, { yPercent: 100 }, {
      yPercent: 0,
      duration: 0.55,
      ease: 'expo.inOut',
      onComplete: () => {
        window.location.href = url.href;
      },
    });
  });
  // Tornando indietro dalla cache del browser la tendina deve essere nascosta.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && hasGsap()) window.gsap.set(curtain, { yPercent: 100 });
  });
}

function revealCurtain() {
  const root = document.documentElement;
  const curtain = $('.page-curtain');
  if (!curtain || !root.classList.contains('curtain-in')) return;
  if (!hasGsap() || reduceMotion) {
    root.classList.remove('curtain-in');
    return;
  }
  window.gsap.set(curtain, { yPercent: 0 });
  root.classList.remove('curtain-in');
  window.gsap.to(curtain, { yPercent: -100, duration: 0.8, ease: 'expo.inOut', delay: 0.05 });
}

/** Comparsa degli elementi [data-reveal] e righe dei titoli [data-split]. */
export function initReveals(root = document) {
  const html = document.documentElement;
  if (!hasGsap() || reduceMotion || !window.ScrollTrigger) {
    html.classList.add('anim-ready');
    return;
  }
  const { gsap } = window;
  // Prima di creare le animazioni "from": così leggono lo stato finale visibile.
  html.classList.add('anim-ready');
  $$('[data-split]', root).forEach((element) => {
    if (!window.SplitText) return;
    window.SplitText.create(element, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 108,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: element, start: 'top 86%', once: true },
        });
      },
    });
  });
  $$('[data-reveal]', root).forEach((element) => {
    if (element.closest('[data-hero]')) return;
    gsap.from(element, {
      y: 26,
      autoAlpha: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: element, start: 'top 90%', once: true },
    });
  });
}

/* ---------- Notifiche ---------- */

export function toast(message, { timeout = 4600 } = {}) {
  const host = $('[data-toasts]') ?? document.body.appendChild(Object.assign(document.createElement('div'), { className: 'pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4' }));
  host.setAttribute('aria-live', 'polite');
  const item = document.createElement('p');
  item.className = 'pointer-events-auto max-w-md rounded-full bg-ink px-5 py-3 text-center text-sm font-medium text-paper shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]';
  item.textContent = message;
  host.replaceChildren(item);
  if (hasGsap() && !reduceMotion) window.gsap.from(item, { y: 24, autoAlpha: 0, duration: 0.6, ease: 'expo.out' });
  setTimeout(() => {
    if (!item.isConnected) return;
    if (hasGsap() && !reduceMotion) window.gsap.to(item, { y: 12, autoAlpha: 0, duration: 0.35, onComplete: () => item.remove() });
    else item.remove();
  }, timeout);
}
