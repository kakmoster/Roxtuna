// =========================
// app.js — Global + Protokoll
// =========================

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initProtokoll();
    initCalendar();
    initPageTransitions();
});

// =========================
// MOBILE NAVIGATION
// =========================

function initMobileNav() {
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        toggle.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when clicking a link
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('open');
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// =========================
// PAGE TRANSITIONS
// =========================

function initPageTransitions() {
    const content = document.querySelector('.page-content');
    if (!content) return;

    content.classList.add('is-visible');
}

// =========================
// PROTOKOLL — GOOGLE DRIVE BROWSER
// =========================

function initProtokoll() {
    const yearsEl = document.getElementById('years');
    const filesEl = document.getElementById('files');
    const viewerContainer = document.getElementById('viewerContainer');
    const viewer = document.getElementById('pdfViewer');
    const backBtn = document.getElementById('backBtn');
    const breadcrumb = document.getElementById('breadcrumb');
    const layout = document.querySelector('.protokoll-layout');

    // Only run on protokoll page
    if (!layout || !yearsEl) return;

    const SHEET_URL = "https://docs.google.com/spreadsheets/d/1uxYntUgTKFDAgy46q96vkSiGQAeYcIWelE8_fqIeHDo/export?format=csv";

    let data = {};
    let activeYear = null;
    let activeFile = null;

    // Start state
    layout.classList.add('step-years');

    // BACK BUTTON — the fix!
    backBtn.addEventListener('click', () => {
        if (activeFile) {
            // PDF -> Files
            activeFile = null;
            layout.className = 'protokoll-layout step-files';
            viewer.src = '';
            showPlaceholder();
            breadcrumb.textContent = activeYear;
            return;
        }
        if (activeYear) {
            // Files -> Years
            activeYear = null;
            layout.className = 'protokoll-layout step-years';
            backBtn.classList.remove('show');
            breadcrumb.textContent = 'År';
        }
    });

    // FETCH DATA
    fetch(SHEET_URL)
        .then(res => res.text())
        .then(csv => {
            parseCSV(csv);
            renderYears();
        })
        .catch(err => {
            console.error('Kunde inte ladda Google Sheet:', err);
            yearsEl.innerHTML = '<div class="error-msg">Kunde inte ladda protokoll. Försök igen senare.</div>';
        });

    function parseCSV(csv) {
        const rows = csv.split('\n').slice(1);
        rows.forEach(row => {
            if (!row.trim()) return;
            const [year, name, id] = row.split(',').map(v => v.trim());
            if (!year || !id) return;
            if (!data[year]) data[year] = [];
            data[year].push({
                name: name,
                url: `https://drive.google.com/file/d/${id}/preview`
            });
        });
    }

    function renderYears() {
        yearsEl.innerHTML = '';
        const years = Object.keys(data).sort().reverse();

        if (years.length === 0) {
            yearsEl.innerHTML = '<div class="error-msg">Inga protokoll hittades.</div>';
            return;
        }

        years.forEach((year, index) => {
            const btn = document.createElement('button');
            btn.className = 'year-item';
            btn.textContent = year;
            btn.style.animationDelay = `${index * 0.05}s`;
            btn.addEventListener('click', () => selectYear(year, btn));
            yearsEl.appendChild(btn);
        });
    }

    function selectYear(year, element) {
        activeYear = year;
        activeFile = null;

        layout.className = 'protokoll-layout step-files';
        backBtn.classList.add('show');
        breadcrumb.textContent = year;

        // Update active state
        yearsEl.querySelectorAll('.year-item').forEach(e => e.classList.remove('active'));
        element.classList.add('active');

        // Render files with stagger animation
        filesEl.innerHTML = '';
        const files = data[year] || [];

        files.forEach((file, index) => {
            const item = document.createElement('button');
            item.className = 'file-item';
            item.textContent = cleanName(file.name);
            item.style.animationDelay = `${index * 0.04}s`;
            item.addEventListener('click', () => selectFile(file, item));
            filesEl.appendChild(item);
        });

        // Reset viewer
        viewer.src = '';
        showPlaceholder();
    }

    function selectFile(file, element) {
        activeFile = file;

        layout.className = 'protokoll-layout step-viewer';
        breadcrumb.textContent = cleanName(file.name);

        filesEl.querySelectorAll('.file-item').forEach(e => e.classList.remove('active'));
        element.classList.add('active');

        hidePlaceholder();
        viewer.style.opacity = '0';

        // Small delay for smooth transition
        requestAnimationFrame(() => {
            setTimeout(() => {
                viewer.src = file.url;
                viewer.style.opacity = '1';
            }, 200);
        });
    }

    function showPlaceholder() {
        const ph = viewerContainer?.querySelector('.placeholder');
        if (ph) ph.style.display = 'block';
    }

    function hidePlaceholder() {
        const ph = viewerContainer?.querySelector('.placeholder');
        if (ph) ph.style.display = 'none';
    }

    function cleanName(name) {
        return (name || '')
            .replace(/\.pdf$/i, '')
            .replace(/[-_]/g, ' ')
            .trim();
    }
}

// =========================
// GOOGLE CALENDAR — EVENTS
// =========================

function initCalendar() {
    const container = document.getElementById('calendarEvents');
    if (!container) return;

    const CALENDAR_ENDPOINT = 'calendar.php';

    // Show loading skeleton
    container.innerHTML = `
        <div class="calendar-skeleton"><div class="skeleton-line" style="width:60%"></div><div class="skeleton-line" style="width:40%"></div></div>
        <div class="calendar-skeleton"><div class="skeleton-line" style="width:55%"></div><div class="skeleton-line" style="width:35%"></div></div>
        <div class="calendar-skeleton"><div class="skeleton-line" style="width:50%"></div><div class="skeleton-line" style="width:45%"></div></div>
    `;

    fetch(CALENDAR_ENDPOINT)
        .then(res => {
            if (!res.ok) {
                return res.text().then(text => {
                    throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
                });
            }
            return res.json();
        })
        .then(events => {
            if (events.error) throw new Error(events.error);
            renderCalendar(events, container);
        })
        .catch(err => {
            console.error('Kalenderfel:', err);
            container.innerHTML = '<p class="calendar-empty">Kunde inte ladda kalendern.</p>';
        });
}

function formatEventDate(start, end, isDateOnly) {
    const optsDate = { year: 'numeric', month: 'long', day: 'numeric' };
    const optsTime = { hour: '2-digit', minute: '2-digit' };

    const dateStr = start.toLocaleDateString('sv-SE', optsDate);

    if (isDateOnly) {
        if (end) {
            // Multi-day event: show date range
            const endStr = end.toLocaleDateString('sv-SE', optsDate);
            if (dateStr !== endStr) return `${dateStr} – ${endStr}`;
        }
        return dateStr;
    }

    const timeStr = start.toLocaleTimeString('sv-SE', optsTime);

    if (end) {
        const endDateStr = end.toLocaleDateString('sv-SE', optsDate);
        const endTimeStr = end.toLocaleTimeString('sv-SE', optsTime);

        if (dateStr === endDateStr) {
            return `${dateStr} | ${timeStr} – ${endTimeStr}`;
        }
        return `${dateStr} ${timeStr} – ${endDateStr} ${endTimeStr}`;
    }

    return `${dateStr} | ${timeStr}`;
}

function renderCalendar(events, container) {
    if (!events || events.length === 0) {
        container.innerHTML = '<p class="calendar-empty">Inga kommande händelser de närmaste två månaderna.</p>';
        return;
    }

    container.innerHTML = '';

    events.forEach((ev, index) => {
        const start = new Date(ev.dtstart);
        const end = ev.dtend ? new Date(ev.dtend) : null;
        const isDateOnly = ev.dtstartIsDate;

        const card = document.createElement('div');
        card.className = 'calendar-event-card';
        card.style.animationDelay = `${index * 0.06}s`;

        const title = document.createElement('h4');
        title.className = 'calendar-event-title';
        title.textContent = ev.summary;

        const meta = document.createElement('div');
        meta.className = 'calendar-event-meta';
        meta.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${formatEventDate(start, end, isDateOnly)}
        `;

        card.appendChild(title);
        card.appendChild(meta);

        if (ev.description && ev.description.trim()) {
            const desc = document.createElement('p');
            desc.className = 'calendar-event-desc';
            desc.textContent = ev.description.trim();
            card.appendChild(desc);
        }

        container.appendChild(card);
    });
}
