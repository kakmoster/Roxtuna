<?php include 'header.php'; ?>

<h2 class="section-title">Kontakt</h2>
<p class="lead">
    Här hittar du kontaktuppgifter till styrelsen i Roxtuna Samfällighetsförening.
</p>

<div class="contact-email-card">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary); flex-shrink: 0;">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
    <div>
        <div class="contact-email-label">E-post</div>
        <a href="mailto:styrelsen@roxtuna.se" class="contact-email-link">styrelsen@roxtuna.se</a>
    </div>
</div>

<!-- Styrelse -->
<section class="board-section" aria-labelledby="board-heading">
    <div class="section-divider" style="height: 1px; background: linear-gradient(90deg, transparent, var(--color-border), transparent); margin: 48px 0 28px;"></div>
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary); flex-shrink: 0;">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <h3 id="board-heading" style="font-family: Georgia, 'Times New Roman', serif; font-size: 1.3rem; font-weight: 600; color: var(--color-text);">Styrelse</h3>
    </div>
    <div class="board-members" id="boardMembers">
        <!-- Fylls i av app.js -->
    </div>
</section>

<?php include 'footer.php'; ?>