<?php
/**
 * dokument_data.php — Hämtar "Övriga dokument" från Google Sheets CSV och
 * returnerar dem som JSON för dokument_träd.
 *
 * Arkschema (rad 1 = rubrikrad, upptäcks och hoppas över):
 *   Kategori | Namn | Fil-ID | Datum
 *
 * Kategori är en sökväg med snedstreck: "Lekplats/Besiktningar" renderas
 * som Lekplats ▸ Besiktningar ▸ fil. Namn får lämnas tomt — då används det
 * sista segmentet i sökvägen. Datum är valfritt.
 *
 * Fil-ID kan vara ett råt ID eller en hel Drive-länk; båda normaliseras.
 *
 * Cachelager: cache/dokument.dat + cache/dokument.meta.json. Vid fel från
 * Google serveas senast sparade data med cached=true.
 */

declare(strict_types=1);

error_reporting(0);
ini_set('display_errors', '0');
date_default_timezone_set('Europe/Stockholm');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');

// ---------------------------------------------------------------------------
// KONFIGURATION
// ---------------------------------------------------------------------------

/** Google Sheets-ark-ID. Hämta länken: /spreadsheets/d/<ID>/ */
const SHEET_ID = '16PRrOok0fKfO7CBwWCCEwKgwAYjr-cIY7GmLfZA6Lg0';

/** Blad (gid). 0 = första fliken. */
const SHEET_GID = '0';

/** Cache TTL i sekunder. */
const CACHE_TTL = 300;

const CACHE_DIR = __DIR__ . '/cache';
const CACHE_DATA = CACHE_DIR . '/dokument.dat';
const CACHE_META = CACHE_DIR . '/dokument.meta.json';

// ---------------------------------------------------------------------------
// CACHE — läs
// ---------------------------------------------------------------------------

/**
 * Returnerar cache-lagrat innehåll om det är användbart, annars null.
 * Ett negativt TTL (aldrig) används inte; färskkontroll sker av anroparen.
 */
function readCache(): ?string {
    if (!is_file(CACHE_DATA) || !is_readable(CACHE_DATA)) {
        return null;
    }
    $raw = @file_get_contents(CACHE_DATA);
    if ($raw === false || strlen(trim($raw)) === 0) {
        return null;
    }
    return $raw;
}

function readCacheAge(): int {
    $metaPath = CACHE_META;
    if (is_file($metaPath) && is_readable($metaPath)) {
        $meta = @file_get_contents($metaPath);
        if ($meta !== false) {
            $decoded = @json_decode($meta, true);
            if (is_array($decoded) && !empty($decoded['timestamp'])) {
                return max(0, time() - (int)$decoded['timestamp']);
            }
        }
    }
    if (is_file(CACHE_DATA)) {
        return max(0, time() - (int)@filemtime(CACHE_DATA));
    }
    return PHP_INT_MAX;
}

/** Skriver cache + metadata. Tyst ignoreras vid fel — cache är inte kritisk. */
function writeCache(string $payload): void {
    if (!is_dir(CACHE_DIR)) {
        @mkdir(CACHE_DIR, 0775, true);
    }
    @file_put_contents(CACHE_DATA, $payload, LOCK_EX);
    @file_put_contents(CACHE_META, json_encode([
        'feed'       => 'dokument',
        'fetched_at' => date('c'),
        'timestamp'  => time(),
        'bytes'      => strlen($payload),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

// ---------------------------------------------------------------------------
// HÄMTNING
// ---------------------------------------------------------------------------

/**
 * Hämtar CSV-texten. Följer redirect (Google-ark 307:ar till
 * googleusercontent) via curl, annars via stream-wrapper.
 */
function fetchSheet(string $url): ?string {
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,   // obligatoriskt: Google 307-redirectar
            CURLOPT_MAXREDIRS      => 5,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ]);
        $data = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($data !== false && $httpCode === 200 && strlen(trim($data)) > 0) {
            return $data;
        }
    }

    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create([
            'http' => [
                'timeout'       => 15,
                'user_agent'    => 'Mozilla/5.0',
                'follow_location'=> 1,
                'max_redirects' => 5,
            ],
        ]);
        $data = @file_get_contents($url, false, $ctx);
        if ($data !== false && strlen(trim($data)) > 0) {
            return $data;
        }
    }

    return null;
}

/** En Google-inloggningssida är inte CSV — sådan data får aldrig passera. */
function looksLikeHtml(string $text): bool {
    $head = strtolower(substr(ltrim($text), 0, 400));
    return str_contains($head, '<!doctype')
        || str_contains($head, '<html')
        || str_contains($head, '<head');
}

// ---------------------------------------------------------------------------
// CSV-PARSING
// ---------------------------------------------------------------------------

/**
 * Fullständig CSV-tolkning: citattecken, ""-escape och radbrytningar
 * inuti celler. Hanterar CRLF.
 */
