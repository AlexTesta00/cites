<?php

declare(strict_types=1);

/*
 * Contatore anonimo delle citazioni create.
 * Nessun dato personale: si salvano solo due totali. Per frenare gli abusi
 * RateLimiter tiene per al massimo un giorno un'impronta HMAC dell'IP con una
 * chiave casuale che viene rigenerata ogni giorno.
 */

final class CounterStore
{
    public function __construct(private readonly string $dir)
    {
    }

    /** @return array{people:int,images:int} */
    public function read(): array
    {
        return $this->withLock(fn (): array => $this->load());
    }

    /** @return array{people:int,images:int} */
    public function add(int $people, int $images): array
    {
        return $this->withLock(function () use ($people, $images): array {
            $totals = $this->load();
            $totals['people'] += max(0, $people);
            $totals['images'] += max(0, $images);
            $this->save($totals);
            return $totals;
        });
    }

    /** @return array{people:int,images:int} */
    private function load(): array
    {
        $file = $this->dir . '/counter.json';
        $data = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
        return [
            'people' => max(0, (int) ($data['people'] ?? 0)),
            'images' => max(0, (int) ($data['images'] ?? 0)),
        ];
    }

    /** @param array{people:int,images:int} $totals */
    private function save(array $totals): void
    {
        $file = $this->dir . '/counter.json';
        $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
        file_put_contents($tmp, json_encode($totals + ['updated' => gmdate('c')]));
        if (!@rename($tmp, $file)) {
            @unlink($tmp);
            throw new RuntimeException('Impossibile salvare il contatore.');
        }
    }

    /**
     * @template T
     * @param callable():T $work
     * @return T
     */
    private function withLock(callable $work): mixed
    {
        if (!is_dir($this->dir) && !@mkdir($this->dir, 0750, true) && !is_dir($this->dir)) {
            throw new RuntimeException('Cartella dati non disponibile.');
        }
        $lock = fopen($this->dir . '/counter.lock', 'c');
        if ($lock === false) {
            throw new RuntimeException('Impossibile bloccare il contatore.');
        }
        try {
            flock($lock, LOCK_EX);
            return $work();
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}

final class RateLimiter
{
    private const MAX_ENTRIES = 20000;

    public function __construct(
        private readonly string $dir,
        private readonly int $minInterval = 2,
        private readonly int $dailyMax = 300,
    ) {
    }

    public function allow(string $ip, int $now): bool
    {
        $file = $this->dir . '/ratelimit.json';
        $handle = fopen($file, 'c+');
        if ($handle === false) {
            return true;
        }
        try {
            flock($handle, LOCK_EX);
            $raw = stream_get_contents($handle);
            $state = $raw ? json_decode($raw, true) : null;
            $day = gmdate('Y-m-d', $now);
            if (!is_array($state) || ($state['day'] ?? '') !== $day || !isset($state['key'])) {
                $state = ['day' => $day, 'key' => bin2hex(random_bytes(32)), 'hits' => []];
            }
            $id = substr(hash_hmac('sha256', $ip, (string) $state['key']), 0, 24);
            [$count, $last] = $state['hits'][$id] ?? [0, 0];
            $allowed = $count < $this->dailyMax && ($now - (int) $last) >= $this->minInterval;
            if ($allowed) {
                $state['hits'][$id] = [$count + 1, $now];
                if (count($state['hits']) > self::MAX_ENTRIES) {
                    uasort($state['hits'], static fn (array $a, array $b): int => $b[1] <=> $a[1]);
                    $state['hits'] = array_slice($state['hits'], 0, intdiv(self::MAX_ENTRIES, 2), true);
                }
                ftruncate($handle, 0);
                rewind($handle);
                fwrite($handle, (string) json_encode($state));
                fflush($handle);
            }
            return $allowed;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
