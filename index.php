<?php include 'header.php'; ?>

<h2 class="section-title">Välkommen</h2>
<p class="lead">
    Här hittar du protokoll och information från vår samfällighetsförening. Bläddra bland årens protokoll eller kontakta styrelsen om du har frågor.
</p>

<!-- Kalender -->
<section class="calendar-section" aria-labelledby="calendar-heading">
    <div class="section-divider"></div>
    <div class="calendar-header">
        <svg class="calendar-header-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <h3 id="calendar-heading" class="calendar-heading">Kommande händelser</h3>
    </div>
    <p class="calendar-subhead">Närmaste två månaderna</p>
    <div class="calendar-events" id="calendarEvents">
        <!-- Fylls i av app.js -->
    </div>
</section>

<div class="card-grid">
    <a href="protokoll.php" class="card" style="text-decoration: none; color: inherit;">
        <h3>&#128196; Protokoll</h3>
        <p style="color: var(--color-text-muted); margin-top: 8px;">
            Bläddra bland föreningens protokoll från olika år.
        </p>
    </a>

    <a href="kontakt.php" class="card" style="text-decoration: none; color: inherit;">
        <h3>&#9993; Kontakt</h3>
        <p style="color: var(--color-text-muted); margin-top: 8px;">
            Hitta kontaktuppgifter till styrelsen och föreningen.
        </p>
    </a>
</div>

<?php include 'footer.php'; ?>
