// =========================
// app.js — Global + Protokoll + Calendar + Board + Theme Engine
// =========================

const THEME_STORAGE_KEY = 'roxtuna-theme';

const SEASON_HEROES = {
  winter: { day: 'hero-winter.jpg', dark: 'hero-winter-night.jpg' },
  spring: { day: 'hero-spring.jpg', dark: 'hero-spring-night.jpg' },
  summer: { day: 'hero-summer.jpg', dark: 'hero-summer-night.jpg' },
  autumn: { day: 'hero-autumn.jpg', dark: 'hero-autumn-night.jpg' }
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initNavActiveState();
  initProtokoll();
  initCalendar();
  initBoard();
  initPageTransitions();
});

// =========================
// THEME ENGINE
// =========================

function initTheme() {
  const saved = loadThemeSettings();
  const auto = detectAutoTheme();

  const theme = saved.manualTheme || auto.season;
  const mode = saved.manualDark !== null
    ? (saved.manualDark ? 'dark' : 'day')
    : auto.mode;

  applyTheme(theme, mode);

  // Hero background is already set by the inline pre-render script in HTML.
  // Just track the current hero for loadHeroImage() to reference later.
  const banner = document.getElementById('heroBanner');
  if (banner) {
    const heroMap = SEASON_HEROES[theme];
    const targetSrc = heroMap ? heroMap[mode] : 'hero.jpg';
    banner.setAttribute('data-current-hero', targetSrc);
  }

  buildThemeControls();

  // Re-check auto theme every hour
  setInterval(() => {
    const settings = loadThemeSettings();
    if (!settings.manualTheme && settings.manualDark === null) {
      const autoNow = detectAutoTheme();
      applyTheme(autoNow.season, autoNow.mode);
      loadHeroImage(autoNow.season, autoNow.mode);
    }
  }, 3600000);
}

function detectAutoTheme() {
  const now = new Date();
  const month = now.getMonth();
  const hour = now.getHours();

  let season;
  if (month >= 11 || month <= 1) season = 'winter';
  else if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else season = 'autumn';

  const mode = (hour >= 20 || hour < 6) ? 'dark' : 'day';
  return { season, mode };
}

function applyTheme(theme, mode) {
  document.body.setAttribute('data-theme', theme);
  document.body.setAttribute('data-mode', mode);
}

function loadThemeSettings() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { manualTheme: null, manualDark: null };
}

function saveThemeSettings(settings) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {}
}

function loadHeroImage(theme, mode) {
  const banner = document.getElementById('heroBanner');
  if (!banner) return;

  const heroMap = SEASON_HEROES[theme];
  if (!heroMap) return;

  const src = heroMap[mode];
  const currentHero = banner.getAttribute('data-current-hero');

  // If already showing the right image, do nothing
  if (currentHero === src) return;

  const heroDiv = document.getElementById('heroImg');
  if (!heroDiv) return;

  // Preload the new image, then swap background with fade
  const preload = new Image();
  preload.onload = () => {
    banner.setAttribute('data-current-hero', src);
    heroDiv.style.transition = 'opacity 0.5s ease';
    heroDiv.style.opacity = '0';
    setTimeout(() => {
      heroDiv.style.backgroundImage = "url('" + src + "')";
      heroDiv.style.opacity = '1';
    }, 500);
  };
  preload.onerror = () => {
    banner.setAttribute('data-current-hero', 'hero.jpg');
    heroDiv.style.transition = 'opacity 0.5s ease';
    heroDiv.style.opacity = '0';
    setTimeout(() => {
      heroDiv.style.backgroundImage = "url('hero.jpg')";
      heroDiv.style.opacity = '1';
    }, 500);
  };
  preload.src = src;
}

