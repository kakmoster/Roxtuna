<?php include 'header.php'; ?>

<section class="protokoll-section">
    <h2 class="section-title">Protokoll</h2>

    <div class="protokoll-toolbar">
        <button class="back-btn" id="backBtn" type="button" aria-label="Tillbaka">
            <svg class="back-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Tillbaka
        </button>
        <span class="breadcrumb" id="breadcrumb">År</span>
    </div>

    <div class="protokoll-layout" id="protokollLayout">

        <!-- ÅR -->
        <div class="panel panel-years" id="years">
            <div class="panel-header">
                <h3>Välj år</h3>
            </div>
            <div class="panel-body years-list"></div>
        </div>

        <!-- FILER -->
        <div class="panel panel-files" id="files">
            <div class="panel-header">
                <h3>Välj protokoll</h3>
            </div>
            <div class="panel-body files-list"></div>
        </div>

        <!-- VIEWER -->
        <div class="panel panel-viewer" id="viewerContainer">
            <div class="placeholder" id="viewerPlaceholder">
                <svg class="placeholder-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p>Välj ett år och sedan ett protokoll för att visa det</p>
            </div>
            <iframe id="pdfViewer" title="PDF-visare"></iframe>
        </div>

    </div>
</section>

<?php include 'footer.php'; ?>