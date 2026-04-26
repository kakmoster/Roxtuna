<?php
/**
 * calendar-debug.php — Diagnostic tool for troubleshooting calendar issues.
 * Visit this page in your browser to see what's happening.
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
date_default_timezone_set('Europe/Stockholm');

header('Content-Type: text/plain; charset=utf-8');

$ICS_URL = 'https://calendar.google.com/calendar/ical/7c9bc01ed80fcd43729d8226a340d3674c7116a6f08a9ee6ad4db648b0010967%40group.calendar.google.com/public/basic.ics';

echo "=== CALENDAR DEBUG ===\n\n";
echo "Server time: " . date('Y-m-d H:i:s T') . "\n";
echo "PHP version: " . phpversion() . "\n";
echo "cURL available: " . (function_exists('curl_init') ? 'YES' : 'NO') . "\n";
echo "allow_url_fopen: " . ini_get('allow_url_fopen') . "\n";
echo "\n";

// 1. Try fetching the ICS
echo "--- 1. FETCHING ICS ---\n";
echo "URL: $ICS_URL\n\n";

$icsText = false;

if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $ICS_URL,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ]);
    $icsText = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    echo "cURL HTTP code: $httpCode\n";
    if ($curlError) echo "cURL error: $curlError\n";
    if ($icsText !== false) echo "Response length: " . strlen($icsText) . " chars\n";
} elseif (ini_get('allow_url_fopen')) {
    $icsText = @file_get_contents($ICS_URL);
    echo "Using file_get_contents\n";
    if ($icsText !== false) {
        echo "Response length: " . strlen($icsText) . " chars\n";
    } else {
        echo "file_get_contents returned false\n";
    }
} else {
    echo "ERROR: Neither cURL nor allow_url_fopen is available!\n";
    exit;
}

if ($icsText === false || trim($icsText) === '') {
    echo "\nFAILED: Could not fetch ICS data.\n";
    exit;
}

if (strpos($icsText, 'BEGIN:VCALENDAR') === false) {
    echo "\nFAILED: Response does not contain valid ICS data.\n";
    echo "First 500 chars of response:\n" . substr($icsText, 0, 500) . "\n";
    exit;
}

echo "SUCCESS: Got ICS data\n\n";

// 2. Parse ICS
echo "--- 2. PARSING ICS ---\n";

// Simple ICS parser (inline for debug)
$text = preg_replace('/\r\n?[ \t]/', '', $icsText);
$lines = preg_split('/\r\n|\r|\n/', $text);
$events = [];
$current = null;

foreach ($lines as $rawLine) {
    $line = trim($rawLine);
    if ($line === 'BEGIN:VEVENT') {
        $current = [];
    } elseif ($line === 'END:VEVENT') {
        if ($current && !empty($current['summary'])) {
            $events[] = $current;
        }
        $current = null;
    } elseif ($current !== null && $line !== '') {
        $colonPos = strpos($line, ':');
        if ($colonPos === false) continue;

        $fullKey = substr($line, 0, $colonPos);
        $value = substr($line, $colonPos + 1);

        $semiPos = strpos($fullKey, ';');
        $key = ($semiPos !== false) ? substr($fullKey, 0, $semiPos) : $fullKey;
        $key = strtolower($key);

        $value = str_replace(['\\n', '\\;', '\\,', '\\\\'], ["\n", ';', ',', '\\'], $value);

        switch ($key) {
            case 'summary':
                $current['summary'] = $value;
                break;
            case 'dtstart':
                $current['dtstart'] = $value;
                $lowerFullKey = strtolower($fullKey);
                $current['dtstartIsDate'] = (
                    strpos($lowerFullKey, 'value=date;') !== false ||
                    strpos($lowerFullKey, 'value=date:') !== false ||
                    $lowerFullKey === 'dtstart;value=date' ||
                    (strlen($value) === 8 && ctype_digit($value))
                );
                break;
            case 'dtend':
                $current['dtend'] = $value;
                break;
            case 'description':
                $current['description'] = $value;
                break;
        }
    }
}

echo "Total events found: " . count($events) . "\n\n";

// 3. Show all events
echo "--- 3. ALL EVENTS ---\n";
foreach ($events as $i => $ev) {
    echo "Event " . ($i + 1) . ":\n";
    echo "  Summary: " . ($ev['summary'] ?? 'N/A') . "\n";
    echo "  DTSTART: " . ($ev['dtstart'] ?? 'N/A') . " (isDate=" . ($ev['dtstartIsDate'] ? 'true' : 'false') . ")\n";
    if (!empty($ev['dtend'])) echo "  DTEND: " . $ev['dtend'] . "\n";
    if (!empty($ev['description'])) echo "  Description: " . substr($ev['description'], 0, 100) . "\n";
    echo "\n";
}

// 4. Filter upcoming
echo "--- 4. FILTERING (next 62 days) ---\n";
$tz = new DateTimeZone('Europe/Stockholm');
$now = new DateTime('today midnight', $tz);
$future = new DateTime('+62 days 23:59:59', $tz);

echo "Now: " . $now->format('Y-m-d H:i:s T') . "\n";
echo "Future cutoff: " . $future->format('Y-m-d H:i:s T') . "\n\n";

$upcoming = [];
foreach ($events as $ev) {
    if (empty($ev['dtstart'])) continue;

    $start = parseDebugDate($ev['dtstart'], !empty($ev['dtstartIsDate']));
    if ($start === false) {
        echo "  FAILED to parse date for: {$ev['summary']} (dtstart={$ev['dtstart']})\n";
        continue;
    }

    $inRange = ($start >= $now && $start <= $future);
    echo "  {$ev['summary']}: " . $start->format('Y-m-d H:i:s T') . " -> " . ($inRange ? 'INCLUDED' : 'EXCLUDED') . "\n";

    if ($inRange) {
        $end = null;
        if (!empty($ev['dtend'])) {
            $end = parseDebugDate($ev['dtend'], !empty($ev['dtstartIsDate']));
        }
        $upcoming[] = [
            'summary' => $ev['summary'] ?? 'Okänd händelse',
            'dtstart' => $start->format('c'),
            'dtend' => $end ? $end->format('c') : null,
            'dtstartIsDate' => !empty($ev['dtstartIsDate']),
            'description' => $ev['description'] ?? '',
        ];
    }
}

echo "\nUpcoming events: " . count($upcoming) . "\n\n";

// 5. JSON output that calendar.php would return
echo "--- 5. JSON OUTPUT ---\n";
echo json_encode($upcoming, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

function parseDebugDate($icsDate, $isDateOnly) {
    if (strlen($icsDate) < 8) return false;

    $year = (int) substr($icsDate, 0, 4);
    $month = (int) substr($icsDate, 4, 2);
    $day = (int) substr($icsDate, 6, 2);

    if ($isDateOnly) {
        return new DateTime("{$year}-{$month}-{$day} 00:00:00", new DateTimeZone('Europe/Stockholm'));
    }

    if (strpos($icsDate, 'T') !== false && strlen($icsDate) >= 13) {
        $hour = (int) substr($icsDate, 9, 2);
        $minute = (int) substr($icsDate, 11, 2);
        if (substr($icsDate, -1) === 'Z') {
            $dt = new DateTime("{$year}-{$month}-{$day} {$hour}:{$minute}:00", new DateTimeZone('UTC'));
            $dt->setTimezone(new DateTimeZone('Europe/Stockholm'));
            return $dt;
        }
        return new DateTime("{$year}-{$month}-{$day} {$hour}:{$minute}:00", new DateTimeZone('Europe/Stockholm'));
    }

    return new DateTime("{$year}-{$month}-{$day} 00:00:00", new DateTimeZone('Europe/Stockholm'));
}
