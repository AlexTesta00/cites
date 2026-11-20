<?php

declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';
require __DIR__ . '/includes/layout.php';

render_head([
    'page' => 'home',
    'title' => t('meta.home.title'),
    'description' => t('meta.home.description'),
]);
render_header('home');

$create = page_path('create');
?>
<main id="main" class="overflow-x-clip">

  <!-- Hero -->
  <section class="mx-auto max-w-[1360px] px-5 pt-28 md:px-10 md:pt-36" data-hero>
    <div class="flex flex-wrap items-end gap-x-14 gap-y-10">
      <div class="min-w-0 flex-[1_1_40rem]">
        <p class="inline-flex items-center gap-2.5 rounded-full border border-line bg-paper-2 py-1.5 pl-1.5 pr-4 text-[0.8125rem] font-medium" data-reveal>
          <span class="rounded-full bg-ink px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.06em] text-paper uppercase"><?= te('hero.badge') ?></span>
          <?= te('hero.pill') ?>
        </p>
        <h1 class="mt-7 text-[clamp(3.4rem,10vw,8.6rem)] font-medium leading-[0.92] tracking-[-0.055em]" data-hero-title><?= te('hero.title.a') ?><br><em class="serif-italic hl-sweep" style="--hl:0%" data-hl><?= te('hero.title.b') ?></em></h1>
      </div>
      <div class="min-w-0 flex-[1_1_20rem] pb-2">
        <p class="max-w-md text-[1.1875rem] leading-relaxed text-ink-2" data-reveal><?= te('hero.lead') ?></p>
        <div class="mt-7 flex flex-wrap items-center gap-5" data-reveal>
          <a class="btn btn-ink btn-arrow min-h-14 pl-6 text-base" href="<?= e($create) ?>" data-transition data-magnetic>
            <?= te('hero.cta') ?><span class="btn-arrow-icon size-10 bg-lime text-ink"><?= icon('arrow-up-right', 16, 2.2) ?></span>
          </a>
          <a class="group inline-flex min-h-11 items-center gap-2.5 font-medium" href="#come-funziona">
            <?= te('hero.how') ?>
            <span class="inline-flex size-8 items-center justify-center rounded-full border border-ink transition group-hover:bg-ink group-hover:text-paper"><?= icon('play', 12) ?></span>
          </a>
        </div>
      </div>
    </div>

    <!-- Palco: sagome dei formati e mazzo di template -->
    <div class="relative mt-14 h-[34rem] border-y border-line sm:h-[38rem]" data-stage>
      <div aria-hidden="true" class="pointer-events-none absolute inset-0" data-outlines>
        <div class="absolute bottom-0 left-0 hidden h-[12rem] w-[24%] border border-b-0 border-[#c9c4b9] sm:block" data-outline><span class="label absolute left-3 top-2.5 text-[0.6875rem] text-muted">16:9 · 1920×1080</span></div>
        <div class="absolute bottom-0 left-[24%] hidden h-[19rem] w-[17%] border border-b-0 border-[#c9c4b9] lg:block" data-outline><span class="label absolute left-3 top-2.5 text-[0.6875rem] text-muted">1:1 · 1080×1080</span></div>
        <div class="absolute bottom-0 right-[21%] hidden h-[26rem] w-[18%] border border-b-0 border-[#c9c4b9] lg:block" data-outline><span class="label absolute left-3 top-2.5 text-[0.6875rem] text-muted">3:4 · 1080×1440</span></div>
        <div class="absolute bottom-0 right-0 h-[30rem] w-[30%] border border-b-0 border-[#c9c4b9] sm:h-[34rem] sm:w-[21%]" data-outline><span class="label absolute left-3 top-2.5 text-[0.6875rem] text-muted">9:16 · 1080×1920</span></div>
      </div>

      <div class="absolute bottom-8 left-1/2 aspect-[4/5] w-[min(25rem,72vw)] -translate-x-1/2" role="img" aria-label="<?= te('hero.deck') ?>" data-deck>
        <?php for ($i = 0; $i < 5; $i++) : ?>
        <div class="deck-card absolute inset-0 overflow-hidden rounded-[4px] bg-[#e7e3da] shadow-[0_2px_4px_rgba(20,18,14,0.12),0_40px_80px_-30px_rgba(20,18,14,0.5)]" data-deck-card></div>
        <?php endfor; ?>
      </div>

      <p class="pill absolute left-[6%] top-10 shadow-[0_12px_24px_-16px_rgba(20,18,14,0.4)] sm:left-[30%] sm:top-16" data-chip><span aria-hidden="true" class="size-2.5 rounded-[3px] bg-lime"></span><?= te('hero.chip.templates') ?></p>
      <p class="pill absolute right-[6%] top-28 hidden shadow-[0_12px_24px_-16px_rgba(20,18,14,0.4)] sm:inline-flex lg:right-[27%] lg:top-36" data-chip><span aria-hidden="true" class="h-0.5 w-3.5 bg-pen"></span><?= te('hero.chip.carousel') ?></p>
      <p class="pill absolute bottom-24 left-[4%] border-ink bg-ink text-paper shadow-[0_12px_24px_-16px_rgba(20,18,14,0.6)] sm:left-[27%]" data-chip><?= te('hero.chip.png') ?></p>
    </div>
  </section>

  <!-- Numeri -->
  <section class="mx-auto mt-16 max-w-[1360px] px-5 md:px-10" aria-label="<?= te('stats.label') ?>">
    <div class="on-night flex flex-wrap rounded-[28px] bg-night px-3 py-10 text-paper" data-stats>
      <div class="min-w-0 flex-[1_1_15rem] px-7 py-3">
        <p class="label flex items-center gap-2 text-night-muted"><span aria-hidden="true" class="size-2 rounded-full bg-lime animate-pulse-dot"></span><?= te('stats.live') ?></p>
        <p class="mt-3.5 font-serif text-[5.25rem] leading-[0.95]"><span data-count="people">0</span></p>
        <p class="mt-2.5 font-medium" data-people-label data-one="<?= te('stats.people.one') ?>" data-many="<?= te('stats.people') ?>" data-zero="<?= te('stats.people.zero') ?>"><?= te('stats.people') ?></p>
        <p class="mt-1.5 text-sm leading-relaxed text-night-muted"><?= te('stats.people.note') ?></p>
      </div>
      <div class="min-w-0 flex-[1_1_15rem] border-paper/15 px-7 py-3 sm:border-l">
        <p class="label text-night-muted"><?= te('stats.images.label') ?></p>
        <p class="mt-3.5 font-serif text-[5.25rem] leading-[0.95]"><span data-count="images">0</span></p>
        <p class="mt-2.5 font-medium"><?= te('stats.images') ?></p>
        <p class="mt-1.5 text-sm leading-relaxed text-night-muted"><?= te('stats.images.note') ?></p>
      </div>
      <div class="min-w-0 flex-[1_1_15rem] border-paper/15 px-7 py-3 lg:border-l">
        <p class="label text-night-muted"><?= te('stats.templates.label') ?></p>
        <p class="mt-3.5 font-serif text-[5.25rem] leading-[0.95]"><span data-count-static="<?= CITES_TEMPLATE_COUNT ?>"><?= CITES_TEMPLATE_COUNT ?></span></p>
        <p class="mt-2.5 font-medium"><?= te('stats.templates') ?></p>
        <p class="mt-1.5 text-sm leading-relaxed text-night-muted"><?= te('stats.templates.note') ?></p>
      </div>
      <div class="min-w-0 flex-[1_1_15rem] border-paper/15 px-7 py-3 sm:border-l">
        <p class="label text-night-muted"><?= te('stats.price.label') ?></p>
        <p class="mt-3.5 font-serif text-[5.25rem] leading-[0.95]">0&nbsp;€</p>
        <p class="mt-2.5 font-medium"><?= te('stats.price') ?></p>
        <p class="mt-1.5 text-sm leading-relaxed text-night-muted"><?= te('stats.price.note') ?></p>
      </div>
    </div>
  </section>

  <!-- Cos'è -->
  <section class="mx-auto flex max-w-[1360px] flex-wrap gap-x-10 gap-y-6 px-5 py-28 md:px-10 md:py-36">
    <p class="label label-dot flex-[0_0_14rem] pt-3" data-reveal><?= te('about.label') ?></p>
    <p class="min-w-0 flex-[1_1_40rem] text-[clamp(1.9rem,4.2vw,3.3rem)] font-medium leading-[1.1] tracking-[-0.035em]" data-scrub-text>
      <?= te('about.text.a') ?> <span class="text-faint" data-scrub-dim><?= te('about.text.b') ?></span>
    </p>
  </section>

  <!-- Template -->
  <section id="template" class="mx-auto max-w-[1360px] scroll-mt-24 px-5 pb-28 md:px-10 md:pb-36">
    <div class="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p class="label label-dot" data-reveal><?= te('tpl.label') ?></p>
        <h2 class="mt-4 text-[clamp(2.8rem,6.5vw,5rem)] font-medium leading-[0.95] tracking-[-0.05em]" data-split><?= te('tpl.title.a') ?> <em class="serif-italic"><?= te('tpl.title.b') ?></em></h2>
        <p class="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2" data-reveal><?= te('tpl.lead') ?></p>
      </div>
      <a class="btn btn-ink btn-arrow" href="<?= e($create) ?>" data-transition data-magnetic><?= te('tpl.cta') ?><span class="btn-arrow-icon bg-lime text-ink"><?= icon('arrow-up-right', 16, 2.2) ?></span></a>
    </div>
    <div class="scrollbar-none -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="<?= te('tpl.filters') ?>" data-tpl-filters></div>
    <ul class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" data-tpl-grid aria-live="polite"></ul>
    <noscript><p class="mt-8 text-muted"><?= te('ed.noscript') ?></p></noscript>
  </section>

  <!-- Come funziona -->
  <section id="come-funziona" class="mx-auto max-w-[1360px] scroll-mt-24 px-5 pb-28 md:px-10 md:pb-36">
    <div class="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-7">
      <h2 class="text-[clamp(2.8rem,6.5vw,5rem)] font-medium leading-[0.95] tracking-[-0.05em]" data-split><?= te('how.title.a') ?> <em class="serif-italic"><?= te('how.title.b') ?></em></h2>
      <p class="label label-dot" data-reveal><?= te('how.label') ?></p>
    </div>
    <ol class="grid md:grid-cols-3" data-steps>
      <?php
        $steps = [
            ['01', 'pen', 'how.1.title', 'how.1.text'],
            ['02', 'layers', 'how.2.title', 'how.2.text'],
            ['03', 'download', 'how.3.title', 'how.3.text'],
        ];
