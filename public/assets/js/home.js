// Homepage: mazzo di template nell'hero, contatore, testo che si rivela, catalogo dei template.

import { $, $$, hasGsap, initCommon, initReveals, reduceMotion } from './app.js';
import { formatNumber, lang, t } from './i18n.js';
import { readCounter } from './counter.js';
import { canvasToBlob, prepareFonts, renderPage } from './engine/render.js';
import { QUOTES, SINGLE_WORD } from './engine/samples.js';
import { FAMILIES, TEMPLATES, templateName } from './engine/templates.js';

initCommon();
const gsap = window.gsap;
// Le animazioni "from" devono leggere lo stato visibile finale (vedi boot.js e app.css).
document.documentElement.classList.add('anim-ready');
const createPath = lang === 'en' ? '/en/create' : '/crea';

function sampleDoc(template, index, format = 'post', seed = 7) {
  const list = QUOTES[lang] ?? QUOTES.it;
  const quote = template.sample < 0 ? SINGLE_WORD[lang] : list[(template.sample + index) % list.length];
  return {
    template: template.id,
    format,
    seed: seed + index * 31,
    quoteMarks: 'none',
    showAuthor: true,
    handle: '',
    pageStart: 124 + index,
    overrides: {},
    pages: [{ text: quote.t, author: quote.a, work: quote.w, marks: null }],
  };
}

async function drawInto(canvas, doc, cssWidth) {
  await prepareFonts(doc).catch(() => []);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const scale = (cssWidth * dpr) / 1080;
  canvas.width = Math.round(1080 * scale);
  canvas.height = Math.round(1350 * scale);
  renderPage(canvas.getContext('2d'), doc, 0, { scale, lang, total: 1 });
}

/* ---------- Hero ---------- */

async function heroIntro() {
  const title = $('[data-hero-title]');
  const highlight = $('[data-hero] [data-hl]');
  if (!hasGsap() || reduceMotion) {
    if (highlight) highlight.style.setProperty('--hl', '100%');
    return;
  }
  // Le righe vanno calcolate con il carattere definitivo.
  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 900))]);
  let split = null;
  const timeline = gsap.timeline({
    defaults: { ease: 'expo.out' },
    delay: 0.1,
    onComplete: () => {
      // Finita l'entrata il titolo torna testo normale (va a capo da solo se la finestra cambia).
      split?.revert();
      $('[data-hero] [data-hl]')?.style.setProperty('--hl', '100%');
    },
  });
  if (title && window.SplitText) {
    split = window.SplitText.create(title, { type: 'lines', mask: 'lines' });
    gsap.set(title, { autoAlpha: 1 });
    timeline.from(split.lines, { yPercent: 110, duration: 1.3, stagger: 0.12 }, 0);
  }
  timeline
    .from('[data-hero] [data-reveal]', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.25)
    .from('[data-outline]', { scaleY: 0, transformOrigin: '50% 100%', duration: 1.4, stagger: 0.07, ease: 'expo.inOut' }, 0.1)
    .from('[data-deck]', { y: 80, autoAlpha: 0, rotate: 6, duration: 1.4 }, 0.35)
    .from('[data-chip]', { y: 20, autoAlpha: 0, scale: 0.9, duration: 0.9, stagger: 0.1 }, 0.8);
  if (highlight) timeline.fromTo(highlight, { '--hl': '0%' }, { '--hl': '100%', duration: 1.1, ease: 'power3.inOut' }, 0.75);

  $$('[data-chip]').forEach((chip, i) => {
    gsap.to(chip, { y: i % 2 ? 9 : -9, duration: 2.6 + i * 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.8 });
  });
  if (window.ScrollTrigger) {
    gsap.to('[data-deck]', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '[data-stage]', start: 'top 60%', end: 'bottom top', scrub: true } });
    gsap.to('[data-outlines]', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '[data-stage]', start: 'top 60%', end: 'bottom top', scrub: true } });
  }
}

const DECK_ORDER = ['classico', 'righe', 'cartolina', 'post-it', 'dattiloscritto', 'ingiallito', 'carta-nera', 'nastro', 'giornale', 'quadretti', 'pergamena', 'biblioteca', 'segnalibro', 'matita', 'lampada', 'kraft'];

