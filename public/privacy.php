<?php

declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';
require __DIR__ . '/includes/layout.php';

render_head([
    'page' => 'privacy',
    'title' => t('meta.privacy.title'),
    'description' => t('meta.privacy.description'),
]);
render_header('privacy');

$sections = ['who', 'local', 'counter', 'links', 'hosting', 'none', 'rights'];
?>
<main id="main" class="mx-auto max-w-[1360px] px-5 pb-10 pt-32 md:px-10 md:pt-40">
  <div class="flex flex-wrap gap-x-16 gap-y-8">
    <div class="flex-[1_1_18rem]">
      <p class="label label-dot" data-reveal><?= te('privacy.updated') ?></p>
      <h1 class="mt-5 text-[clamp(3rem,8vw,6rem)] font-medium leading-[0.92] tracking-[-0.05em]" data-split><?= te('privacy.title') ?><span class="text-lime">.</span></h1>
      <p class="mt-6 max-w-sm text-lg leading-relaxed text-ink-2" data-reveal><?= te('privacy.intro') ?></p>
    </div>
    <div class="min-w-0 flex-[2_1_32rem] border-t border-line">
      <?php foreach ($sections as $index => $key) : ?>
      <section class="grid gap-3 border-b border-line py-8 md:grid-cols-[4rem_1fr]" data-reveal>
        <span class="font-mono text-[0.8125rem] text-muted"><?= str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) ?></span>
        <div>
          <h2 class="text-[1.5rem] font-medium tracking-[-0.03em]"><?= te('privacy.' . $key . '.title') ?></h2>
          <p class="mt-2.5 max-w-2xl leading-relaxed text-ink-2"><?= te('privacy.' . $key . '.text') ?></p>
        </div>
      </section>
      <?php endforeach; ?>
    </div>
  </div>
</main>
<?php
render_footer();
render_scripts('page.js');