function buildThemeControls() {
  const settings = loadThemeSettings();
  const currentTheme = document.body.getAttribute('data-theme') || 'summer';
  const currentMode = document.body.getAttribute('data-mode') || 'day';
  const isAuto = !settings.manualTheme && settings.manualDark === null;

  // === 1. DESKTOP: hover dropdown in header ===
  const headerInner = document.querySelector('.header-inner');
  if (headerInner) {
    const dropdown = document.createElement('div');
    dropdown.className = 'theme-dropdown';
    dropdown.id = 'themeDropdown';

    dropdown.innerHTML = `
      <button class="theme-dropdown-toggle" id="themeToggle" aria-haspopup="true" aria-expanded="false">
        <span class="theme-dropdown-label">Tema</span>
        <svg class="theme-dropdown-chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="theme-dropdown-menu" role="menu">
        <div class="theme-dropdown-group">
          <span class="theme-dropdown-group-label">Årstid</span>
          <div class="theme-dropdown-buttons">
            <button class="theme-dropdown-btn ${currentTheme === 'winter' ? 'active' : ''}" data-season="winter" data-scope="desktop" role="menuitem" title="Vinter">
              <span class="theme-dropdown-emoji">&#10052;</span>
              <span class="theme-dropdown-text">Vinter</span>
            </button>
            <button class="theme-dropdown-btn ${currentTheme === 'spring' ? 'active' : ''}" data-season="spring" data-scope="desktop" role="menuitem" title="Vår">
              <span class="theme-dropdown-emoji">&#127799;</span>
              <span class="theme-dropdown-text">Vår</span>
            </button>
            <button class="theme-dropdown-btn ${currentTheme === 'summer' ? 'active' : ''}" data-season="summer" data-scope="desktop" role="menuitem" title="Sommar">
              <span class="theme-dropdown-emoji">&#9728;</span>
              <span class="theme-dropdown-text">Sommar</span>
            </button>
            <button class="theme-dropdown-btn ${currentTheme === 'autumn' ? 'active' : ''}" data-season="autumn" data-scope="desktop" role="menuitem" title="Höst">
              <span class="theme-dropdown-emoji">&#127810;</span>
              <span class="theme-dropdown-text">Höst</span>
            </button>
          </div>
        </div>
        <div class="theme-dropdown-divider"></div>
        <div class="theme-dropdown-group">
          <span class="theme-dropdown-group-label">Läge</span>
          <button class="theme-dropdown-btn theme-dropdown-btn--full ${currentMode === 'dark' ? 'active' : ''}" data-mode="toggle" data-scope="desktop" role="menuitem">
            <span class="theme-dropdown-emoji">${currentMode === 'dark' ? '&#9790;' : '&#9788;'}</span>
            <span class="theme-dropdown-text">${currentMode === 'dark' ? 'Mörkt läge' : 'Ljust läge'}</span>
          </button>
        </div>
        <div class="theme-dropdown-divider" id="themeResetDivider" style="${isAuto ? 'display:none;' : ''}"></div>
        <div class="theme-dropdown-group" id="themeResetGroup" style="${isAuto ? 'display:none;' : ''}">
          <button class="theme-dropdown-btn theme-dropdown-btn--reset" data-reset="true" data-scope="desktop" role="menuitem">
            <span class="theme-dropdown-emoji">&#8634;</span>
            <span class="theme-dropdown-text">Återställ automatiskt</span>
          </button>
        </div>
      </div>
    `;

    headerInner.appendChild(dropdown);

    const toggleBtn = dropdown.querySelector('#themeToggle');
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
    dropdown.addEventListener('click', (e) => e.stopPropagation());
  }

  // === 2. MOBILE: inline controls inside hamburger nav ===
  const nav = document.getElementById('mainNav');
  if (nav) {
    const mobileControls = document.createElement('div');
    mobileControls.className = 'theme-mobile-controls';
    mobileControls.id = 'themeMobileControls';

    mobileControls.innerHTML = `
      <div class="theme-mobile-divider"></div>
      <span class="theme-mobile-label">Tema</span>
      <div class="theme-mobile-row">
        <button class="theme-mobile-btn ${currentTheme === 'winter' ? 'active' : ''}" data-season="winter" data-scope="mobile" title="Vinter">
          <span class="theme-mobile-emoji">&#10052;</span>
          <span class="theme-mobile-text">Vinter</span>
        </button>
        <button class="theme-mobile-btn ${currentTheme === 'spring' ? 'active' : ''}" data-season="spring" data-scope="mobile" title="Vår">
          <span class="theme-mobile-emoji">&#127799;</span>
          <span class="theme-mobile-text">Vår</span>
        </button>
        <button class="theme-mobile-btn ${currentTheme === 'summer' ? 'active' : ''}" data-season="summer" data-scope="mobile" title="Sommar">
          <span class="theme-mobile-emoji">&#9728;</span>
          <span class="theme-mobile-text">Sommar</span>
        </button>
        <button class="theme-mobile-btn ${currentTheme === 'autumn' ? 'active' : ''}" data-season="autumn" data-scope="mobile" title="Höst">
          <span class="theme-mobile-emoji">&#127810;</span>
          <span class="theme-mobile-text">Höst</span>
        </button>
      </div>
      <div class="theme-mobile-row" style="margin-top:8px;">
        <button class="theme-mobile-btn theme-mobile-btn--wide ${currentMode === 'dark' ? 'active' : ''}" data-mode="toggle" data-scope="mobile">
          <span class="theme-mobile-emoji">${currentMode === 'dark' ? '&#9790;' : '&#9788;'}</span>
          <span class="theme-mobile-text">${currentMode === 'dark' ? 'Mörkt läge' : 'Ljust läge'}</span>
        </button>
        <button class="theme-mobile-btn theme-mobile-btn--reset" id="themeMobileReset" data-reset="true" data-scope="mobile" style="${isAuto ? 'display:none;' : ''}">
          <span class="theme-mobile-emoji">&#8634;</span>
          <span class="theme-mobile-text">Auto</span>
        </button>
      </div>
    `;

    nav.appendChild(mobileControls);
  }

  wireThemeButtons();
}

