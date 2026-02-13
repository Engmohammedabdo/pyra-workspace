<?php require_once 'config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pyra Workspace</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📁</text></svg>">
    <!-- mammoth.js for DOCX preview -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js" crossorigin="anonymous" defer></script>
</head>
<body>
    <div class="app-container">
        <!-- Top Bar -->
        <div class="top-bar">
            <div class="logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                Pyra Workspace
            </div>
            <div class="breadcrumb" id="breadcrumb"></div>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
            <div class="toolbar-group">
                <button class="btn" onclick="App.goBack()" title="Go Back (Alt+Left)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                    Back
                </button>
            </div>

            <div class="toolbar-sep"></div>

            <div class="toolbar-group">
                <button class="btn btn-primary" onclick="App.triggerUpload()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload
                </button>
                <button class="btn" onclick="App.showNewFolderModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
                    New Folder
                </button>
            </div>

            <div class="toolbar-sep"></div>

            <div class="toolbar-group">
                <button class="btn btn-ghost btn-icon" onclick="App.loadFiles()" title="Refresh">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                </button>
            </div>

            <div class="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="searchInput" placeholder="Search files...">
            </div>
        </div>

        <!-- Info Bar -->
        <div class="info-bar" id="infoBar"></div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- File List -->
            <div class="file-panel" style="position:relative">
                <!-- Column Headers -->
                <div class="file-list-header">
                    <span></span>
                    <span class="sortable" onclick="App.toggleSort('name')">Name <span id="sortIndicatorName"></span></span>
                    <span class="sortable" style="text-align:right" onclick="App.toggleSort('size')">Size <span id="sortIndicatorSize"></span></span>
                    <span class="sortable col-date" style="text-align:right" onclick="App.toggleSort('date')">Modified <span id="sortIndicatorDate"></span></span>
                    <span></span>
                </div>
                <div class="file-grid" id="fileGrid"></div>
                <div class="loading-overlay" id="loadingOverlay" style="display:none">
                    <div class="spinner"></div>
                </div>
            </div>

            <!-- Preview Panel -->
            <div class="preview-panel" id="previewPanel">
                <div class="preview-header">
                    <div class="preview-title" id="previewTitle"></div>
                    <div class="preview-actions" id="previewActions"></div>
                </div>
                <div class="preview-file-info" id="previewFileInfo"></div>
                <div class="preview-body" id="previewBody"></div>
            </div>
        </div>
    </div>

    <!-- Drop Zone -->
    <div class="drop-zone" id="dropZone">
        <div class="drop-zone-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p>Drop files to upload</p>
            <p class="hint">Files will be uploaded to the current folder</p>
        </div>
    </div>

    <!-- Context Menu -->
    <div class="context-menu" id="contextMenu"></div>

    <!-- Modal -->
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal">
            <div class="modal-title" id="modalTitle"></div>
            <input type="text" class="modal-input" id="modalInput" placeholder="Enter name...">
            <div class="modal-actions">
                <button class="btn" id="modalCancel">Cancel</button>
                <button class="btn btn-primary" id="modalConfirm">Confirm</button>
            </div>
        </div>
    </div>

    <!-- Upload Progress -->
    <div class="upload-progress" id="uploadProgress">
        <div class="upload-progress-title">Uploading files...</div>
        <div class="upload-progress-bar">
            <div class="upload-progress-fill" id="uploadProgressFill"></div>
        </div>
        <div class="upload-progress-text" id="uploadProgressText"></div>
    </div>

    <!-- Toast -->
    <div class="toast-container" id="toastContainer"></div>

    <script>
        window.PYRA_CONFIG = {
            supabaseUrl: '<?= defined("SUPABASE_URL") ? SUPABASE_URL : "" ?>',
            bucket: '<?= defined("SUPABASE_BUCKET") ? SUPABASE_BUCKET : "" ?>',
            maxUploadSize: <?= defined("MAX_UPLOAD_SIZE") ? MAX_UPLOAD_SIZE : 524288000 ?>
        };
    </script>
    <script src="app.js"></script>
</body>
</html>
