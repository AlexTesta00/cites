<?php

declare(strict_types=1);

/*
 * Test minimi del contatore, senza dipendenze: php tests/php/run.php
 */

require __DIR__ . '/../../public/includes/Counter.php';

$failures = 0;
$check = static function (string $name, bool $ok) use (&$failures): void {
    echo ($ok ? '  ok   ' : '  FAIL ') . $name . PHP_EOL;
    if (!$ok) {
        $failures++;
    }
};

$dir = sys_get_temp_dir() . '/cites-test-' . bin2hex(random_bytes(4));
mkdir($dir);

echo 'CounterStore' . PHP_EOL;
$store = new CounterStore($dir);
$check('parte da zero', $store->read() === ['people' => 0, 'images' => 0]);
$check('somma persone e immagini', $store->add(1, 3) === ['people' => 1, 'images' => 3]);
$check('ignora valori negativi', $store->add(-5, -2) === ['people' => 1, 'images' => 3]);
$check('i totali restano su disco', (new CounterStore($dir))->read() === ['people' => 1, 'images' => 3]);
file_put_contents($dir . '/counter.json', '{rotto');
$check('un file corrotto riparte da zero', $store->read() === ['people' => 0, 'images' => 0]);

echo 'RateLimiter' . PHP_EOL;
$limiter = new RateLimiter($dir, minInterval: 2, dailyMax: 3);
$now = 1_800_000_000;
$check('prima richiesta accettata', $limiter->allow('203.0.113.7', $now));
$check('richiesta troppo ravvicinata respinta', !$limiter->allow('203.0.113.7', $now + 1));
$check('altro indirizzo indipendente', $limiter->allow('198.51.100.4', $now + 1));
$check('dopo l’intervallo accettata', $limiter->allow('203.0.113.7', $now + 3));
$check('terza accettata', $limiter->allow('203.0.113.7', $now + 6));
$check('oltre il massimo giornaliero respinta', !$limiter->allow('203.0.113.7', $now + 9));
$check('il giorno dopo si riparte', $limiter->allow('203.0.113.7', $now + 86400));
$state = json_decode((string) file_get_contents($dir . '/ratelimit.json'), true);
$check('nessun IP in chiaro su disco', !str_contains((string) json_encode($state), '203.0.113.7'));

array_map('unlink', glob($dir . '/*') ?: []);
rmdir($dir);

if ($failures > 0) {
    echo PHP_EOL . $failures . ' test falliti' . PHP_EOL;
    exit(1);
}
echo PHP_EOL . 'Tutti i test PHP sono passati' . PHP_EOL;
