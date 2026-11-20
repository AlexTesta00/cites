<?php

declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';
require __DIR__ . '/includes/layout.php';

http_response_code(404);
render_head([
    'page' => '404',
    'title' => t('meta.404.title'),
    'description' => t('nf.text'),
    'canonical' => page_url('home'),
    'robots' => 'noindex,follow',
]);
render_header('404');
?>
<main id="main" class="mx-auto flex min-h-[80dvh] max-w-[1360px] flex-col justify-center px-5 pb-16 pt-32 md:px-10">
  <p class="label label-dot" data-reveal><?= te('nf.label') ?></p>
  <h1 class="mt-5 max-w-5xl text-[clamp(3rem,9vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.055em]" data-split>
    <?= te('nf.title.a') ?> <em class="serif-italic"><?= te('nf.title.b') ?></em>
  </h1>
  <p class="mt-7 max-w-xl text-lg leading-relaxed text-ink-2" data-reveal><?= te('nf.text') ?></p>
  <div class="mt-9 flex flex-wrap gap-3" data-reveal>
    <a class="btn btn-ink btn-arrow pl-6" href="<?= e(page_path('create')) ?>" data-transition><?= te('hero.cta') ?><span class="btn-arrow-icon bg-lime text-ink"><?= icon('arrow-up-right', 16, 2.2) ?></span></a>
    <a class="btn btn-ghost" href="<?= e(page_path('home')) ?>"><?= te('nf.home') ?></a>
  </div>
</main>
<?php
render_footer();
render_scripts('page.js');