foreach ($steps as $index => [$number, $iconName, $title, $text]) :
    $border = $index < 2 ? 'md:border-r' : '';
    $pad = $index === 0 ? 'md:pr-8' : ($index === 1 ? 'md:px-8' : 'md:pl-8');
    ?>
      <li class="border-b border-line py-8 md:border-b-0 <?= $border ?> <?= $pad ?>" data-step>
        <div class="flex items-center justify-between">
          <span class="font-mono text-[0.8125rem] text-muted"><?= $number ?></span>
          <span data-draw><?= icon($iconName, 30, 1.4) ?></span>
        </div>
        <h3 class="mt-10 text-[1.75rem] font-medium tracking-[-0.03em]"><?= te($title) ?></h3>
        <p class="mt-2.5 leading-relaxed text-ink-2"><?= te($text) ?></p>
      </li>
      <?php endforeach; ?>
    </ol>
  </section>

  <!-- Funzioni -->
  <section id="funzioni" class="mx-auto max-w-[1360px] scroll-mt-24 px-5 pb-28 md:px-10 md:pb-36">
    <div class="flex flex-wrap items-end justify-between gap-6 pb-10">
      <h2 class="text-[clamp(2.8rem,6.5vw,5rem)] font-medium leading-[0.95] tracking-[-0.05em]" data-split><?= te('feat.title.a') ?> <em class="serif-italic"><?= te('feat.title.b') ?></em></h2>
      <p class="label label-dot" data-reveal><?= te('feat.label') ?></p>
    </div>
    <ul class="grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3" data-features>
      <?php