function parseCsvRows(string $csv): array {
    $csv = preg_replace('/^\xEF\xBB\xBF/', '', $csv); // BOM
    $rows = [];
    $row = [];
    $cell = '';
    $inQuotes = false;
    $len = strlen($csv);

    for ($i = 0; $i < $len; $i++) {
        $char = $csv[$i];

        if ($inQuotes) {
            if ($char === '"') {
                if ($i + 1 < $len && $csv[$i + 1] === '"') {
                    $cell .= '"';
                    $i++;
                } else {
                    $inQuotes = false;
                }
            } else {
                $cell .= $char;
            }
            continue;
        }

        if ($char === '"') {
            $inQuotes = true;
        } elseif ($char === ',') {
            $row[] = $cell;
            $cell = '';
        } elseif ($char === "\n") {
            $row[] = $cell;
            $rows[] = $row;
            $row = [];
            $cell = '';
        } elseif ($char !== "\r") { // skippa CR
            $cell .= $char;
        }
    }

    // Avsluta sista raden/cellen om filen inte slutar med newline
    if ($cell !== '' || !empty($row)) {
        $row[] = $cell;
        $rows[] = $row;
    }

    return $rows;
}

/** Rubrikrad? Känns igen på etiketter, inte på kolumnposition. */
function isHeaderRow(array $cells): bool {
    $labels = ['kategori', 'category', 'mapp', 'mapprad', 'katalog', 'grupp'];
    $first = mb_strtolower(trim($cells[0] ?? ''), 'UTF-8');
    if (in_array($first, $labels, true)) {
        return true;
    }
    $second = mb_strtolower(trim($cells[1] ?? ''), 'UTF-8');
    return in_array($second, ['namn', 'name', 'fil', 'file', 'dokument'], true)
        && in_array($first, $labels, true);
}

/**
 * Plockar ut fil-ID ur ett råt ID eller en Drive-länk.
 * Accepterar /file/d/ID/, ?id=ID, /d/ID/, och url-dekodade varianter.
 */
function extractFileId(string $raw): ?string {
    $raw = trim($raw);
    if ($raw === '') {
        return null;
    }

    // 1) Hel URL → fånga ID:t ur sökväg eller query
    if (preg_match('~drive\.google\.com/file/d/([A-Za-z0-9_-]+)~', $raw, $m)
        || preg_match('~docs\.google\.com/.*?/d/([A-Za-z0-9_-]+)~', $raw, $m)) {
        return $m[1];
    }
    if (preg_match('~[?&]id=([A-Za-z0-9_-]+)~', $raw, $m)) {
        return $m[1];
    }

    // 2) Rått ID — tillåt även kortare än 25 tecken
    if (preg_match('/^([A-Za-z0-9_-]{10,100})$/', $raw, $m)) {
        return $m[1];
    }

    return null;
}

/** Normaliserar Datum till ISO Y-m-d, eller null. */
function normaliseDate(string $raw): ?string {
    $raw = trim($raw);
    if ($raw === '') {
        return null;
    }
    // Redan ISO
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $raw, $m)) {
        return "{$m[1]}-{$m[2]}-{$m[3]}";
    }
    // 2025-06-10T... eller 2025/06/10
    if (preg_match('/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/', $raw, $m)) {
        return sprintf('%04d-%02d-%02d', $m[1], $m[2], $m[3]);
    }
    // 10/6/2025 eller 10-06-2025 (svensk datumordning)
    if (preg_match('/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/', $raw, $m)) {
        return sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
    }
    return null;
}

/** Filer Drive-ifsramen /preview inte hanterar — de visas som öppna-länk. */
function isPreviewable(string $fileName): bool {
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $previewable = [
        'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'txt', 'csv',
    ];
    return in_array($ext, $previewable, true);
}

function detectExtension(string $fileName): string {
    return strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
}

// ---------------------------------------------------------------------------
// HUVUFLÖDE
// ---------------------------------------------------------------------------

$url = sprintf(
    'https://docs.google.com/spreadsheets/d/%s/export?format=csv&gid=%s',
    SHEET_ID,
    SHEET_GID
);

$cacheAge = readCacheAge();
$cachedPayload = readCache();

// Färsk cache → svara direkt
if ($cachedPayload !== null && $cacheAge < CACHE_TTL) {
    echo $cachedPayload;
    exit;
}

// Försök hämta från Google
$csv = fetchSheet($url);

