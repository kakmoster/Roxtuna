<?php include 'header.php'; ?>

<!-- Two-column layout with grid areas -->
<div class="two-col-layout">

    <!-- WELCOME (grid-area: welcome) -->
    <div class="main-col-welcome">
        <h2 class="section-title">Välkommen till Roxtuna Samfällighetsförening!</h2>
        <p class="lead">
            Här hittar du information om vad som händer i samfälligheten. Du kan läsa protokoll från årsmöten och styrelsemöten samt hitta kontaktuppgifter för sittande styrelse.
        </p>
    </div>

    <!-- CALENDAR SIDEBAR (grid-area: sidebar) -->
    <aside class="sidebar" aria-labelledby="calendar-heading">
        <div class="sidebar-header">
            <svg class="sidebar-header-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3 id="calendar-heading" class="sidebar-title">Kalender</h3>
        </div>
        <p class="sidebar-subtitle">Kommande händelser</p>
        <div id="calendarEvents">
            <!-- Fylls i av app.js -->
        </div>
        <a href="https://calendar.google.com/calendar/embed?src=7c9bc01ed80fcd43729d8226a340d3674c7116a6f08a9ee6ad4db648b0010967%40group.calendar.google.com" target="_blank" rel="noopener" class="calendar-more">
            Se hela kalendern
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
    </aside>

    <!-- CARDS (grid-area: cards) -->
    <div class="main-col-cards">
        <h3 style="font-family: Georgia, 'Times New Roman', serif; font-size: 1.3rem; font-weight: 600; margin-bottom: 16px; color: var(--color-text);">Utforska mer</h3>
        <div class="card-grid">
            <a href="protokoll.php" class="card">
                <div class="card-icon">&#128196;</div>
                <h3>Protokoll</h3>
                <p>Bläddra bland föreningens protokoll och dokument från olika år.</p>
                <span class="card-arrow">
                    Läs mer
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
            </a>

            <a href="dokument.php" class="card">
                <div class="card-icon">&#128193;</div>
                <h3>Dokument</h3>
                <p>Stadgar, besiktningar, arbetsplan och andra handlingar.</p>
                <span class="card-arrow">
                    Läs mer
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
            </a>

            <a href="info.php" class="card">
                <div class="card-icon">&#8505;&#65039;</div>
                <h3>Information</h3>
                <p>Avgifter, gemensamma anläggningar, träffar och annat praktiskt.</p>
                <span class="card-arrow">
                    Läs mer
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
            </a>

            <a href="kontakt.php" class="card">
                <div class="card-icon">&#9993;</div>
                <h3>Kontakt</h3>
                <p>Hitta kontaktuppgifter till styrelsen och föreningen.</p>
                <span class="card-arrow">
                    Läs mer
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
            </a>
        </div>
    </div>

</div>

<?php include 'footer.php'; ?>
