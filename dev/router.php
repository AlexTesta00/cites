<?php

declare(strict_types=1);

/*
 * Router per il server di sviluppo di PHP:
 *   php -S 127.0.0.1:8080 -t public dev/router.php
 * Riproduce le regole di public/.htaccess (indirizzi puliti, cartelle protette, intestazioni).
 */

$public = realpath(__DIR__ . '/../public');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = rawurldecode($path);

$routes = [
    '/' => ['index.php', []],
    '/crea' => ['crea.php', []],
    '/privacy' => ['privacy.php', []],
    '/en' => ['index.php', ['lang' => 'en']],
    '/en/create' => ['crea.php', ['lang' => 'en']],
    '/en/privacy' => ['privacy.php', ['lang' => 'en']],
    '/api/counter' => ['api/counter.php', []],
];

$sendHeaders = static function (): void {
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
};

$notFound = static function () use ($public, $sendHeaders): bool {
    $sendHeaders();
    $_GET = [];
    require $public . '/404.php';
    return true;
};

// Solo in sviluppo (questo file non viene pubblicato): salva in public/assets/img
// le immagini generate dal browser con il motore di Cites (anteprima social e icone).
if ($path === '/__dev/save' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $name = basename((string) ($_GET['name'] ?? ''));
    $data = (string) file_get_contents('php://input');
    if (!preg_match('/^(og|icon-192|icon-512|apple-touch-icon)\.png$/', $name) || !str_starts_with($data, "\x89PNG")) {
        http_response_code(400);
        echo 'richiesta non valida';
        return true;
    }
    if (!is_dir($public . '/assets/img')) {
        mkdir($public . '/assets/img', 0775, true);
    }
    file_put_contents($public . '/assets/img/' . $name, $data);
    echo 'ok ' . strlen($data);
    return true;
}

if (preg_match('#^/(includes|storage)(/|$)#', $path) || preg_match('#/\.(?!well-known/)#', $path)) {
    return $notFound();
}

$key = $path === '/' ? '/' : rtrim($path, '/');
if (isset($routes[$key])) {
    [$file, $query] = $routes[$key];
    $_GET = $query + $_GET;
    $sendHeaders();
    chdir(dirname($public . '/' . $file));
    require $public . '/' . $file;
    return true;
}

$file = $public . $path;
if (is_file($file) && str_starts_with((string) realpath($file), $public)) {
    if (str_ends_with($file, '.php')) {
        $sendHeaders();
        require $file;
        return true;
    }
    return false;
}

return $notFound();
