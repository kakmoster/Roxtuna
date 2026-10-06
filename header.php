<?php
// Egen cache-header: WebApp-Host (Apache) skickar inte Cache-Control, vilket
// gör att telefoner (Android Chrome) serverar gammal app.js efter en deploy.
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
?>
<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roxtuna Samfällighetsförening</title>
    <link rel="stylesheet" href="style.css?v=1.4">
</head>
<body>

<!-- ========== HEADER ========== -->
<header class="site-header">
    <div class="container header-inner">
        <a href="index.php" class="logo">
            <span class="logo-icon">&#8962;</span>
            <span class="logo-text">Roxtuna Samfällighetsförening</span>
        </a>

        <button class="menu-toggle" id="menuToggle" aria-label="Öppna meny" aria-expanded="false">
            <span class="hamburger"></span>
        </button>

        <nav class="main-nav" id="mainNav">
            <a href="index.php" class="nav-link">Start</a>
            <a href="protokoll.php" class="nav-link">Protokoll</a>
            <a href="dokument.php" class="nav-link">Dokument</a>
            <a href="info.php" class="nav-link">Info</a>
            <a href="kontakt.php" class="nav-link">Kontakt</a>
        </nav>
    </div>
</header>

<!-- Hero Banner -->
<div class="hero-banner" id="heroBanner">
    <div class="hero-image" id="heroImg" style="background-image:url('hero.jpg');background-size:cover;background-position:center;"></div>
    <script>
    (function() {
      var saved;
      try {
        var raw = localStorage.getItem('roxtuna-theme');
        if (raw) saved = JSON.parse(raw);
      } catch(e) {}
      if (!saved) saved = { manualTheme: null, manualDark: null };
      var now = new Date();
      var month = now.getMonth();
      var hour = now.getHours();
      var season;
      if (month >= 11 || month <= 1) season = 'winter';
      else if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else season = 'autumn';
      var mode = (hour >= 20 || hour < 6) ? 'dark' : 'day';
      if (saved.manualTheme) season = saved.manualTheme;
      if (saved.manualDark !== null) mode = saved.manualDark ? 'dark' : 'day';
      document.body.setAttribute('data-theme', season);
      document.body.setAttribute('data-mode', mode);
      var heroMap = {
        winter: { day: 'hero-winter.jpg', dark: 'hero-winter-night.jpg' },
        spring: { day: 'hero-spring.jpg', dark: 'hero-spring-night.jpg' },
        summer: { day: 'hero-summer.jpg', dark: 'hero-summer-night.jpg' },
        autumn: { day: 'hero-autumn.jpg', dark: 'hero-autumn-night.jpg' }
      };
      var map = heroMap[season];
      var src = map ? map[mode] : 'hero.jpg';
      var div = document.getElementById('heroImg');
      if (div) div.style.backgroundImage = "url('" + src + "')";
      document.getElementById('heroBanner').setAttribute('data-current-hero', src);
    })();
    </script>
    <div class="hero-overlay"></div>
    <div class="hero-content">
        <div class="container">
            <h1 class="hero-title">Roxtuna<br>Samfällighetsförening</h1>
            <p class="hero-subtitle">Vårt hem vid Roxen</p>
        </div>
    </div>
</div>

<main class="container page-content is-visible">
