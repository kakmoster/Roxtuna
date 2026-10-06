<?php include 'header.php'; ?>

<!-- Two-column layout: 1/3 tree, 2/3 viewer -->
<div class="two-col-layout swap">

    <!-- TREE SIDEBAR -->
    <aside class="tree-panel" aria-labelledby="tree-heading">
        <div class="tree-header">
            <svg class="tree-header-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3 id="tree-heading" class="tree-title">Dokument</h3>
        </div>
        <p class="tree-subtitle">Övriga dokument och handlingar</p>

        <!-- Sökning -->
        <div class="doc-search-wrap">
            <svg class="doc-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="search" id="docSearch" class="doc-search"
                   placeholder="Sök dokument…" autocomplete="off"
                   aria-label="Sök bland dokument">
            <button id="docSearchClear" class="doc-search-clear" type="button"
                    aria-label="Rensa sökning" hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>

        <ul class="tree-list" id="docTree">
            <!-- Fylls i av app.js -->
        </ul>

        <p class="doc-tree-status" id="docTreeStatus" role="status" aria-live="polite"></p>
    </aside>

    <!-- VIEWER -->
    <div class="viewer-panel" id="docViewerPanel">
        <div class="viewer-meta" id="docViewerMeta">
            <div class="viewer-meta-left">
                <div class="viewer-meta-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <div>
                    <div class="viewer-meta-title" id="docViewerTitle">Välj ett dokument</div>
                    <div class="viewer-meta-details" id="docViewerDetails"></div>
                </div>
            </div>
            <div class="doc-viewer-actions">
                <a href="#" id="docOpenBtn" class="doc-secondary-btn" target="_blank" rel="noopener" style="display: none;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Öppna i Drive
                </a>
                <a href="#" id="docDownloadBtn" class="download-btn" style="display: none;" target="_blank" rel="noopener">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Ladda ner
                </a>
            </div>
        </div>

        <div class="viewer-iframe-wrap" id="docViewerWrap">
            <div class="viewer-placeholder" id="docViewerPlaceholder">
                <svg class="viewer-placeholder-icon" viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p>Välj ett dokument i mappstrukturen för att visa det</p>
            </div>

            <!-- Visas för filtyper Drive inte kan förhandsgranska -->
            <div class="doc-no-preview" id="docNoPreview" style="display: none;">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p class="doc-no-preview-title" id="docNoPreviewTitle"></p>
                <p class="doc-no-preview-text">
                    Den här filtypen kan inte visas direkt i webbläsaren.
                    Öppna dokumentet i Google Drive där du kan läsa eller ladda ner det.
                </p>
                <a href="#" id="docNoPreviewLink" class="download-btn" target="_blank" rel="noopener">Öppna i Google Drive</a>
            </div>

            <iframe id="docPreviewFrame" title="Dokumentförhandsgranskning"></iframe>
        </div>
    </div>

</div>

<?php include 'footer.php'; ?>