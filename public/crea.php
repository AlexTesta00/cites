<?php

declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';
require __DIR__ . '/includes/layout.php';

$shared = shared_quote();
$title = t('meta.create.title');
$description = t('meta.create.description');
$ogTitle = $title;
$ogDescription = $description;
if ($shared !== null && $shared['text'] !== '') {
    $short = mb_strimwidth($shared['text'], 0, 90, '…');
    $ogTitle = t('meta.shared.title', ['text' => $short]);
    $ogDescription = $shared['author'] !== '' ? '— ' . $shared['author'] : $description;
}

render_head([
    'page' => 'create',
    'title' => $title,
    'description' => $description,
    'og_title' => $ogTitle,
    'og_description' => $ogDescription,
    'robots' => $shared !== null ? 'noindex,follow' : 'index,follow',
]);

$other = cites_lang() === 'it' ? 'en' : 'it';
?>
<header class="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md" data-editor-bar>
  <div class="flex items-center justify-between gap-3 px-4 py-2.5 md:px-6">
    <a href="<?= e(page_path('home')) ?>" class="flex items-center gap-2.5 text-[1.375rem] font-semibold tracking-[-0.05em]" aria-label="<?= te('nav.home') ?>" data-transition>
      <?= logo_mark('size-7') ?><span aria-hidden="true">cites</span>
    </a>
    <h1 class="sr-only"><?= te('ed.heading') ?></h1>
    <div class="flex items-center gap-1.5 sm:gap-2">
      <a class="label hidden min-h-11 min-w-11 items-center justify-center rounded-full px-2 hover:bg-paper-3 sm:inline-flex" href="<?= e(page_path('create', $other)) ?>" hreflang="<?= $other ?>" lang="<?= $other ?>" aria-label="<?= te('lang.other') ?>" data-keep-state>
        <span aria-hidden="true" class="text-muted"><?= te('lang.current.short') ?> / </span><?= te('lang.other.short') ?>
      </a>
      <button type="button" class="btn btn-ghost hidden px-4 md:inline-flex" data-action="copy-link"><?= icon('link', 18) ?><span><?= te('ed.copyLink') ?></span></button>
      <button type="button" class="btn btn-ghost px-3 sm:px-4" data-action="share" hidden><?= icon('share', 18) ?><span class="hidden sm:inline"><?= te('ed.share') ?></span></button>
      <button type="button" class="btn btn-ink btn-arrow pl-5" data-action="download">
        <span data-download-label data-single="<?= te('ed.download') ?>" data-multi="<?= te('ed.download.zip') ?>"><?= te('ed.download') ?></span>
        <span class="btn-arrow-icon bg-lime text-ink"><?= icon('download', 16, 2) ?></span>
      </button>
    </div>
  </div>
</header>

