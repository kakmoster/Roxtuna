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
  initDokument();
  initCalendar();
  initBoard();
  initInfo();
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

    // Statiska SVG-ikoner byggs med createElementNS + setAttribute (samma
    // mönster som renderCalendar). Extern data från Google Sheet får aldrig
    // in i någon innerHTML-literal – dynamisk text går endast via textContent.
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const svgEl = (tag, attrs) => {
      const el = document.createElementNS(SVG_NS, tag);
      for (const [attr, value] of Object.entries(attrs)) {
        el.setAttribute(attr, value);
      }
      return el;
    };

    const createChevronIcon = () => {
      const chevron = svgEl('svg', {
        'class': 'chevron',
        viewBox: '0 0 24 24',
        width: '16',
        height: '16',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.5',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
      chevron.appendChild(svgEl('polyline', { points: '9 18 15 12 9 6' }));
      return chevron;
    };

    const createFolderIcon = () => {
      const folderIcon = svgEl('svg', {
        'class': 'folder-icon',
        viewBox: '0 0 24 24',
        width: '18',
        height: '18',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.8',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
      folderIcon.appendChild(svgEl('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }));
      return folderIcon;
    };

    const createFileIcon = () => {
      const fileIcon = svgEl('svg', {
        'class': 'file-icon',
        viewBox: '0 0 24 24',
        width: '14',
        height: '14',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.8',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
      fileIcon.appendChild(svgEl('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }));
      fileIcon.appendChild(svgEl('polyline', { points: '14 2 14 8 20 8' }));
      return fileIcon;
    };

    years.forEach((year, yIndex) => {
      const folderLi = document.createElement('li');
      folderLi.className = 'tree-folder';

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'tree-folder-toggle';
      // Extern data (year) går endast genom textContent.
      const yearSpan = document.createElement('span');
      yearSpan.textContent = year;
      toggleBtn.appendChild(createChevronIcon());
      toggleBtn.appendChild(createFolderIcon());
      toggleBtn.appendChild(yearSpan);

      const childrenUl = document.createElement('ul');
      childrenUl.className = 'tree-folder-children';

      const files = data[year] || [];
      files.forEach(file => {
        const fileBtn = document.createElement('button');
        fileBtn.className = 'tree-file';
        // Extern data (cleanName(file.name)) går endast genom textContent.
        const fileSpan = document.createElement('span');
        fileSpan.textContent = cleanName(file.name);
        fileBtn.appendChild(createFileIcon());
        fileBtn.appendChild(fileSpan);
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
// ÖVRIGA DOKUMENT — hierarkiskt träd + sökning
// =========================

function initDokument() {
  const treeList = document.getElementById('docTree');
  if (!treeList) return;

  const searchInput = document.getElementById('docSearch');
  const searchClear = document.getElementById('docSearchClear');
  const statusLine = document.getElementById('docTreeStatus');

  const viewerTitle = document.getElementById('docViewerTitle');
  const viewerDetails = document.getElementById('docViewerDetails');
  const openBtn = document.getElementById('docOpenBtn');
  const downloadBtn = document.getElementById('docDownloadBtn');
  const placeholder = document.getElementById('docViewerPlaceholder');
  const noPreview = document.getElementById('docNoPreview');
  const noPreviewTitle = document.getElementById('docNoPreviewTitle');
  const noPreviewLink = document.getElementById('docNoPreviewLink');
  const frame = document.getElementById('docPreviewFrame');

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let allItems = [];

  const svgEl = (tag, attrs) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [attr, value] of Object.entries(attrs)) {
      el.setAttribute(attr, value);
    }
    return el;
  };

  const createChevronIcon = () => {
    const chevron = svgEl('svg', {
      'class': 'chevron', viewBox: '0 0 24 24', width: '16', height: '16',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '2.5',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    chevron.appendChild(svgEl('polyline', { points: '9 18 15 12 9 6' }));
    return chevron;
  };

  const createFolderIcon = () => {
    const icon = svgEl('svg', {
      'class': 'folder-icon', viewBox: '0 0 24 24', width: '18', height: '18',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    icon.appendChild(svgEl('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }));
    return icon;
  };

  const createFileIcon = () => {
    const icon = svgEl('svg', {
      'class': 'file-icon', viewBox: '0 0 24 24', width: '14', height: '14',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    icon.appendChild(svgEl('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }));
    icon.appendChild(svgEl('polyline', { points: '14 2 14 8 20 8' }));
    return icon;
  };

  function formatDate(iso) {
    if (!iso) return null;
    const parts = String(iso).split('-');
    if (parts.length !== 3) return null;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Bygger ett hierarkiskt träd ur sökvägar. Djupet är obegränsat.
  // Hela path-Lista är mappar — filen ligger alltid UNDER sista mappen.
  // T.ex. path ["Lekplats","Besiktningar"] + filen "Besiktning 2024.pdf".
  function buildTree(items) {
    const root = { folders: new Map(), files: [] };

    items.forEach(item => {
      const path = Array.isArray(item.path) && item.path.length ? item.path : ['Övrigt'];
      let node = root;

      path.forEach(segment => {
        if (!node.folders.has(segment)) {
          node.folders.set(segment, { folders: new Map(), files: [] });
        }
        node = node.folders.get(segment);
      });

      node.files.push(item);
    });

    return root;
  }

  function countTree(node) {
    let count = node.files.length;
    node.folders.forEach(child => { count += countTree(child); });
    return count;
  }

  function setStatus(message) {
    if (statusLine) statusLine.textContent = message || '';
  }

  function matches(item, query) {
    if (!query) return true;
    const haystack = [
      item.display || '',
      item.name || '',
      (item.path || []).join(' '),
      item.date || ''
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  }

  function renderTree(items, query) {
    treeList.innerHTML = '';

    if (items.length === 0) {
      if (query) {
        const empty = document.createElement('li');
        empty.className = 'tree-empty';
        empty.textContent = 'Inga dokument matchar sökningen.';
        treeList.appendChild(empty);
        setStatus('');
      }
      return;
    }

    const tree = buildTree(items);
    renderNode(tree, treeList, 0, query);

    const shown = query ? items.length : countTree(tree);
    setStatus(query
      ? `${shown} ${shown === 1 ? 'dokument' : 'dokument'} matchar sökningen`
      : `${shown} ${shown === 1 ? 'dokument' : 'dokument'} totalt`);
  }

  function renderNode(node, container, depth, query) {
    const folderNames = [...node.folders.keys()];

    folderNames.forEach((name) => {
      const child = node.folders.get(name);
      const folderLi = document.createElement('li');
      folderLi.className = 'tree-folder';

      const childrenUl = document.createElement('ul');
      childrenUl.className = 'tree-folder-children';

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'tree-folder-toggle';
      toggleBtn.setAttribute('aria-expanded', 'false');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'tree-folder-name';
      nameSpan.textContent = name; // extern data → enbart textContent

      const countSpan = document.createElement('span');
      countSpan.className = 'tree-folder-count';
      countSpan.textContent = String(countTree(child));

      toggleBtn.appendChild(createChevronIcon());
      toggleBtn.appendChild(createFolderIcon());
      toggleBtn.appendChild(nameSpan);
      toggleBtn.appendChild(countSpan);

      renderNode(child, childrenUl, depth + 1, query);

      toggleBtn.addEventListener('click', () => {
        const nowOpen = childrenUl.classList.toggle('open');
        toggleBtn.classList.toggle('open', nowOpen);
        toggleBtn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      });

      // Standard är KOLLAPSAT — filerna visas inte förrän användaren
      // öppnar mappen. Vid sökning öppnas hela vägen så träffarna
      // inte döljs. Klicka på en mapp för att öppna/stänga manuellt.
      if (query) {
        childrenUl.classList.add('open');
        toggleBtn.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }

      folderLi.appendChild(toggleBtn);
      folderLi.appendChild(childrenUl);
      container.appendChild(folderLi);
    });

    node.files.forEach(item => {
      const fileLi = document.createElement('li');
      const fileBtn = document.createElement('button');
      fileBtn.className = 'tree-file';
      fileBtn.type = 'button';

      const label = document.createElement('span');
      label.className = 'tree-file-name';
      label.textContent = item.display || item.name; // extern data → textContent

      fileBtn.appendChild(createFileIcon());
      fileBtn.appendChild(label);

      if (item.date) {
        const dateBadge = document.createElement('span');
        dateBadge.className = 'tree-file-date';
        dateBadge.textContent = formatDate(item.date) || item.date;
        fileBtn.appendChild(dateBadge);
      }

      fileBtn.addEventListener('click', () => selectFile(item, fileBtn));

      fileLi.appendChild(fileBtn);
      container.appendChild(fileLi);
    });
  }

  function selectFile(item, element) {
    document.querySelectorAll('#docTree .tree-file').forEach(node => node.classList.remove('active'));
    element.classList.add('active');

    viewerTitle.textContent = item.display || item.name;

    // Metadata byggs med textContent — ingen extern text i innerHTML
    viewerDetails.innerHTML = '';
    if (item.date) {
      const dateSpan = document.createElement('span');
      dateSpan.textContent = formatDate(item.date) || item.date;
      viewerDetails.appendChild(dateSpan);
      const sep = document.createElement('span');
      sep.className = 'viewer-meta-sep';
      sep.textContent = '|';
      viewerDetails.appendChild(sep);
    }
    const typeSpan = document.createElement('span');
    typeSpan.textContent = (item.ext || 'dokument').toUpperCase();
    viewerDetails.appendChild(typeSpan);

    const pathSpan = document.createElement('span');
    pathSpan.className = 'viewer-meta-sep';
    pathSpan.textContent = '|';
    viewerDetails.appendChild(pathSpan);
    const pathText = document.createElement('span');
    pathText.textContent = (item.path || []).join(' / ');
    viewerDetails.appendChild(pathText);

    if (downloadBtn) {
      downloadBtn.href = item.downloadUrl;
      downloadBtn.style.display = 'inline-flex';
    }
    if (openBtn) {
      openBtn.href = item.driveUrl;
      openBtn.style.display = 'inline-flex';
    }

    placeholder.style.display = 'none';

    if (item.previewable) {
      // Drive-iframen laddar in async; dölj spinner tills den svarat
      if (noPreview) noPreview.style.display = 'none';
      frame.style.opacity = '0';
      frame.onload = () => { frame.style.opacity = '1'; };
      frame.src = item.previewUrl;
    } else {
      frame.removeAttribute('src');
      frame.style.opacity = '0';
      if (noPreview) {
        noPreview.style.display = 'flex';
        noPreviewTitle.textContent = `${(item.ext || 'filen').toUpperCase()}-fil`;
        noPreviewLink.href = item.driveUrl;
      }
    }
  }

  function resetViewer() {
    if (frame) {
      frame.removeAttribute('src');
      frame.style.opacity = '0';
    }
    if (noPreview) noPreview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (viewerTitle) viewerTitle.textContent = 'Välj ett dokument';
    if (viewerDetails) viewerDetails.innerHTML = '';
    if (downloadBtn) downloadBtn.style.display = 'none';
    if (openBtn) openBtn.style.display = 'none';
    document.querySelectorAll('#docTree .tree-file').forEach(node => node.classList.remove('active'));
  }

  // Tomt-felmeddelande byggs säkert (aldrig via innerHTML med extern data)
  function renderError(message) {
    resetViewer();
    treeList.innerHTML = '';
    const errorLi = document.createElement('li');
    errorLi.className = 'tree-error';

    const msg = document.createElement('p');
    msg.textContent = message;
    errorLi.appendChild(msg);

    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn-retry';
    retryBtn.type = 'button';
    retryBtn.textContent = 'Försök igen';
    retryBtn.addEventListener('click', () => load(true));
    errorLi.appendChild(retryBtn);

    treeList.appendChild(errorLi);
    setStatus('');
  }

  function renderEmpty() {
    resetViewer();
    treeList.innerHTML = '';
    const emptyLi = document.createElement('li');
    emptyLi.className = 'tree-empty';
    emptyLi.textContent = 'Inga dokument har lagts till ännu.';
    treeList.appendChild(emptyLi);
    setStatus('');
  }

  function applyFilter() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchClear) searchClear.hidden = searchInput ? searchInput.value.length === 0 : true;

    if (allItems.length === 0) return;

    const filtered = query ? allItems.filter(item => matches(item, query)) : allItems;
    renderTree(filtered, query);

    if (query && filtered.length === 0) {
      setStatus('Inga dokument matchar sökningen.');
    }
  }

  function load(force) {
    setStatus('Laddar dokument…');

    fetch('dokument_data.php' + (force ? '?t=' + Date.now() : ''))
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(json => {
        if (!json || json.ok !== true) {
          throw new Error((json && json.error) || 'Kunde inte ladda dokumenten.');
        }

        allItems = Array.isArray(json.data) ? json.data : [];

        if (allItems.length === 0) {
          renderEmpty();
          return;
        }

        renderTree(allItems, '');
        if (searchInput) applyFilter();

        if (json.stale) {
          setStatus('Visar senast sparade version — kunde inte nå källan just nu.');
        }
      })
      .catch(err => {
        console.error('Dokumentfel:', err);
        renderError('Kunde inte ladda dokumenten. Kontrollera internetkopplingen och försök igen.');
      });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      applyFilter();
      searchInput.focus();
    });
  }

  load(false);
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
  // Riktiga emoji i stället för HTML-entiteter: textContent tolkar inte
  // entiteter, och korten ska se identiska ut som tidigare.
  const iconEmojis = ['🌳', '☕', '🎻'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const displayEvents = events.slice(0, 3);

  const createSvgLine = (x1, y1, x2, y2) => {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    return line;
  };

  displayEvents.forEach((ev, index) => {
    const iconClass = iconClasses[index % iconClasses.length];
    const iconEmoji = iconEmojis[index % iconEmojis.length];

    const eventDiv = document.createElement('div');
    eventDiv.className = 'calendar-event';
    eventDiv.style.animationDelay = `${index * 0.08}s`;

    const iconDiv = document.createElement('div');
    iconDiv.className = `calendar-event-icon ${iconClass}`;
    iconDiv.textContent = iconEmoji;
    eventDiv.appendChild(iconDiv);

    const bodyDiv = document.createElement('div');
    bodyDiv.setAttribute('style', 'flex: 1; min-width: 0;');

    const titleDiv = document.createElement('div');
    titleDiv.className = 'calendar-event-title';
    titleDiv.textContent = ev.summary;
    bodyDiv.appendChild(titleDiv);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'calendar-event-meta';
    const metaSpan = document.createElement('span');

    const calIcon = document.createElementNS(SVG_NS, 'svg');
    calIcon.setAttribute('viewBox', '0 0 24 24');
    calIcon.setAttribute('width', '12');
    calIcon.setAttribute('height', '12');
    calIcon.setAttribute('fill', 'none');
    calIcon.setAttribute('stroke', 'currentColor');
    calIcon.setAttribute('stroke-width', '2');
    calIcon.setAttribute('stroke-linecap', 'round');
    calIcon.setAttribute('stroke-linejoin', 'round');

    const rectEl = document.createElementNS(SVG_NS, 'rect');
    rectEl.setAttribute('x', '3');
    rectEl.setAttribute('y', '4');
    rectEl.setAttribute('width', '18');
    rectEl.setAttribute('height', '18');
    rectEl.setAttribute('rx', '2');
    rectEl.setAttribute('ry', '2');
    calIcon.appendChild(rectEl);
    calIcon.appendChild(createSvgLine(16, 2, 16, 6));
    calIcon.appendChild(createSvgLine(8, 2, 8, 6));
    calIcon.appendChild(createSvgLine(3, 10, 21, 10));

    metaSpan.appendChild(calIcon);
    metaSpan.appendChild(document.createTextNode(ev.dateDisplay));
    metaDiv.appendChild(metaSpan);
    bodyDiv.appendChild(metaDiv);

    if (ev.description) {
      const descDiv = document.createElement('div');
      descDiv.className = 'calendar-event-desc';
      descDiv.textContent = ev.description.trim();
      bodyDiv.appendChild(descDiv);
    }

    eventDiv.appendChild(bodyDiv);
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

// =========================
// INFO — ACCORDION + SEARCH
// =========================

function initInfo() {
  const accordion = document.getElementById('infoAccordion');
  if (!accordion) return;

  const searchInput = document.getElementById('infoSearch');

  fetch('info_data.php')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(json => {
      const sections = json && json.data ? json.data : [];
      if (sections.length === 0) {
        accordion.innerHTML = '<p class="info-error">Ingen information hittades.</p>';
        return;
      }
      renderInfo(sections, accordion);

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          filterInfo(sections, searchInput.value, accordion);
        });
      }
    })
    .catch(err => {
      console.error('Infofel:', err);
      accordion.innerHTML = '<p class="info-error">Kunde inte ladda information.</p>';
    });
}

function renderInfo(sections, container) {
  container.innerHTML = '';

  sections.forEach((section, index) => {
    const item = document.createElement('div');
    item.className = 'info-item';
    item.style.animationDelay = `${index * 0.04}s`;

    const btn = document.createElement('button');
    btn.className = 'info-toggle';
    btn.setAttribute('aria-expanded', 'false');

    const title = document.createElement('span');
    title.className = 'info-title';
    title.textContent = section.title;

    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('class', 'info-chevron');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('width', '18');
    chevron.setAttribute('height', '18');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('stroke-width', '2.2');
    chevron.setAttribute('stroke-linecap', 'round');
    chevron.setAttribute('stroke-linejoin', 'round');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '6 9 12 15 18 9');
    chevron.appendChild(poly);

    btn.appendChild(title);
    btn.appendChild(chevron);

    const body = document.createElement('div');
    body.className = 'info-body';

    const inner = document.createElement('div');
    inner.className = 'info-body-inner';

    if (section.category) {
      const cat = document.createElement('span');
      cat.className = 'info-category';
      cat.textContent = section.category;
      inner.appendChild(cat);
    }

    // Stycken: textcellens radbrytningar blir stycken
    const paragraphs = String(section.text || '').split(/\n+/).map(p => p.trim()).filter(Boolean);
    paragraphs.forEach(par => {
      const p = document.createElement('p');
      p.textContent = par;
      inner.appendChild(p);
    });

    body.appendChild(inner);

    btn.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      // Följ innehållets verkliga höjd så långa texter aldrig klipps
      body.style.maxHeight = isOpen ? (body.scrollHeight + 'px') : '';
    });

    item.appendChild(btn);
    item.appendChild(body);
    container.appendChild(item);
  });
}

function filterInfo(sections, query, container) {
  const q = query.trim().toLowerCase();

  container.querySelectorAll('.info-item').forEach((item, index) => {
    const section = sections[index];
    const match = !q
      || section.title.toLowerCase().includes(q)
      || String(section.text || '').toLowerCase().includes(q)
      || (section.category || '').toLowerCase().includes(q);
    item.style.display = match ? '' : 'none';
  });

  // Vid sökning: fäll ut träffar automatiskt
  if (q) {
    container.querySelectorAll('.info-item').forEach(item => {
      if (item.style.display !== 'none' && !item.classList.contains('open')) {
        const btn = item.querySelector('.info-toggle');
        item.classList.add('open');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      }
    });
  }
}