if ($csv !== null && !looksLikeHtml($csv)) {
    $items = buildItems($csv);
    $payload = json_encode([
        'ok'        => true,
        'cached'    => false,
        'fetchedAt' => date('c'),
        'data'      => $items,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($payload !== false) {
        writeCache($payload);
        echo $payload;
        exit;
    }
    $fresh = true; // nedtagning misslyckades — prova ändå vidare
}

// Upstream misslyckades → fall tillbaka på cache
if ($cachedPayload !== null) {
    $decoded = json_decode($cachedPayload, true);
    if (is_array($decoded)) {
        $decoded['cached'] = true;
        $decoded['stale']  = true;
        echo json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    echo $cachedPayload;
    exit;
}

// Varken upstream eller cache
http_response_code(503);
echo json_encode([
    'ok'    => false,
    'cached'=> false,
    'error' => 'Kunde inte hämta dokumentlistan från Google Sheets och ingen sparad cache finns.',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;

// ---------------------------------------------------------------------------
// BYGG POSTER
// ---------------------------------------------------------------------------

/**
 * Tar CSV och returnerar en lista med:
 *   path[]       sökvägssegment, t.ex. ["Lekplats","Besiktningar"]
 *   name         rått filnamn (utan uttagna mappar)
 *   display      förslitet visningsnamn
 *   fileId       normaliserat Drive-ID
 *   date         ISO-datum eller null
 *   ext          filtyp i gemener
 *   previewable  om Drive-iframen kan visa filen
 *   previewUrl / downloadUrl / driveUrl
 */
function buildItems(string $csv): array {
    $rows = parseCsvRows($csv);
    if (empty($rows)) {
        return [];
    }

    $items = [];

    foreach ($rows as $index => $cells) {
        if ($index === 0 && isHeaderRow($cells)) {
            continue;
        }

        $rawCategory = trim($cells[0] ?? '');
        $rawName     = trim($cells[1] ?? '');
        $rawId       = trim($cells[2] ?? '');
        $rawDate     = trim($cells[3] ?? '');

        $fileId = extractFileId($rawId);
        if ($fileId === null) {
            continue; // rad utan giltigt fil-ID hoppas över
        }

        // Sökväg
        $segments = array_values(array_filter(
            array_map('trim', explode('/', $rawCategory)),
            static fn($s) => $s !== ''
        ));
        if (empty($segments)) {
            $segments = ['Övrigt'];
        }

        // Filnamn: använd Namn-kolumnen, annars sista segmentet
        $fileName = $rawName !== '' ? $rawName : (string)end($segments);

        // Om Namn-cellen råkar rymma en sökväg ("Besiktningar/besiktning.pdf")
        // behålls bara filnamnet. Annars kopieras raden oförändrat.
        if (str_contains($fileName, '/')) {
            $afterLastSlash = substr((string)strrchr($fileName, '/'), 1);
            if ($afterLastSlash !== '') {
                $fileName = $afterLastSlash;
            }
        }

        if ($fileName === '') {
            continue;
        }

        $ext = detectExtension($fileName);

        $items[] = [
            'path'       => $segments,
            'name'       => $fileName,
            'display'    => prettifyName($fileName),
            'fileId'     => $fileId,
            'date'       => normaliseDate($rawDate),
            'ext'        => $ext,
            'previewable'=> isPreviewable($fileName),
            'previewUrl' => "https://drive.google.com/file/d/{$fileId}/preview",
            'downloadUrl'=> "https://drive.google.com/uc?export=download&id={$fileId}",
            'driveUrl'   => "https://drive.google.com/file/d/{$fileId}/view",
        ];
    }

    // Sortering server-side: svensk kollationering på sökväg, sedan namn
    setlocale(LC_COLLATE, 'sv_SE.UTF-8', 'sv_SE', 'sv_SE.utf8');
    usort($items, static function (array $a, array $b): int {
        $pathA = implode('/', $a['path']);
        $pathB = implode('/', $b['path']);
        $cmp = strcoll(mb_strtolower($pathA, 'UTF-8'), mb_strtolower($pathB, 'UTF-8'));
        if ($cmp !== 0) {
            return $cmp;
        }
        return strcoll(
            mb_strtolower($a['display'], 'UTF-8'),
            mb_strtolower($b['display'], 'UTF-8')
        );
    });

    return $items;
}

/**
 * Gör "LekplatsbesiktningRoxtuna2024.pdf" läsbar utan att ändra arket:
 * skiljer på gemener→versaler ("...Roxtuna2024") och versaler→siffror
 * ("...2024.pdf"). Befintliga avgränsare hanteras först.
 *
 * Skydd: en cell som i själva verket är ett Drive-ID (eller saknar någon
 * avgränsad ändelse) lämnas orörd — den ska aldrig splittas till
 * "1 b KJeuyec 5 QB ...".
 */
function prettifyName(string $fileName): string {
    // Rått Drive-ID: lämna som det är
    if (preg_match('/^[A-Za-z0-9_-]{20,100}$/', $fileName)) {
        return $fileName;
    }

    $display = preg_replace('/\.[A-Za-z0-9]{1,5}$/', '', $fileName);
    $display = str_replace(['_', '-'], ' ', (string)$display);
    $display = (string)preg_replace('/\s+/', ' ', $display);

    // gemener|versaler  →  mellanslag   (besiktning|Roxtuna)
    $display = (string)preg_replace('/([a-zåäö])([A-ZÅÄÖ])/u', '$1 $2', $display);
    // bokstäver|siffror  →  mellanslag   (Roxtuna|2024)
    $display = (string)preg_replace('/([A-Za-zÅÄÖåäö])(\d)/u', '$1 $2', $display);
    // siffror|bokstäver  →  mellanslag   (2024|besiktning)
    $display = (string)preg_replace('/(\d)([A-Za-zÅÄÖåäö])/u', '$1 $2', $display);

    return trim($display);
}