$features = [
    ['formats', 'feat.formats.title', 'feat.formats.text'],
    ['feather', 'feat.fonts.title', 'feat.fonts.text'],
    ['highlighter', 'feat.marks.title', 'feat.marks.text'],
    ['carousel', 'feat.carousel.title', 'feat.carousel.text'],
    ['link', 'feat.share.title', 'feat.share.text'],
    ['book', 'feat.inspire.title', 'feat.inspire.text'],
];
foreach ($features as [$iconName, $title, $text]) :
    ?>
      <li class="feature group relative overflow-hidden border-b border-r border-line p-8" data-feature>
        <span aria-hidden="true" class="absolute inset-0 origin-left scale-x-0 bg-lime transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"></span>
        <div class="relative">
          <?= icon($iconName, 28, 1.4) ?>
          <h3 class="mt-6 text-[1.3125rem] font-medium tracking-[-0.02em]"><?= te($title) ?></h3>
          <p class="mt-2 text-[0.9375rem] leading-relaxed text-ink-2"><?= te($text) ?></p>
        </div>
      </li>
      <?php endforeach; ?>
    </ul>
  </section>

  <!-- Chiusura -->
  <section class="mx-auto max-w-[1360px] px-5 md:px-10">
    <div class="on-night relative overflow-hidden rounded-[28px] bg-night px-6 pb-24 pt-20 text-center text-paper md:px-10" data-cta>
      <div aria-hidden="true" class="marquee overflow-hidden">
        <div class="marquee-track animate-marquee label whitespace-nowrap text-night-muted">
          <span class="pr-2"><?= te('cta.authors') ?></span><span class="pr-2"><?= te('cta.authors') ?></span>
        </div>
      </div>
      <h2 class="mt-12 text-[clamp(3.2rem,9vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.055em]" data-split>
        <?= te('cta.title.a') ?> <em class="serif-italic hl-sweep text-ink" style="--hl:0%" data-hl><?= te('cta.title.b') ?></em>
      </h2>
      <a class="btn btn-lime btn-arrow mt-11 min-h-14 pl-7 text-base font-semibold" href="<?= e($create) ?>" data-transition data-magnetic>
        <?= te('cta.button') ?><span class="btn-arrow-icon size-10 bg-ink text-paper"><?= icon('arrow-up-right', 16, 2.2) ?></span>
      </a>
    </div>
  </section>
</main>
<?php
render_footer();
render_scripts('home.js');
