<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Samfällighetsförening</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<header class="site-header">
    <div class="container header-inner">
        <a href="index.php" class="logo">
            <span class="logo-icon">&#8962;</span>
            <span class="logo-text">Samfällighet</span>
        </a>

        <button class="menu-toggle" id="menuToggle" aria-label="Öppna meny" aria-expanded="false">
            <span class="hamburger"></span>
        </button>

        <nav class="main-nav" id="mainNav">
            <a href="index.php" class="nav-link<?php echo basename($_SERVER['PHP_SELF']) == 'index.php' ? ' active' : ''; ?>">Start</a>
            <a href="protokoll.php" class="nav-link<?php echo basename($_SERVER['PHP_SELF']) == 'protokoll.php' ? ' active' : ''; ?>">Protokoll</a>
            <a href="kontakt.php" class="nav-link<?php echo basename($_SERVER['PHP_SELF']) == 'kontakt.php' ? ' active' : ''; ?>">Kontakt</a>
        </nav>
    </div>
</header>

<main class="container page-content">
