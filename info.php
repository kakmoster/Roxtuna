<?php include 'header.php'; ?>

<div class="info-page">
    <div class="info-header">
        <h2 class="section-title">Information</h2>
        <p class="info-lead">
            Här samlar vi praktisk information om samfälligheten — avgifter, gemensamma
            anläggningar, träffar och mycket annat. Klicka på en rubrik för att läsa mer.
        </p>
        <div class="info-search-wrap">
            <svg class="info-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="search" id="infoSearch" class="info-search"
                   placeholder="Sök i informationen…" autocomplete="off"
                   aria-label="Sök i informationen">
        </div>
    </div>

    <div id="infoAccordion" class="info-accordion" aria-live="polite">
        <!-- Fylls i av app.js -->
    </div>
</div>

<?php include 'footer.php'; ?>
