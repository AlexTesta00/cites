<?php

declare(strict_types=1);

/*
 * GET  /api/counter  -> {"people": n, "images": n}
 * POST /api/counter  {"pages": 1-30, "first": bool} -> totali aggiornati
 */

require dirname(__DIR__) . '/includes/bootstrap.php';
require dirname(__DIR__) . '/includes/Counter.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$respond = static function (int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body);
    exit;
};

try {
    $store = new CounterStore(CITES_STORAGE);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET' || $method === 'HEAD') {
        $respond(200, $store->read());
    }
    if ($method !== 'POST') {
        header('Allow: GET, POST');
        $respond(405, ['error' => 'method_not_allowed']);
    }

    // Solo richieste dal sito stesso.
    $host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    $site = (string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '');
    if (($origin !== '' && strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $host)
        || ($site !== '' && $site !== 'same-origin')) {
        $respond(403, ['error' => 'forbidden']);
    }

    $body = json_decode((string) file_get_contents('php://input', false, null, 0, 512), true);
    if (!is_array($body)) {
        $respond(400, ['error' => 'bad_request']);
    }
    $pages = max(1, min(30, (int) ($body['pages'] ?? 1)));
    $first = ($body['first'] ?? false) === true;

    $limiter = new RateLimiter(CITES_STORAGE);
    if (!$limiter->allow((string) ($_SERVER['REMOTE_ADDR'] ?? ''), time())) {
        header('Retry-After: 5');
        $respond(429, $store->read() + ['limited' => true]);
    }

    $respond(200, $store->add($first ? 1 : 0, $pages));
} catch (Throwable $error) {
    error_log('Cites counter: ' . $error->getMessage());
    $respond(503, ['error' => 'unavailable']);
}
