<?php
/**
 * calendar.php — Fetches and parses Google Calendar ICS feed, returns upcoming events as JSON.
 * Cache disabled during testing for immediate updates.
 */

// Prevent any PHP warnings from corrupting JSON output
error_reporting(0);
ini_set('display_errors', '0');

// Ensure consistent timezone handling
date_default_timezone_set('Europe/Stockholm');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// The direct ICS URL provided by the user
$ICS_URL = 'https://calendar.google.com/calendar/ical/7c9bc01ed80fcd43729d8226a340d3674c7116a6f08a9ee6ad4db648b0010967%40group.calendar.google.com/public/basic.ics';

// Fetch ICS
$icsText = fetchICS($ICS_URL);

if ($icsText === false || trim($icsText) === '' || strpos($icsText, 'BEGIN:VCALENDAR') === false) {
    http_response_code(503);
    echo json_encode(['error' => 'Kunde inte hämta kalenderdata från Google']);
    exit;
}

// Parse
$events = parseICS($icsText);
$upcoming = filterUpcomingEvents($events, 62);

$result = json_encode($upcoming, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

echo $result;

// =========================
// FUNCTIONS
// =========================

function fetchICS($url) {
    // Try cURL first
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            CURLOPT_HTTPHEADER => ['Accept: text/calendar,application/octet-stream,*/*'],
        ]);
        $data = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $data !== false && strlen($data) > 0) {
            return $data;
        }
    }

    // Fallback to file_get_contents
    if (ini_get('allow_url_fopen')) {
        $context = stream_context_create([
            'http' => [
                'timeout' => 20,
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'header' => "Accept: text/calendar,application/octet-stream,*/*\r\n",
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);
        $data = @file_get_contents($url, false, $context);
        if ($data !== false && strlen($data) > 0) {
            return $data;
        }
    }

    return false;
}

function parseICS($icsText) {
    // Unfold continuation lines (ICS lines starting with space/tab continue previous line)
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
            // Parse property line: KEY[;param1;param2]:value
            $colonPos = strpos($line, ':');
            if ($colonPos === false) {
                continue;
            }

            $fullKey = substr($line, 0, $colonPos);
            $value = substr($line, $colonPos + 1);

            // Strip parameters from key (e.g. DTSTART;VALUE=DATE → DTSTART)
            $semiPos = strpos($fullKey, ';');
            $key = ($semiPos !== false) ? substr($fullKey, 0, $semiPos) : $fullKey;
            $key = strtolower($key);

            // Unescape ICS values
            $value = str_replace(['\\n', '\\;', '\\,', '\\\\'], ["\n", ';', ',', '\\'], $value);

            switch ($key) {
                case 'summary':
                    $current['summary'] = $value;
                    break;
                case 'dtstart':
                    $current['dtstart'] = $value;
                    $current['dtstart_key'] = $fullKey;
                    // Check if this is a date-only value
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
                    $current['dtend_key'] = $fullKey;
                    break;
                case 'description':
                    $current['description'] = $value;
                    break;
                case 'location':
                    $current['location'] = $value;
                    break;
            }
        }
    }

    return $events;
}

function parseICSDate($icsDate, $isDateOnly, $fullKey = '') {
    // Parse YYYYMMDD or YYYYMMDDTHHMMSS(Z) format
    if (strlen($icsDate) < 8) {
        return false;
    }

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
            // UTC timestamp - add 2 hours for Swedish summer time (CEST)
            $dt = new DateTime("{$year}-{$month}-{$day} {$hour}:{$minute}:00", new DateTimeZone('UTC'));
            $dt->modify('+2 hours');
            return $dt;
        }

        // Check if the original ICS key specified UTC as TZID (without Z suffix)
        $lowerFullKey = strtolower($fullKey);
        if (strpos($lowerFullKey, 'tzid=utc') !== false) {
            $dt = new DateTime("{$year}-{$month}-{$day} {$hour}:{$minute}:00", new DateTimeZone('UTC'));
            $dt->modify('+2 hours');
            return $dt;
        }

        // Local time (assumed to be Stockholm time)
        return new DateTime("{$year}-{$month}-{$day} {$hour}:{$minute}:00", new DateTimeZone('Europe/Stockholm'));
    }

    // Fallback: treat as date-only
    return new DateTime("{$year}-{$month}-{$day} 00:00:00", new DateTimeZone('Europe/Stockholm'));
}

function formatEventDateDisplay(DateTime $start, $end, $isDateOnly) {
    $months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    $month = $months[(int)$start->format('n') - 1];
    $dateStr = $start->format('j') . ' ' . $month . ' ' . $start->format('Y');

    if ($isDateOnly) {
        if ($end) {
            $endMonth = $months[(int)$end->format('n') - 1];
            $endStr = $end->format('j') . ' ' . $endMonth . ' ' . $end->format('Y');
            if ($dateStr !== $endStr) return "$dateStr – $endStr";
        }
        return $dateStr;
    }

    $timeStr = $start->format('H:i');

    if ($end) {
        $endTimeStr = $end->format('H:i');
        return "$dateStr | $timeStr – $endTimeStr";
    }

    return "$dateStr | $timeStr";
}

function filterUpcomingEvents($events, $daysAhead) {
    $tz = new DateTimeZone('Europe/Stockholm');
    $now = new DateTime('today midnight', $tz);
    $future = new DateTime("+{$daysAhead} days 23:59:59", $tz);

    $upcoming = [];

    foreach ($events as $ev) {
        if (empty($ev['dtstart'])) {
            continue;
        }

        $start = parseICSDate($ev['dtstart'], !empty($ev['dtstartIsDate']), $ev['dtstart_key'] ?? '');
        if ($start === false) {
            continue;
        }

        if ($start < $now || $start > $future) {
            continue;
        }

        $end = null;
        if (!empty($ev['dtend'])) {
            $end = parseICSDate($ev['dtend'], !empty($ev['dtstartIsDate']), $ev['dtend_key'] ?? '');
        }

        $upcoming[] = [
            'summary' => $ev['summary'] ?? 'Okänd händelse',
            'dtstart' => $start->format('c'),
            'dtend' => $end ? $end->format('c') : null,
            'dtstartIsDate' => !empty($ev['dtstartIsDate']),
            'description' => $ev['description'] ?? '',
            'dateDisplay' => formatEventDateDisplay($start, $end, !empty($ev['dtstartIsDate'])),
        ];
    }

    // Sort by start date
    usort($upcoming, function ($a, $b) {
        return strcmp($a['dtstart'], $b['dtstart']);
    });

    return $upcoming;
}
