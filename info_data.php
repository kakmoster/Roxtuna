<?php
/**
 * info_data.php — Hämtar informationsavsnitt från Google Sheets CSV, returnerar som JSON.
 *
 * Stödjer två format per blad:
 *   1) Nytt format: rubrikrad "Rubrik | Text | Kategori" (en rad per ämne,
 *      stycken i textcellen separeras med radbrytning).
 *   2) Gammalt format: en kolumn där rubrikrader (kort rad utan slutpunkt,
 *      föregagna av tomrad) följs av stycken.
 *
 * Flera blad slås samman automatiskt: lägg till ett nytt entry i $SHEETS nedan
 * med bladets gid (högerklicka på fliken i Sheets → "Hämta länk" → gid=N).
 */

error_reporting(0);
ini_set('display_errors', '0');
date_default_timezone_set('Europe/Stockholm');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');

$SHEET_ID = '1qfUfnWW2jxDpfoYfUnFCB2ffSe3k3nSNV10iLnwyE6c';

// Ett entry per blad som ska visas på info-sidan.
// 'category' används när bladet saknar kategorikolumn (gammalt format).
$SHEETS = [
    ['gid' => '0', 'category' => ''],
];

$sections = [];
foreach ($SHEETS as $sheet) {
    $url = "https://docs.google.com/spreadsheets/d/{$SHEET_ID}/export?format=csv&gid={$sheet['gid']}";
    $csv = fetchSheet($url);
    if ($csv === false) {
        continue;
    }
    $sections = array_merge($sections, parseSections($csv, $sheet['category']));
}

if (empty($sections)) {
    http_response_code(503);
    echo json_encode(['error' => 'Kunde inte hämta information från Google Sheets'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Sortera A–Ö på rubrik (svensk kollationering om tillgänglig)
setlocale(LC_COLLATE, 'sv_SE.UTF-8', 'sv_SE', 'sv_SE.utf8');
usort($sections, function ($a, $b) {
    return strcoll(
        mb_strtolower($a['title'], 'UTF-8'),
        mb_strtolower($b['title'], 'UTF-8')
    );
});

echo json_encode(['ok' => true, 'data' => $sections], JSON_UNESCAPED_UNICODE);

// =========================
// FUNCTIONS
// =========================

function fetchSheet($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ]);
        $data = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($httpCode === 200 && $data !== false && strlen($data) > 0) {
            return $data;
        }
    }
    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create([
            'http' => ['timeout' => 15, 'user_agent' => 'Mozilla/5.0'],
        ]);
        $data = @file_get_contents($url, false, $ctx);
        if ($data !== false && strlen($data) > 0) {
            return $data;
        }
    }
    return false;
}

function parseSections($csvText, $defaultCategory) {
    // Ta bort ev. UTF-8 BOM
    $csvText = preg_replace('/^\xEF\xBB\xBF/', '', $csvText);

    $rows = parseCSVRows($csvText);
    if (empty($rows)) {
        return [];
    }

    // Nytt format? Första raden är rubrikrad ("Rubrik"/"Titel"/"Ämne" i första kolumnen)
    $first = array_map(function ($c) {
        return mb_strtolower(trim($c), 'UTF-8');
    }, $rows[0]);
    if (count($first) >= 2 && in_array($first[0], ['rubrik', 'titel', 'title', 'ämne'], true)) {
        return parseNewFormat(array_slice($rows, 1));
    }

    return parseLegacyFormat($rows, $defaultCategory);
}

function parseNewFormat($rows) {
    $sections = [];
    foreach ($rows as $cells) {
        $title = isset($cells[0]) ? trim($cells[0]) : '';
        $text = isset($cells[1]) ? trim($cells[1]) : '';
        $category = isset($cells[2]) ? trim($cells[2]) : '';

        if ($title === '' && $text === '') {
            continue;
        }
        if ($title === '') {
            continue;
        }

        $sections[] = [
            'title' => $title,
            'text' => $text,
            'category' => $category,
        ];
    }
    return $sections;
}

function parseLegacyFormat($rows, $defaultCategory) {
    // Blockformat (deterministiskt, ingen gissning):
    //   Tom rad = avsnittsavgränsare.
    //   Första raden i ett block = rubrik.
    //   Övriga rader i blocket = stycken (en rad = ett stycke).
    $sections = [];
    $current = null;

    foreach ($rows as $cells) {
        $line = isset($cells[0]) ? trim($cells[0]) : '';

        if ($line === '') {
            // Tom rad avslutar aktuellt avsnitt
            if ($current !== null) {
                $sections[] = $current;
                $current = null;
            }
            continue;
        }

        if ($current === null) {
            // Nytt block → denna rad är rubriken
            $current = ['title' => $line, 'text' => '', 'category' => $defaultCategory];
        } else {
            // Fortsättningsrad → eget stycke
            $current['text'] .= ($current['text'] === '' ? '' : "\n\n") . $line;
        }
    }
    if ($current !== null) {
        $sections[] = $current;
    }

    // Släng avsnitt utan text (t.ex. rubrik direkt följt av tomrad)
    return array_values(array_filter($sections, function ($s) {
        return trim($s['text']) !== '';
    }));
}

function parseCSVRows($csvText) {
    // Fullständig CSV-tolkning: hanterar citattecken, ""-escape och radbrytningar inuti celler
    $rows = [];
    $row = [];
    $cell = '';
    $inQuotes = false;
    $len = strlen($csvText);

    for ($i = 0; $i < $len; $i++) {
        $char = $csvText[$i];
        if ($inQuotes) {
            if ($char === '"') {
                if ($i + 1 < $len && $csvText[$i + 1] === '"') {
                    $cell .= '"';
                    $i++;
                } else {
                    $inQuotes = false;
                }
            } else {
                $cell .= $char;
            }
        } else {
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
            } elseif ($char === "\r") {
                // hoppa över
            } else {
                $cell .= $char;
            }
        }
    }
    $row[] = $cell;
    $rows[] = $row;

    return $rows;
}
