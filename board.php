<?php
/**
 * board.php — Fetches board member data from Google Sheets CSV, returns as JSON.
 */

error_reporting(0);
ini_set('display_errors', '0');
date_default_timezone_set('Europe/Stockholm');

header('Content-Type: application/json; charset=utf-8');

$sheetId = '1jr45uWvYXaAYixh2Ln2mc5Q58711SEWtNNWbk6k1djc';
$url = "https://docs.google.com/spreadsheets/d/{$sheetId}/export?format=csv";

$csv = fetchSheet($url);
if ($csv === false) {
    http_response_code(503);
    echo json_encode(['error' => 'Kunde inte hämta data från Google Sheets']);
    exit;
}

$members = parseBoardCSV($csv);

echo json_encode($members, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

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

function parseBoardCSV($csvText) {
    $lines = explode("\n", $csvText);
    $members = [];

    // Skip header row, process data rows
    for ($i = 1; $i < count($lines); $i++) {
        $line = trim($lines[$i]);
        if (empty($line)) continue;

        $cells = parseCSVLine($line);
        if (count($cells) < 2) continue;

        $name = trim($cells[0]);
        $post = trim($cells[1]);
        $contact = isset($cells[2]) ? trim($cells[2]) : '';

        // Remove surrounding quotes
        $name = trim($name, '"\'');
        $post = trim($post, '"\'');
        $contact = trim($contact, '"\'');

        if (empty($name) && empty($post)) continue;

        $members[] = [
            'name' => $name,
            'post' => $post,
            'contact' => $contact,
        ];
    }

    return $members;
}

function parseCSVLine($line) {
    $cells = [];
    $cell = '';
    $inQuotes = false;
    for ($i = 0; $i < strlen($line); $i++) {
        $char = $line[$i];
        if ($char === '"') {
            $inQuotes = !$inQuotes;
        } elseif ($char === ',' && !$inQuotes) {
            $cells[] = $cell;
            $cell = '';
        } else {
            $cell .= $char;
        }
    }
    $cells[] = $cell;
    return $cells;
}