function wireThemeButtons() {
  document.querySelectorAll('[data-season]').forEach(btn => {
    btn.addEventListener('click', () => {
      const season = btn.dataset.season;
      const settings = loadThemeSettings();
      settings.manualTheme = season;
      saveThemeSettings(settings);

      const mode = document.body.getAttribute('data-mode') || 'day';
      applyTheme(season, mode);
      loadHeroImage(season, mode);
      updateThemeUI();
    });
  });

  document.querySelectorAll('[data-mode="toggle"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const settings = loadThemeSettings();
      const current = document.body.getAttribute('data-mode') || 'day';
      const newMode = current === 'day' ? 'dark' : 'day';
      settings.manualDark = newMode === 'dark';
      saveThemeSettings(settings);

      const theme = document.body.getAttribute('data-theme') || 'summer';
      applyTheme(theme, newMode);
      loadHeroImage(theme, newMode);
      updateThemeUI();
    });
  });

  document.querySelectorAll('[data-reset]').forEach(btn => {
    btn.addEventListener('click', () => {
      saveThemeSettings({ manualTheme: null, manualDark: null });
      const auto = detectAutoTheme();
      applyTheme(auto.season, auto.mode);
      loadHeroImage(auto.season, auto.mode);
      updateThemeUI();
    });
  });
}

function updateThemeUI() {
  const settings = loadThemeSettings();
  const currentTheme = document.body.getAttribute('data-theme');
  const currentMode = document.body.getAttribute('data-mode');
  const isAuto = !settings.manualTheme && settings.manualDark === null;

  // Desktop dropdown
  const dropdown = document.getElementById('themeDropdown');
  if (dropdown) {
    dropdown.querySelectorAll('[data-season]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.season === currentTheme);
    });

    const modeBtn = dropdown.querySelector('[data-mode="toggle"]');
    if (modeBtn) {
      const modeEmoji = modeBtn.querySelector('.theme-dropdown-emoji');
      const modeText = modeBtn.querySelector('.theme-dropdown-text');
      modeBtn.classList.toggle('active', currentMode === 'dark');
      if (modeEmoji) modeEmoji.innerHTML = currentMode === 'dark' ? '&#9790;' : '&#9788;';
      if (modeText) modeText.textContent = currentMode === 'dark' ? 'Mörkt läge' : 'Ljust läge';
    }

    const resetDivider = dropdown.querySelector('#themeResetDivider');
    const resetGroup = dropdown.querySelector('#themeResetGroup');
    if (resetDivider) resetDivider.style.display = isAuto ? 'none' : 'block';
    if (resetGroup) resetGroup.style.display = isAuto ? 'none' : 'block';
  }

  // Mobile controls
  const mobileControls = document.getElementById('themeMobileControls');
  if (mobileControls) {
    mobileControls.querySelectorAll('[data-season]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.season === currentTheme);
    });

    mobileControls.querySelectorAll('[data-mode="toggle"]').forEach(btn => {
      const modeEmoji = btn.querySelector('.theme-mobile-emoji');
      const modeText = btn.querySelector('.theme-mobile-text');
      btn.classList.toggle('active', currentMode === 'dark');
      if (modeEmoji) modeEmoji.innerHTML = currentMode === 'dark' ? '&#9790;' : '&#9788;';
      if (modeText) modeText.textContent = currentMode === 'dark' ? 'Mörkt läge' : 'Ljust läge';
    });

    const resetBtn = mobileControls.querySelector('#themeMobileReset');
    if (resetBtn) resetBtn.style.display = isAuto ? 'none' : 'inline-flex';
  }
}

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

  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// =========================