<main id="main" class="editor lg:grid lg:h-[calc(100dvh-4.0625rem)] lg:grid-cols-[18rem_minmax(0,1fr)_20rem] xl:grid-cols-[21rem_minmax(0,1fr)_25rem]" data-editor>
  <noscript><p class="p-6 text-lg"><?= te('ed.noscript') ?></p></noscript>

  <!-- Anteprima -->
  <section class="stage sticky top-[4.0625rem] z-30 flex flex-col border-b border-line bg-paper-3/70 backdrop-blur-sm lg:static lg:order-2 lg:h-full lg:border-b-0 lg:bg-paper-3" aria-label="<?= te('ed.preview') ?>">
    <div class="flex items-center gap-2 border-b border-line px-3 py-2 md:px-5">
      <div class="scrollbar-none flex min-w-0 flex-1 gap-1.5 overflow-x-auto" role="radiogroup" aria-label="<?= te('ed.format') ?>" data-formats></div>
      <label class="label hidden shrink-0 cursor-pointer items-center gap-2 text-ink-2" title="<?= te('ed.safe.hint') ?>" data-safe-toggle>
        <input type="checkbox" class="peer sr-only" data-input="safe">
        <span class="switch"></span><?= te('ed.safe') ?>
      </label>
      <button type="button" class="chip min-h-10 shrink-0 text-[0.8125rem]" aria-pressed="false" data-action="phone"><?= icon('phone', 16) ?><span class="hidden sm:inline"><?= te('ed.phone') ?></span><span class="sr-only sm:hidden"><?= te('ed.phone') ?></span></button>
    </div>
    <div class="relative flex min-h-0 flex-1 items-center justify-center p-3 max-lg:h-[clamp(15rem,44svh,32rem)] max-lg:flex-none md:p-8" data-preview-wrap>
      <div class="device" data-device>
        <div class="device-screen" data-device-screen>
          <div class="device-chrome device-status" aria-hidden="true">
            <span class="device-clock">9:41</span><span class="device-island"></span>
            <span class="device-icons"><svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg><svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke="currentColor" opacity="0.5"/><rect x="2" y="2" width="15" height="7" rx="1.6" fill="currentColor"/><rect x="21.5" y="3.5" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.5"/></svg></span>
          </div>
          <div class="device-chrome feed-only feed-head" aria-hidden="true">
            <span class="device-avatar"></span><span class="font-semibold" data-phone-handle></span>
            <svg class="ml-auto" width="18" height="4" viewBox="0 0 18 4" fill="currentColor"><circle cx="2" cy="2" r="1.8"/><circle cx="9" cy="2" r="1.8"/><circle cx="16" cy="2" r="1.8"/></svg>
          </div>
          <div class="preview-frame relative" data-preview-frame>
            <canvas class="block size-full touch-none" data-preview aria-describedby="marks-hint"></canvas>
            <canvas class="pointer-events-none absolute inset-0 size-full" data-overlay aria-hidden="true"></canvas>
            <div class="device-chrome story-only story-top" aria-hidden="true">
              <div class="story-bars" data-story-bars></div>
              <div class="story-head">
                <span class="device-avatar"></span><span class="font-semibold" data-phone-handle></span><span class="opacity-75" data-phone-now></span>
                <svg class="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>
              </div>
            </div>
          </div>
          <div class="device-chrome story-only story-reply" aria-hidden="true">
            <span class="story-input" data-phone-reply></span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m10 13 4-4"/></svg>
          </div>
          <div class="device-chrome feed-only feed-actions" aria-hidden="true">
            <div class="flex items-center gap-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/></svg>
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m10 13 4-4"/></svg>
              <span class="feed-dots" data-feed-dots></span>
              <svg class="ml-auto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
            </div>
            <p class="feed-caption"><span class="font-semibold" data-phone-handle></span> <span data-phone-caption></span></p>
          </div>
        </div>
      </div>
      <p class="label pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-paper-2/90 px-3 py-1.5 text-muted opacity-0 transition-opacity" data-page-indicator aria-hidden="true"></p>
    </div>
    <!-- Segni a mano -->
    <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-line bg-paper/70 px-3 py-2.5" role="toolbar" aria-label="<?= te('ed.marks') ?>" data-marks-bar>
      <div class="flex gap-1" role="radiogroup" aria-label="<?= te('ed.marks') ?>" data-tools></div>
      <div class="flex items-center gap-1" data-swatches aria-label="<?= te('ed.hl') ?>" role="radiogroup"></div>
      <div class="flex items-center gap-1">
        <button type="button" class="inline-flex size-10 items-center justify-center rounded-full hover:bg-paper-3 disabled:opacity-35" data-action="undo" aria-label="<?= te('ed.undo') ?>" disabled><?= icon('undo', 18) ?></button>
        <button type="button" class="inline-flex size-10 items-center justify-center rounded-full hover:bg-paper-3 disabled:opacity-35" data-action="redo" aria-label="<?= te('ed.redo') ?>" disabled><?= icon('redo', 18) ?></button>
        <button type="button" class="chip hidden min-h-10 text-[0.8125rem] sm:inline-flex" data-action="auto-marks"><?= te('ed.marks.auto') ?></button>
        <button type="button" class="chip hidden min-h-10 text-[0.8125rem] sm:inline-flex" data-action="clear-marks"><?= te('ed.marks.clear') ?></button>
      </div>
      <p id="marks-hint" class="sr-only"><?= te('ed.marks.hint') ?></p>
    </div>
  </section>

  <!-- Testo e pagine -->
  <aside class="panel border-line lg:order-1 lg:overflow-y-auto lg:border-r" aria-label="<?= te('ed.panel.text') ?>" data-panel-text>
    <div class="space-y-6 p-5 md:p-6">
      <div>
        <div class="flex items-baseline justify-between">
          <label for="quote" class="label text-ink-2"><?= te('ed.text') ?></label>
          <span class="font-mono text-[0.6875rem] text-muted" data-char-count>0 / 280</span>
        </div>
        <textarea id="quote" class="field mt-2 min-h-32 resize-y font-book text-[1.1875rem] leading-snug" maxlength="280" placeholder="<?= te('ed.text.placeholder') ?>" data-input="text" aria-describedby="quote-hint"></textarea>
        <div class="mt-2 flex items-center justify-between gap-3">
          <p id="quote-hint" class="text-xs text-muted"><?= te('ed.text.hint') ?></p>
          <button type="button" class="chip shrink-0 border-ink bg-ink text-paper hover:bg-[#262624]" data-action="inspire"><?= icon('sparkle', 16) ?><?= te('ed.inspire') ?></button>
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label for="author" class="label text-ink-2"><?= te('ed.author') ?> <span class="normal-case tracking-normal text-muted">· <?= te('ed.optional') ?></span></label>
          <input id="author" type="text" class="field mt-2" maxlength="80" autocomplete="off" placeholder="<?= te('ed.author.placeholder') ?>" data-input="author">
        </div>
        <div>
          <label for="work" class="label text-ink-2"><?= te('ed.work') ?> <span class="normal-case tracking-normal text-muted">· <?= te('ed.optional') ?></span></label>
          <input id="work" type="text" class="field mt-2" maxlength="80" autocomplete="off" placeholder="<?= te('ed.work.placeholder') ?>" data-input="work">
        </div>
      </div>
      <label class="flex cursor-pointer items-center justify-between gap-3 text-[0.9375rem]">
        <?= te('ed.showAuthor') ?>
        <input type="checkbox" class="peer sr-only" data-input="showAuthor" checked><span class="switch"></span>
      </label>
      <fieldset>
        <legend class="label text-ink-2"><?= te('ed.quotes') ?></legend>
        <div class="mt-2 flex gap-1.5" data-quotes>
          <button type="button" class="chip" data-quote-mode="none" aria-pressed="true"><?= te('ed.quotes.none') ?></button>
          <button type="button" class="chip font-book text-base" data-quote-mode="curly" aria-pressed="false">“ ”</button>
          <button type="button" class="chip font-book text-base" data-quote-mode="guillemets" aria-pressed="false">« »</button>
        </div>
      </fieldset>
      <div class="border-t border-line pt-6">
        <div class="flex items-baseline justify-between">
          <h2 class="label text-ink-2"><?= te('ed.pages') ?></h2>
          <span class="text-xs text-muted"><?= te('ed.pages.hint') ?></span>
        </div>
        <ol class="mt-3 flex flex-wrap gap-2" data-pages aria-label="<?= te('ed.pages') ?>"></ol>
      </div>
    </div>
  </aside>

  <!-- Template e personalizzazione -->
  <aside class="panel flex flex-col border-line lg:order-3 lg:overflow-hidden lg:border-l" aria-label="<?= te('ed.panel.templates') ?>" data-panel-right>
    <div class="sticky top-[calc(4.0625rem+var(--stage-h,0px))] z-10 flex gap-1 border-b border-t border-line bg-paper p-2 lg:static lg:border-t-0" role="tablist" aria-label="<?= te('ed.panel.templates') ?>">
      <button type="button" role="tab" id="tab-templates" class="chip flex-1 justify-center" aria-selected="true" aria-controls="panel-templates" data-tab="templates"><?= te('ed.panel.templates') ?></button>
      <button type="button" role="tab" id="tab-custom" class="chip flex-1 justify-center" aria-selected="false" aria-controls="panel-custom" tabindex="-1" data-tab="custom"><?= te('ed.panel.custom') ?></button>
    </div>

    <div id="panel-templates" role="tabpanel" aria-labelledby="tab-templates" class="min-h-0 flex-1 lg:overflow-y-auto" data-tabpanel="templates">
      <div class="scrollbar-none flex gap-1.5 overflow-x-auto px-4 pt-4" role="group" aria-label="<?= te('tpl.filters') ?>" data-families></div>
      <ul class="grid grid-cols-2 gap-x-3 gap-y-5 p-4 sm:grid-cols-3 lg:grid-cols-2" data-templates></ul>
    </div>

    <div id="panel-custom" role="tabpanel" aria-labelledby="tab-custom" class="min-h-0 flex-1 space-y-7 p-5 lg:overflow-y-auto" data-tabpanel="custom" hidden>
      <fieldset>
        <legend class="label text-ink-2"><?= te('ed.paper') ?></legend>
        <div class="mt-3 grid grid-cols-4 gap-2" data-papers></div>
      </fieldset>
      <fieldset>
        <legend class="label text-ink-2"><?= te('ed.font') ?></legend>
        <div class="mt-3 grid grid-cols-2 gap-1.5" data-fonts></div>
      </fieldset>
      <fieldset>
        <legend class="label text-ink-2"><?= te('ed.ink') ?></legend>
        <div class="mt-3 flex flex-wrap gap-1.5" data-inks></div>
      </fieldset>
      <fieldset>
        <legend class="label text-ink-2"><?= te('ed.pen') ?></legend>
        <div class="mt-3 flex flex-wrap gap-1.5" data-pens></div>
      </fieldset>
      <div class="grid grid-cols-2 gap-4">
        <fieldset>
          <legend class="label text-ink-2"><?= te('ed.align') ?></legend>
          <div class="mt-3 flex gap-1" data-aligns></div>
        </fieldset>
        <div>
          <label for="size" class="label text-ink-2"><?= te('ed.size') ?></label>
          <input id="size" type="range" min="60" max="140" step="5" value="100" class="mt-4 w-full accent-ink" data-input="size">
        </div>
      </div>
      <fieldset class="space-y-3 border-t border-line pt-6">
        <legend class="label text-ink-2"><?= te('ed.details') ?></legend>
        <label class="flex cursor-pointer items-center justify-between gap-3 text-[0.9375rem]"><?= te('ed.details.page') ?><input type="checkbox" class="peer sr-only" data-input="pageNumber"><span class="switch"></span></label>
        <label class="flex items-center justify-between gap-3 text-[0.9375rem]"><?= te('ed.details.pageStart') ?><input type="number" min="1" max="999" class="field w-24 py-1.5 text-right" data-input="pageStart"></label>
        <label class="flex cursor-pointer items-center justify-between gap-3 text-[0.9375rem]"><?= te('ed.details.head') ?><input type="checkbox" class="peer sr-only" data-input="runningHead"><span class="switch"></span></label>
        <label class="flex cursor-pointer items-center justify-between gap-3 text-[0.9375rem]"><?= te('ed.details.arrow') ?><input type="checkbox" class="peer sr-only" data-input="arrow"><span class="switch"></span></label>
        <div>
          <label for="handle" class="text-[0.9375rem]"><?= te('ed.details.handle') ?></label>
          <input id="handle" type="text" class="field mt-2" maxlength="40" autocomplete="off" placeholder="<?= te('ed.details.handle.placeholder') ?>" data-input="handle">
        </div>
      </fieldset>
      <div class="flex flex-wrap gap-2 border-t border-line pt-6">
        <button type="button" class="chip" data-action="reroll"><?= icon('refresh', 16) ?><?= te('ed.reroll') ?></button>
        <button type="button" class="chip" data-action="reset-template"><?= te('ed.resetTemplate') ?></button>
      </div>
      <fieldset class="border-t border-line pt-6">
        <legend class="label text-ink-2"><?= te('ed.quality') ?></legend>
        <div class="mt-3 flex gap-1.5" data-quality>
          <button type="button" class="chip" data-scale="1" aria-pressed="true"><?= te('ed.quality.standard') ?></button>
          <button type="button" class="chip" data-scale="2" aria-pressed="false"><?= te('ed.quality.hd') ?></button>
        </div>
      </fieldset>
    </div>
  </aside>
</main>

<div class="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4" aria-live="polite" data-toasts></div>
<?php
render_scripts('editor/main.js', false);