async function heroDeck() {
  const deck = $('[data-deck]');
  if (!deck) return;
  const cards = $$('[data-deck-card]', deck);
  const width = deck.clientWidth || 360;
  const templates = DECK_ORDER.map((id) => TEMPLATES.find((item) => item.id === id)).filter(Boolean);
  let next = 0;
  const paint = async (card) => {
    const template = templates[next % templates.length];
    const canvas = card.querySelector('canvas') ?? card.appendChild(document.createElement('canvas'));
    canvas.className = 'block size-full';
    canvas.setAttribute('aria-hidden', 'true');
    await drawInto(canvas, sampleDoc(template, next, 'post', 11), width);
    next += 1;
  };
  for (const card of cards) await paint(card);
  const layout = () =>
    cards.forEach((card, i) => {
      const depth = cards.length - 1 - i;
      const style = { zIndex: i + 1, rotate: (depth % 2 ? -1 : 1) * depth * 2.2, y: -depth * 10, x: depth * 6, scale: 1 - depth * 0.025 };
      if (hasGsap()) gsap.set(card, style);
      else Object.assign(card.style, { zIndex: String(i + 1), transform: `translateY(${style.y}px) rotate(${style.rotate}deg)` });
    });
  layout();
  if (!hasGsap() || reduceMotion) return;
  const cycle = async () => {
    const top = cards[cards.length - 1];
    await gsap.to(top, { x: '115%', y: -30, rotate: 18, duration: 0.85, ease: 'power3.in' });
    cards.unshift(cards.pop());
    await paint(top);
    layout();
    gsap.from(top, { autoAlpha: 0, duration: 0.5 });
    cards.forEach((card, i) => {
      const depth = cards.length - 1 - i;
      gsap.to(card, { rotate: (depth % 2 ? -1 : 1) * depth * 2.2, y: -depth * 10, x: depth * 6, scale: 1 - depth * 0.025, duration: 0.8, ease: 'expo.out' });
    });
  };
  let timer = setInterval(cycle, 2800);
  document.addEventListener('visibilitychange', () => {
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(cycle, 2800);
  });
}

/* ---------- Numeri ---------- */

async function stats() {
  const totals = await readCounter();
  const people = $('[data-count="people"]');
  const images = $('[data-count="images"]');
  const label = $('[data-people-label]');
  if (!people || !images) return;
  const values = { people: totals?.people ?? 0, images: totals?.images ?? 0 };
  if (label) {
    if (values.people === 0) label.textContent = label.dataset.zero;
    else label.textContent = values.people === 1 ? label.dataset.one : label.dataset.many;
  }
  const show = (node, value) => (node.textContent = formatNumber(Math.round(value)));
  if (!hasGsap() || reduceMotion || !window.ScrollTrigger) {
    show(people, values.people);
    show(images, values.images);
    return;
  }
  const counter = { people: 0, images: 0 };
  gsap.to(counter, {
    people: values.people,
    images: values.images,
    duration: 2.2,
    ease: 'expo.out',
    scrollTrigger: { trigger: '[data-stats]', start: 'top 80%', once: true },
    onUpdate: () => {
      show(people, counter.people);
      show(images, counter.images);
    },
  });
  gsap.from('[data-stats] > div', { y: 30, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '[data-stats]', start: 'top 85%', once: true } });
}

/* ---------- Testo che si rivela ---------- */

function scrubText() {
  const block = $('[data-scrub-text]');
  if (!block || !hasGsap() || reduceMotion || !window.SplitText || !window.ScrollTrigger) return;
  const dim = $('[data-scrub-dim]', block);
  dim?.classList.remove('text-faint');
  const split = window.SplitText.create(block, { type: 'words' });
  gsap.fromTo(split.words, { color: '#b9b5ac' }, {
    color: '#0d0d0c',
    stagger: 0.08,
    ease: 'none',
    scrollTrigger: { trigger: block, start: 'top 78%', end: 'bottom 45%', scrub: true },
  });
}

/* ---------- Catalogo dei template ---------- */