// NAV ACTIVE STATE
// =========================

function initNavActiveState() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
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
// PROTOKOLL — FOLDER TREE + VIEWER
// =========================

function initProtokoll() {
  const treeList = document.getElementById('treeList');
  const viewerTitle = document.getElementById('viewerTitle');
  const viewerDetails = document.getElementById('viewerDetails');
  const downloadBtn = document.getElementById('downloadBtn');
  const viewerPlaceholder = document.getElementById('viewerPlaceholder');
  const pdfViewer = document.getElementById('pdfViewer');

  if (!treeList) return;

  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1uxYntUgTKFDAgy46q96vkSiGQAeYcIWelE8_fqIeHDo/export?format=csv";

  let data = {};

  fetch(SHEET_URL)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(csv => {
      const parsed = parseCSV(csv);
      if (parsed.length === 0) {
        treeList.innerHTML = '<li class="error-msg">Inga protokoll hittades.</li>';
        return;
      }
      data = groupByYear(parsed);
      renderTree();
    })
    .catch(err => {
      console.error('Kunde inte ladda Google Sheet:', err);
      treeList.innerHTML = '<li class="error-msg">Kunde inte ladda protokoll.</li>';
    });

  function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cells = parseCSVLine(line);
      if (cells.length < 3) continue;
      const year = cells[0].trim();
      const name = cells[1].trim();
      let id = cells[2].trim().replace(/^["']|["']$/g, '');
      if (!year || !id) continue;
      if (!/^[a-zA-Z0-9_-]{25,50}$/.test(id)) continue;
      result.push({ year, name, id });
    }
    return result;
  }

  function parseCSVLine(line) {
    const cells = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += char;
      }
    }
    cells.push(cell.trim());
    return cells;
  }

  function groupByYear(rows) {
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.year]) grouped[row.year] = [];
      grouped[row.year].push({
        name: row.name,
        previewUrl: `https://drive.google.com/file/d/${row.id}/preview`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${row.id}`
      });
    }
    return grouped;
  }

  function renderTree() {
    treeList.innerHTML = '';
    const years = Object.keys(data).sort().reverse();

    years.forEach((year, yIndex) => {
      const folderLi = document.createElement('li');
      folderLi.className = 'tree-folder';

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'tree-folder-toggle';
      toggleBtn.innerHTML = `
        <svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <svg class="folder-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${year}</span>
      `;

      const childrenUl = document.createElement('ul');
      childrenUl.className = 'tree-folder-children';

      const files = data[year] || [];
      files.forEach(file => {
        const fileBtn = document.createElement('button');
        fileBtn.className = 'tree-file';
        fileBtn.innerHTML = `
          <svg class="file-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>${cleanName(file.name)}</span>
        `;
        fileBtn.addEventListener('click', () => selectFile(file, fileBtn));
        const fileLi = document.createElement('li');
        fileLi.appendChild(fileBtn);
        childrenUl.appendChild(fileLi);
      });

      toggleBtn.addEventListener('click', () => {
        const isOpen = childrenUl.classList.toggle('open');
        toggleBtn.classList.toggle('open', isOpen);
      });

      if (yIndex === 0) {
        childrenUl.classList.add('open');
        toggleBtn.classList.add('open');
      }

      folderLi.appendChild(toggleBtn);
      folderLi.appendChild(childrenUl);
      treeList.appendChild(folderLi);
    });
  }

  function selectFile(file, element) {
    document.querySelectorAll('.tree-file').forEach(e => e.classList.remove('active'));
    element.classList.add('active');

    viewerTitle.textContent = cleanName(file.name);
    viewerDetails.innerHTML = `
      <span>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        ${new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' })}
      </span>
      <span class="viewer-meta-sep">|</span>
      <span>PDF</span>
    `;

    downloadBtn.href = file.downloadUrl;
    downloadBtn.style.display = 'inline-flex';

    viewerPlaceholder.style.display = 'none';
    pdfViewer.style.opacity = '0';
    pdfViewer.src = file.previewUrl;

    requestAnimationFrame(() => {
      setTimeout(() => {
        pdfViewer.style.opacity = '1';
      }, 200);
    });
  }

  function cleanName(name) {
    return (name || '')
      .replace(/\.pdf$/i, '')
      .replace(/[-_]/g, ' ')
      .trim();
  }
}

// =========================
// GOOGLE CALENDAR
// =========================

function initCalendar() {
  const container = document.getElementById('calendarEvents');
  if (!container) return;

  const CALENDAR_ENDPOINT = 'calendar.php';

  container.innerHTML = `
    <div class="calendar-skeleton">
      <div class="calendar-skeleton-icon"></div>
      <div class="calendar-skeleton-text">
        <div class="skeleton-line" style="width:70%"></div>
        <div class="skeleton-line" style="width:50%"></div>
        <div class="skeleton-line" style="width:90%"></div>
      </div>
    </div>
    <div class="calendar-skeleton">
      <div class="calendar-skeleton-icon"></div>
      <div class="calendar-skeleton-text">
        <div class="skeleton-line" style="width:60%"></div>
        <div class="skeleton-line" style="width:45%"></div>
        <div class="skeleton-line" style="width:80%"></div>
      </div>
    </div>
    <div class="calendar-skeleton">
      <div class="calendar-skeleton-icon"></div>
      <div class="calendar-skeleton-text">
        <div class="skeleton-line" style="width:75%"></div>
        <div class="skeleton-line" style="width:55%"></div>
        <div class="skeleton-line" style="width:85%"></div>
      </div>
    </div>
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

function renderCalendar(events, container) {
  if (!events || events.length === 0) {
    container.innerHTML = '<p class="calendar-empty">Inga kommande händelser.</p>';
    return;
  }

  container.innerHTML = '';

  const iconClasses = ['green', 'amber', 'blue'];
  const iconEmojis = ['&#127795;', '&#9749;', '&#127925;'];
  const displayEvents = events.slice(0, 3);

  displayEvents.forEach((ev, index) => {
    const iconClass = iconClasses[index % iconClasses.length];
    const iconEmoji = iconEmojis[index % iconEmojis.length];

    const eventDiv = document.createElement('div');
    eventDiv.className = 'calendar-event';
    eventDiv.style.animationDelay = `${index * 0.08}s`;

    eventDiv.innerHTML = `
      <div class="calendar-event-icon ${iconClass}">${iconEmoji}</div>
      <div style="flex: 1; min-width: 0;">
        <div class="calendar-event-title">${ev.summary}</div>
        <div class="calendar-event-meta">
          <span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${ev.dateDisplay}
          </span>
        </div>
        ${ev.description ? `<div class="calendar-event-desc">${ev.description.trim()}</div>` : ''}
      </div>
    `;

    container.appendChild(eventDiv);
  });
}

// =========================
// BOARD MEMBERS
// =========================

function initBoard() {
  const container = document.getElementById('boardMembers');
  if (!container) return;

  const BOARD_ENDPOINT = 'board.php';

  container.innerHTML = `
    <div class="board-skeleton"><div class="skeleton-line" style="width:40%"></div><div class="skeleton-line" style="width:60%"></div></div>
    <div class="board-skeleton"><div class="skeleton-line" style="width:35%"></div><div class="skeleton-line" style="width:55%"></div></div>
    <div class="board-skeleton"><div class="skeleton-line" style="width:45%"></div><div class="skeleton-line" style="width:50%"></div></div>
  `;

  fetch(BOARD_ENDPOINT)
    .then(res => {
      if (!res.ok) {
        return res.text().then(text => {
          throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
        });
      }
      return res.json();
    })
    .then(members => {
      if (members.error) throw new Error(members.error);
      renderBoard(members, container);
    })
    .catch(err => {
      console.error('Styrelsefel:', err);
      container.innerHTML = '<p class="board-empty">Kunde inte ladda styrelseinformation.</p>';
    });
}

function renderBoard(members, container) {
  if (!members || members.length === 0) {
    container.innerHTML = '<p class="board-empty">Ingen styrelseinformation tillgänglig.</p>';
    return;
  }

  container.innerHTML = '';

  members.forEach((member, index) => {
    const card = document.createElement('div');
    card.className = 'board-member-card';
    card.style.animationDelay = `${index * 0.06}s`;

    const name = document.createElement('h4');
    name.className = 'board-member-name';
    name.textContent = member.name;

    const post = document.createElement('div');
    post.className = 'board-member-post';
    post.textContent = member.post;

    card.appendChild(name);
    card.appendChild(post);

    if (member.contact && member.contact.trim()) {
      const contact = document.createElement('div');
      contact.className = 'board-member-contact';
      contact.textContent = member.contact;
      card.appendChild(contact);
    }

    container.appendChild(card);
  });
}
