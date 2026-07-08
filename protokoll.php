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
        <p class="tree-subtitle">Utforska våra dokument</p>
        <ul class="tree-list" id="treeList">
            <!-- Fylls i av app.js -->
        </ul>
    </aside>

    <!-- VIEWER -->
    <div class="viewer-panel" id="viewerPanel">
        <div class="viewer-meta" id="viewerMeta">
            <div class="viewer-meta-left">
                <div class="viewer-meta-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <div>
                    <div class="viewer-meta-title" id="viewerTitle">Välj ett dokument</div>
                    <div class="viewer-meta-details" id="viewerDetails">
                        <span>PDF</span>
                    </div>
                </div>
            </div>
            <a href="#" class="download-btn" id="downloadBtn" style="display: none;" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Ladda ner
            </a>
        </div>
        <div class="viewer-iframe-wrap" id="viewerWrap">
            <div class="viewer-placeholder" id="viewerPlaceholder">
                <svg class="viewer-placeholder-icon" viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p>Välj ett dokument i mappstrukturen för att visa det</p>
            </div>
            <iframe id="pdfViewer" title="PDF-visare"></iframe>
        </div>
    </div>

</div>

<?php include 'footer.php'; ?>