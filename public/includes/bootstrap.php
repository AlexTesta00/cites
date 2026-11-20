<?php

declare(strict_types=1);

/*
 * Avvio comune a tutte le pagine: costanti, lingua, traduzioni e piccoli aiuti per l'HTML.
 * Le pagine includono questo file e non producono output prima di render_head().
 */

const CITES_SITE_URL = 'https://cites.alextesta.space';
const CITES_REPO_URL = 'https://github.com/AlexTesta00/cites';
const CITES_AUTHOR_URL = 'https://alextesta.space';
const CITES_TEMPLATE_COUNT = 38;
const CITES_LANGS = ['it', 'en'];

define('CITES_PUBLIC', dirname(__DIR__));
define('CITES_STORAGE', CITES_PUBLIC . '/storage');

/** Versione pubblicata (scritta dal deploy in includes/version.php), "dev" in locale. */
function cites_version(): string
{
    static $version = null;
    if ($version === null) {
        $file = __DIR__ . '/version.php';
        $version = is_file($file) ? (string) (require $file) : 'dev';
    }
    return $version;
}

/** Lingua della pagina: arriva dalle regole di riscrittura (?lang=en per /en/...). */
function cites_lang(): string
{
    static $lang = null;
    if ($lang === null) {
        $requested = $_GET['lang'] ?? 'it';
        $lang = in_array($requested, CITES_LANGS, true) ? $requested : 'it';
    }
    return $lang;
}

/** Traduce una chiave sostituendo i segnaposto {nome}. */
function t(string $key, array $vars = []): string
{
    static $dictionaries = [];
    $lang = cites_lang();
    if (!isset($dictionaries[$lang])) {
        $dictionaries[$lang] = require __DIR__ . '/i18n/' . $lang . '.php';
    }
    $text = $dictionaries[$lang][$key] ?? $key;
    $vars += ['n' => CITES_TEMPLATE_COUNT];
    foreach ($vars as $name => $value) {
        $text = str_replace('{' . $name . '}', (string) $value, $text);
    }
    return $text;
}

/** Escape per HTML. */
function e(string $text): string
{
    return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}

/** Traduce ed esegue l'escape in un colpo solo. */
function te(string $key, array $vars = []): string
{
    return e(t($key, $vars));
}

/** Percorsi delle pagine nelle due lingue. */
function page_path(string $page, ?string $lang = null): string
{
    $lang ??= cites_lang();
    $paths = [
        'it' => ['home' => '/', 'create' => '/crea', 'privacy' => '/privacy'],
        'en' => ['home' => '/en/', 'create' => '/en/create', 'privacy' => '/en/privacy'],
    ];
    return $paths[$lang][$page] ?? $paths[$lang]['home'];
}

/** URL assoluto di una pagina (per canonical, hreflang e Open Graph). */
function page_url(string $page, ?string $lang = null): string
{
    return CITES_SITE_URL . page_path($page, $lang);
}

/** URL di un file in /assets con un parametro di versione per la cache. */
function asset(string $path): string
{
    $file = CITES_PUBLIC . '/assets/' . ltrim($path, '/');
    $stamp = is_file($file) ? substr(md5((string) filemtime($file) . cites_version()), 0, 10) : cites_version();
    return '/assets/' . ltrim($path, '/') . '?v=' . $stamp;
}

/** Icone a tratto usate in tutto il sito (sempre decorative: aria-hidden). */
function icon(string $name, int $size = 20, float $stroke = 1.6): string
{
    $paths = [
        'arrow-up-right' => '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
        'arrow-right' => '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
        'arrow-left' => '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
        'play' => '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
        'download' => '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
        'share' => '<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
        'link' => '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
        'pen' => '<path d="M4 20h16"/><path d="m14 4 6 6-9 9H5v-6z"/>',
        'highlighter' => '<path d="m9 15-5 5h6l2-2"/><path d="m15 3 6 6-9 9-6-6z"/>',
        'underline' => '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 21h16"/>',
        'circle' => '<ellipse cx="12" cy="12" rx="9" ry="7"/><path d="M8 12h8"/>',
        'eraser' => '<path d="m7 21-4-4 10-10 7 7-6 7z"/><path d="M22 21H7"/><path d="m5 11 8 8"/>',
        'formats' => '<rect x="3" y="3" width="8" height="14" rx="1"/><rect x="13" y="7" width="8" height="10" rx="1"/>',
        'layers' => '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
        'feather' => '<path d="m12 19 7-7 3 3-7 7z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="m2 2 7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
        'carousel' => '<rect x="6" y="4" width="12" height="16" rx="1"/><path d="M3 6v12"/><path d="M21 6v12"/>',
        'book' => '<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 4v8l2-1.5 2 1.5V4"/>',
        'signature' => '<path d="M3 17c3-1 4-9 7-9s-1 9 2 9 3-5 5-5 1 4 4 3"/><path d="M3 21h18"/>',
        'sparkle' => '<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m6 6 2.5 2.5"/><path d="m15.5 15.5 2.5 2.5"/><path d="m6 18 2.5-2.5"/><path d="M15.5 8.5 18 6"/>',
        'plus' => '<path d="M12 5v14"/><path d="M5 12h14"/>',
        'trash' => '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
        'undo' => '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
        'redo' => '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
        'refresh' => '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
        'menu' => '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
        'close' => '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
        'check' => '<path d="m5 12 5 5 9-10"/>',
        'eye' => '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
        'phone' => '<rect x="6.5" y="2" width="11" height="20" rx="2.6"/><path d="M10.5 18.5h3"/>',
        'github' => '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    ];
    $inner = $paths[$name] ?? '';
    return '<svg aria-hidden="true" focusable="false" width="' . $size . '" height="' . $size
        . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' . $stroke
        . '" stroke-linecap="round" stroke-linejoin="round">' . $inner . '</svg>';
}

/** Legge la citazione condivisa in ?c= (stesso formato di assets/js/editor/share.js). */
function shared_quote(): ?array
{
    $raw = $_GET['c'] ?? '';
    if (!is_string($raw) || $raw === '' || strlen($raw) > 8000) {
        return null;
    }
    $kind = $raw[0];
    $payload = base64_decode(strtr(substr($raw, 1), '-_', '+/'), true);
    if ($payload === false) {
        return null;
    }
    if ($kind === 'z') {
        $payload = @gzinflate($payload, 200000);
        if ($payload === false) {
            return null;
        }
    } elseif ($kind !== 'j') {
        return null;
    }
    $data = json_decode($payload, true);
    if (!is_array($data) || !isset($data['p']) || !is_array($data['p']) || !isset($data['p'][0]['t'])) {
        return null;
    }
    $page = $data['p'][0];
    return [
        'text' => mb_substr(trim((string) $page['t']), 0, 280),
        'author' => mb_substr(trim((string) ($page['a'] ?? '')), 0, 80),
    ];
}
