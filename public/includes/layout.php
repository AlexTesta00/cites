<?php

declare(strict_types=1);

/*
 * Pezzi comuni delle pagine: <head>, intestazione, piè di pagina e script.
 */

function logo_mark(string $extra = ''): string
{
    return '<span aria-hidden="true" class="relative inline-flex size-8 shrink-0 items-start justify-center overflow-hidden rounded-[9px] bg-lime ' . $extra . '">'
        . '<span class="font-serif text-[2.75rem] leading-[1.02] text-ink">”</span></span>';
}

/**
 * @param array{page:string,title:string,description:string,canonical?:string,robots?:string,og_title?:string,og_description?:string} $o
 */
function render_head(array $o): void
{
    $lang = cites_lang();
    $page = $o['page'];
    $canonical = $o['canonical'] ?? page_url($page);
    $robots = $o['robots'] ?? 'index,follow';
    $ogTitle = $o['og_title'] ?? $o['title'];
    $ogDescription = $o['og_description'] ?? $o['description'];
    $locale = $lang === 'it' ? 'it_IT' : 'en_US';
    ?><!doctype html>
<html lang="<?= $lang ?>" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= e($o['title']) ?></title>
<meta name="description" content="<?= e($o['description']) ?>">
<meta name="robots" content="<?= e($robots) ?>">
<link rel="canonical" href="<?= e($canonical) ?>">
<?php if ($page !== '404') : ?>
<?php foreach (CITES_LANGS as $alt) : ?>
<link rel="alternate" hreflang="<?= $alt ?>" href="<?= e(page_url($page, $alt)) ?>">
<?php endforeach; ?>
<link rel="alternate" hreflang="x-default" href="<?= e(page_url($page, 'it')) ?>">
<?php endif; ?>
<meta name="theme-color" content="#f4f2ed">
<meta name="color-scheme" content="light">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Cites">
<meta property="og:locale" content="<?= $locale ?>">
<meta property="og:title" content="<?= e($ogTitle) ?>">
<meta property="og:description" content="<?= e($ogDescription) ?>">
<meta property="og:url" content="<?= e($canonical) ?>">
<meta property="og:image" content="<?= e(CITES_SITE_URL . '/assets/img/og.png') ?>">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="<?= te('meta.og.alt') ?>">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="<?= asset('css/fonts.css') ?>">
<link rel="stylesheet" href="<?= asset('css/app.css') ?>">
<script src="<?= asset('js/boot.js') ?>"></script>
<script type="application/ld+json"><?= json_encode([
        '@context' => 'https://schema.org',
        '@type' => 'WebApplication',
        'name' => 'Cites',
        'url' => CITES_SITE_URL,
        'applicationCategory' => 'DesignApplication',
        'operatingSystem' => 'Web',
        'inLanguage' => ['it', 'en'],
        'isAccessibleForFree' => true,
        'offers' => ['@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'EUR'],
        'author' => ['@type' => 'Person', 'name' => 'Alex Testa', 'url' => CITES_AUTHOR_URL],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?></script>
</head>
<body class="min-h-dvh bg-paper text-ink" data-page="<?= e($page) ?>">
<a href="#main" class="fixed left-4 top-4 z-[200] -translate-y-24 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition focus:translate-y-0"><?= te('skip') ?></a>
<div class="page-curtain" aria-hidden="true"><span class="font-serif text-6xl italic">cites.</span></div>
<div class="cursor" aria-hidden="true"></div>
<?php
}

function render_header(string $page): void
{
    $other = cites_lang() === 'it' ? 'en' : 'it';
    $isHome = $page === 'home';
    $anchor = static fn (string $id): string => ($isHome ? '' : page_path('home')) . '#' . $id;
    ?>
<header class="site-header fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,transform] duration-500" data-header>
  <div class="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-5 py-3.5 md:px-10">
    <a href="<?= e(page_path('home')) ?>" class="flex items-center gap-2.5 text-[1.5rem] font-semibold tracking-[-0.05em]" aria-label="<?= te('nav.home') ?>" data-magnetic>
      <?= logo_mark() ?><span aria-hidden="true">cites</span>
    </a>
    <nav aria-label="<?= te('nav.label') ?>" class="hidden items-center gap-8 md:flex">
      <a class="label link-under" href="<?= e($anchor('template')) ?>"><?= te('nav.templates') ?></a>
      <a class="label link-under" href="<?= e($anchor('come-funziona')) ?>"><?= te('nav.how') ?></a>
      <a class="label link-under" href="<?= e($anchor('funzioni')) ?>"><?= te('nav.features') ?></a>
    </nav>
    <div class="flex items-center gap-1.5 sm:gap-3">
      <a class="label inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 hover:bg-paper-3" href="<?= e(page_path($page === '404' ? 'home' : $page, $other)) ?>" hreflang="<?= $other ?>" lang="<?= $other ?>" aria-label="<?= te('lang.other') ?>">
        <span aria-hidden="true" class="text-muted"><?= te('lang.current.short') ?> / </span><?= te('lang.other.short') ?>
      </a>
      <?php if ($page !== 'create') : ?>
      <a class="btn btn-ink btn-arrow hidden sm:inline-flex" href="<?= e(page_path('create')) ?>" data-transition data-magnetic>
        <?= te('nav.create') ?><span class="btn-arrow-icon bg-lime text-ink"><?= icon('arrow-up-right', 16, 2.2) ?></span>
      </a>
      <?php endif; ?>
      <button type="button" class="inline-flex size-11 items-center justify-center rounded-full border border-line bg-paper-2 md:hidden" aria-expanded="false" aria-controls="mobile-menu" data-menu-toggle>
        <span class="sr-only" data-menu-label data-open="<?= te('nav.menu') ?>" data-close="<?= te('nav.close') ?>"><?= te('nav.menu') ?></span><?= icon('menu', 20) ?>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden border-t border-line bg-paper px-5 pb-6 pt-2 md:hidden" data-menu>
    <nav aria-label="<?= te('nav.label') ?>" class="flex flex-col">
      <a class="border-b border-line py-4 text-2xl font-medium tracking-tight" href="<?= e($anchor('template')) ?>"><?= te('nav.templates') ?></a>
      <a class="border-b border-line py-4 text-2xl font-medium tracking-tight" href="<?= e($anchor('come-funziona')) ?>"><?= te('nav.how') ?></a>
      <a class="border-b border-line py-4 text-2xl font-medium tracking-tight" href="<?= e($anchor('funzioni')) ?>"><?= te('nav.features') ?></a>
      <a class="btn btn-ink btn-arrow mt-6 self-start" href="<?= e(page_path('create')) ?>" data-transition><?= te('nav.create') ?><span class="btn-arrow-icon bg-lime text-ink"><?= icon('arrow-up-right', 16, 2.2) ?></span></a>
    </nav>
  </div>
</header>
<?php
}

function render_footer(): void
{
    ?>
<footer class="mx-auto max-w-[1360px] px-5 pb-8 pt-20 md:px-10" data-footer>
  <div class="flex flex-wrap gap-x-16 gap-y-10">
    <p class="max-w-sm flex-[1_1_18rem] text-[0.9375rem] leading-relaxed text-ink-2"><?= te('footer.about') ?></p>
    <nav aria-label="<?= te('footer.site') ?>" class="flex flex-col gap-2.5 text-[0.9375rem]">
      <span class="label mb-1 text-muted"><?= te('footer.site') ?></span>
      <a class="link-under self-start" href="<?= e(page_path('create')) ?>" data-transition><?= te('footer.create') ?></a>
      <a class="link-under self-start" href="<?= e(page_path('home')) ?>#template"><?= te('nav.templates') ?></a>
      <a class="link-under self-start" href="<?= e(page_path('home')) ?>#come-funziona"><?= te('nav.how') ?></a>
    </nav>
    <nav aria-label="<?= te('footer.project') ?>" class="flex flex-col gap-2.5 text-[0.9375rem]">
      <span class="label mb-1 text-muted"><?= te('footer.project') ?></span>
      <a class="link-under self-start" href="<?= e(CITES_REPO_URL) ?>" rel="noopener"><?= te('footer.code') ?></a>
      <a class="link-under self-start" href="<?= e(page_path('privacy')) ?>"><?= te('footer.privacy') ?></a>
      <a class="link-under self-start" href="<?= e(CITES_AUTHOR_URL) ?>" rel="noopener">alextesta.space</a>
    </nav>
  </div>
  <p aria-hidden="true" class="footer-wordmark mt-16 select-none overflow-hidden text-[clamp(6rem,24vw,22rem)] font-semibold leading-[0.78] tracking-[-0.075em]" data-wordmark>cites<span class="text-lime">.</span></p>
  <div class="label mt-7 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-muted">
    <span><?= te('footer.free') ?></span>
    <span><?= te('footer.by') ?> · <?= te('footer.version') ?> <?= e(cites_version()) ?></span>
  </div>
</footer>
<?php
}

/** Script comuni (GSAP, Lenis) più il modulo della pagina. */
function render_scripts(string $module, bool $withLenis = true): void
{
    ?>
<script src="<?= asset('vendor/gsap/gsap.min.js') ?>" defer></script>
<script src="<?= asset('vendor/gsap/ScrollTrigger.min.js') ?>" defer></script>
<script src="<?= asset('vendor/gsap/SplitText.min.js') ?>" defer></script>
<?php if ($withLenis) : ?>
<script src="<?= asset('vendor/lenis/lenis.min.js') ?>" defer></script>
<?php endif; ?>
<script type="module" src="<?= asset('js/' . $module) ?>"></script>
</body>
</html>
<?php
}