function catalog() {
  const grid = $('[data-tpl-grid]');
  const filters = $('[data-tpl-filters]');
  if (!grid || !filters) return;
  const chip = (id, label, on) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip shrink-0';
    button.dataset.filter = id;
    button.setAttribute('aria-pressed', String(on));
    button.textContent = label;
    return button;
  };
  filters.replaceChildren(chip('all', t('family.all'), true), ...FAMILIES.map((family) => chip(family.id, family.name[lang], false)));

  const items = TEMPLATES.map((template, index) => {
    const li = document.createElement('li');
    li.dataset.familyOf = template.family;
    li.innerHTML = `<a class="group block" href="${createPath}?t=${encodeURIComponent(template.id)}" data-transition>
      <span class="tpl-thumb relative block aspect-[4/5] overflow-hidden rounded-md bg-paper-3 shadow-[0_1px_2px_rgba(20,18,14,0.1),0_14px_28px_-18px_rgba(20,18,14,0.5)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:rotate-[-1deg]">
        <img class="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500" alt="" decoding="async">
        <span class="absolute bottom-2 right-2 inline-flex size-9 translate-y-2 items-center justify-center rounded-full bg-ink text-lime opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg></span>
      </span>
      <span class="mt-3 flex items-baseline justify-between gap-2">
        <span class="text-[0.9375rem] font-medium tracking-[-0.01em]"></span>
        <span class="font-mono text-[0.6875rem] text-muted">${String(index + 1).padStart(2, '0')}</span>
      </span>
    </a>`;
    li.querySelector('.font-medium').textContent = templateName(template, lang);
    li.querySelector('a').setAttribute('aria-label', t('template.use', { name: templateName(template, lang) }));
    return { li, template, index, drawn: false };
  });
  grid.replaceChildren(...items.map((item) => item.li));

  const queue = [];
  let working = false;
  const work = async () => {
    if (working) return;
    working = true;
    while (queue.length) {
      const item = queue.shift();
      const img = item.li.querySelector('img');
      const width = img.parentElement.clientWidth || 200;
      const canvas = document.createElement('canvas');
      await drawInto(canvas, sampleDoc(item.template, item.index % 3, 'post', 3), width);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9).catch(() => null);
      if (blob) {
        img.src = URL.createObjectURL(blob);
        img.onload = () => img.classList.remove('opacity-0');
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    working = false;
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = items.find((candidate) => candidate.li === entry.target);
        if (item && !item.drawn) {
          item.drawn = true;
          queue.push(item);
          observer.unobserve(entry.target);
        }
      });
      work();
    },
    { rootMargin: '300px 0px' },
  );
  items.forEach((item) => observer.observe(item.li));

  if (hasGsap() && !reduceMotion && window.ScrollTrigger) {
    const list = items.map((item) => item.li);
    gsap.set(list, { y: 40, autoAlpha: 0, rotate: 1.5 });
    window.ScrollTrigger.batch(list, {
      start: 'top 94%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, rotate: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out', overwrite: true }),
    });
  }

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    const id = button.dataset.filter;
    $$('[data-filter]', filters).forEach((node) => node.setAttribute('aria-pressed', String(node === button)));
    const visible = items.filter((item) => id === 'all' || item.template.family === id);
    items.forEach((item) => (item.li.hidden = !visible.includes(item)));
    if (hasGsap() && !reduceMotion) {
      gsap.fromTo(visible.map((item) => item.li), { y: 18, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.035, ease: 'expo.out', overwrite: true });
    }
    window.ScrollTrigger?.refresh();
  });
}

/* ---------- Passi, funzioni, chiusura ---------- */

function sections() {
  if (!hasGsap() || reduceMotion || !window.ScrollTrigger) {
    $$('[data-hl]').forEach((node) => node.style.setProperty('--hl', '100%'));
    return;
  }
  $$('[data-step]').forEach((step, i) => {
    const paths = $$('svg path, svg ellipse, svg circle, svg rect', step);
    const timeline = gsap.timeline({ scrollTrigger: { trigger: step, start: 'top 85%', once: true } });
    timeline.from(step, { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: i * 0.08 });
    paths.forEach((path) => {
      const length = path.getTotalLength ? path.getTotalLength() : 60;
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      timeline.to(path, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.2);
    });
  });
  gsap.set('[data-feature]', { y: 30, autoAlpha: 0 });
  window.ScrollTrigger.batch('[data-feature]', {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: 'expo.out', overwrite: true }),
  });
  $$('main [data-hl]').forEach((node) => {
    if (node.closest('[data-hero]')) return;
    gsap.fromTo(node, { '--hl': '0%' }, { '--hl': '100%', duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: node, start: 'top 80%', once: true } });
  });
  gsap.from('[data-cta]', { y: 60, scale: 0.97, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '[data-cta]', start: 'top 85%', once: true } });
  const wordmark = $('[data-wordmark]');
  if (wordmark && window.SplitText) {
    const split = window.SplitText.create(wordmark, { type: 'chars', mask: 'chars' });
    gsap.from(split.chars, { yPercent: 100, duration: 1.2, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: wordmark, start: 'top 95%', once: true } });
  }
}

heroIntro();
initReveals($('main'));
stats();
scrubText();
catalog();
sections();
heroDeck();
