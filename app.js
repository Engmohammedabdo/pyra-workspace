/**
 * Pyra Workspace - File Manager v3
 * Security hardening, performance improvements, enhanced UX
 */

const FILE_TYPES = {
    image: ['jpg','jpeg','png','gif','svg','webp','bmp','ico','tiff'],
    video: ['mp4','webm','mov','avi','mkv','flv','wmv'],
    audio: ['mp3','wav','ogg','flac','aac','m4a','wma'],
    markdown: ['md','markdown'],
    pdf: ['pdf'],
    document: ['doc','docx'],
    code: ['js','ts','py','php','html','css','json','xml','yaml','yml','sh','bash','sql','rb','go','rs','java','c','cpp','h','jsx','tsx','vue','svelte'],
    archive: ['zip','rar','tar','gz','7z','bz2','xz'],
    text: ['txt','log','csv','ini','cfg','conf','env','toml','properties'],
    textExtra: ['gitignore','htaccess','npmrc','editorconfig']
};
FILE_TYPES.editable = [...FILE_TYPES.markdown, ...FILE_TYPES.code, ...FILE_TYPES.text];
FILE_TYPES.allText = [...FILE_TYPES.editable, ...FILE_TYPES.textExtra];

const TIME = { MINUTE: 60000, HOUR: 3600000, DAY: 86400000, WEEK: 604800000 };

const App = {
    currentPath: '',
    selectedFile: null,
    files: [],
    folders: [],
    editMode: false,
    editedContent: '',
    history: [],
    historyIndex: -1,
    sortBy: 'name',
    sortDir: 'asc',
    _previewId: 0,
    _modalAbort: null,

    icons: {
        folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
        file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
        image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
        audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        markdown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 15l1.5-2L12 15"/><path d="M15 12v3"/><path d="M15 12l-2 0"/></svg>',
        pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>',
        upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
        edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        rename: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
        home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
        link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="9" y1="13" x2="15" y2="13" stroke-dasharray="2 2"/></svg>',
        word: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13l1.5 4 1.5-4 1.5 4 1.5-4"/></svg>',
        back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
        newFolder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
        sortAsc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="18 15 12 9 6 15"/></svg>',
        sortDesc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>'
    },

    init() {
        this.bindEvents();
        this.loadFiles('');
    },

    _debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    },

    bindEvents() {
        document.getElementById('searchInput').addEventListener('input',
            this._debounce(() => this.renderFiles(), 200)
        );

        // Drag & drop
        let dragCounter = 0;
        document.body.addEventListener('dragenter', (e) => { e.preventDefault(); dragCounter++; document.getElementById('dropZone').classList.add('active'); });
        document.body.addEventListener('dragleave', (e) => { e.preventDefault(); dragCounter--; if (dragCounter === 0) document.getElementById('dropZone').classList.remove('active'); });
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => {
            e.preventDefault(); dragCounter = 0;
            document.getElementById('dropZone').classList.remove('active');
            if (e.dataTransfer.files.length > 0) this.uploadFiles(e.dataTransfer.files);
        });

        document.addEventListener('click', () => document.getElementById('contextMenu').classList.remove('active'));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { this.closePreview(); this.closeModal(); document.getElementById('contextMenu').classList.remove('active'); }
            if (e.key === 'Delete' && this.selectedFile && !this.editMode) this.deleteFile(this.selectedFile.path);
            if (e.ctrlKey && e.key === 's' && this.editMode) { e.preventDefault(); this.saveFile(); }
            if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); this.goBack(); }
        });
    },

    // === Navigation ===
    navigateTo(path) {
        if (this.currentPath !== path) {
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            this.history.push(this.currentPath);
            this.historyIndex = this.history.length - 1;
        }
        this.loadFiles(path);
    },

    goBack() {
        if (this.currentPath) {
            const parts = this.currentPath.split('/');
            parts.pop();
            this.loadFiles(parts.join('/'));
        }
    },

    async loadFiles(prefix) {
        if (prefix !== undefined) this.currentPath = prefix;
        this.closePreview();
        this.showLoading(true);

        try {
            const res = await fetch(`api.php?action=list&prefix=${encodeURIComponent(this.currentPath)}`);
            const data = await res.json();
            if (data.success) {
                this.folders = data.folders;
                this.files = data.files;
                this.renderBreadcrumb();
                this.renderInfoBar();
                this.renderFiles();
            } else {
                this.toast('Failed to load files: ' + (data.error || ''), 'error');
            }
        } catch (err) {
            this.toast('Connection error: ' + err.message, 'error');
        }
        this.showLoading(false);
    },

    renderBreadcrumb() {
        const el = document.getElementById('breadcrumb');
        const parts = this.currentPath ? this.currentPath.split('/') : [];

        let html = `<span class="breadcrumb-item ${!this.currentPath ? 'active' : ''}" onclick="App.loadFiles('')">
            ${this.icons.home} <span>Root</span></span>`;

        let path = '';
        parts.forEach((part, i) => {
            path += (path ? '/' : '') + part;
            const p = path;
            html += `<span class="breadcrumb-sep">\u203A</span>`;
            html += `<span class="breadcrumb-item ${i === parts.length - 1 ? 'active' : ''}" onclick="App.loadFiles('${this.escAttr(p)}')">${this.escHtml(part)}</span>`;
        });

        el.innerHTML = html;
    },

    renderInfoBar() {
        const el = document.getElementById('infoBar');
        if (!el) return;
        const folderCount = this.folders.filter(f => f.name !== '.keep').length;
        const fileCount = this.files.filter(f => f.name !== '.keep').length;
        const totalSize = this.files.reduce((s, f) => s + (f.size || 0), 0);

        el.innerHTML = `
            <span class="path-display">/${this.currentPath || ''}</span>
            <span>${folderCount} folder${folderCount !== 1 ? 's' : ''}, ${fileCount} file${fileCount !== 1 ? 's' : ''}${totalSize ? ' \u00B7 ' + this.formatSize(totalSize) : ''}</span>
        `;
    },

    // === Sorting ===
    toggleSort(column) {
        if (this.sortBy === column) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = column;
            this.sortDir = 'asc';
        }
        this.updateSortIndicators();
        this.renderFiles();
    },

    updateSortIndicators() {
        ['name', 'size', 'date'].forEach(col => {
            const el = document.getElementById('sortIndicator' + col.charAt(0).toUpperCase() + col.slice(1));
            if (el) {
                if (this.sortBy === col) {
                    el.innerHTML = this.sortDir === 'asc' ? this.icons.sortAsc : this.icons.sortDesc;
                } else {
                    el.innerHTML = '';
                }
            }
        });
    },

    renderFiles() {
        const el = document.getElementById('fileGrid');
        const searchVal = document.getElementById('searchInput').value.toLowerCase();

        let filteredFolders = this.folders.filter(f => {
            if (f.name === '.keep') return false;
            if (searchVal && !f.name.toLowerCase().includes(searchVal)) return false;
            return true;
        });

        let filteredFiles = this.files.filter(f => {
            if (f.name === '.keep') return false;
            if (searchVal && !f.name.toLowerCase().includes(searchVal)) return false;
            return true;
        });

        // Sort folders by name always
        filteredFolders.sort((a, b) => a.name.localeCompare(b.name));

        // Sort files
        filteredFiles.sort((a, b) => {
            let cmp = 0;
            switch (this.sortBy) {
                case 'name': cmp = a.name.localeCompare(b.name); break;
                case 'size': cmp = (a.size || 0) - (b.size || 0); break;
                case 'date': cmp = new Date(a.updated_at || 0) - new Date(b.updated_at || 0); break;
            }
            return this.sortDir === 'asc' ? cmp : -cmp;
        });

        let items = [];
        filteredFolders.forEach(f => items.push(this.renderFolderItem(f)));
        filteredFiles.forEach(f => items.push(this.renderFileItem(f)));

        if (items.length === 0) {
            const isSearching = !!searchVal;
            el.innerHTML = `<div class="empty-state">
                ${isSearching ? this.icons.search : this.icons.empty}
                <p>${isSearching ? 'No files match your search' : 'This folder is empty'}</p>
                <p class="hint">${isSearching ? 'Try a different search term' : 'Drop files here or click Upload'}</p>
            </div>`;
        } else {
            el.innerHTML = items.join('');
        }
    },

    renderFolderItem(f) {
        const fJson = this.escAttr(JSON.stringify(f));
        return `<div class="file-item" onclick="App.navigateTo('${this.escAttr(f.path)}')" oncontextmenu="App.showContextMenu(event, 'folder', ${fJson})">
            <div class="file-icon folder">${this.icons.folder}</div>
            <div class="file-name">${this.escHtml(f.name)}</div>
            <div class="file-size"></div>
            <div class="file-date"></div>
            <div class="file-actions-col">
                <button class="file-action-btn delete" onclick="event.stopPropagation(); App.deleteFolder('${this.escAttr(f.path)}')" title="Delete">${this.icons.trash}</button>
            </div>
        </div>`;
    },

    renderFileItem(f) {
        const iconInfo = this.getFileIcon(f.name, f.mimetype);
        const selected = this.selectedFile && this.selectedFile.path === f.path ? 'selected' : '';
        const fJson = this.escAttr(JSON.stringify(f));

        return `<div class="file-item ${selected}" onclick="App.previewFile(${fJson})" oncontextmenu="App.showContextMenu(event, 'file', ${fJson})">
            <div class="file-icon ${iconInfo.class}">${iconInfo.icon}</div>
            <div class="file-name">${this.escHtml(f.name)}</div>
            <div class="file-size">${this.formatSize(f.size)}</div>
            <div class="file-date">${this.formatDate(f.updated_at)}</div>
            <div class="file-actions-col">
                <button class="file-action-btn" onclick="event.stopPropagation(); App.downloadFile('${this.escAttr(f.path)}')" title="Download">${this.icons.download}</button>
                <button class="file-action-btn" onclick="event.stopPropagation(); App.showRenameModal('${this.escAttr(f.path)}', '${this.escAttr(f.name)}')" title="Rename">${this.icons.rename}</button>
                <button class="file-action-btn delete" onclick="event.stopPropagation(); App.deleteFile('${this.escAttr(f.path)}')" title="Delete">${this.icons.trash}</button>
            </div>
        </div>`;
    },

    getFileIcon(name, mimetype) {
        const ext = name.split('.').pop().toLowerCase();
        const mt = (mimetype || '').toLowerCase();
        if (mt.startsWith('image/') || FILE_TYPES.image.includes(ext)) return { icon: this.icons.image, class: 'image' };
        if (mt.startsWith('video/') || FILE_TYPES.video.includes(ext)) return { icon: this.icons.video, class: 'video' };
        if (mt.startsWith('audio/') || FILE_TYPES.audio.includes(ext)) return { icon: this.icons.audio, class: 'audio' };
        if (FILE_TYPES.markdown.includes(ext)) return { icon: this.icons.markdown, class: 'markdown' };
        if (FILE_TYPES.pdf.includes(ext)) return { icon: this.icons.pdf, class: 'pdf' };
        if (FILE_TYPES.document.includes(ext)) return { icon: this.icons.word, class: 'document' };
        if (FILE_TYPES.code.includes(ext)) return { icon: this.icons.code, class: 'code' };
        if (FILE_TYPES.archive.includes(ext)) return { icon: this.icons.archive, class: 'archive' };
        if (FILE_TYPES.text.includes(ext)) return { icon: this.icons.file, class: 'text' };
        return { icon: this.icons.file, class: 'text' };
    },

    // === RTL Detection ===
    hasArabic(text) {
        if (!text) return false;
        return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
    },

    wrapWithDir(html, text) {
        if (this.hasArabic(text)) {
            return `<div class="rtl-content" dir="rtl">${html}</div>`;
        }
        return html;
    },

    // === Preview ===
    async previewFile(file) {
        const myId = ++this._previewId;
        this.selectedFile = file;
        this.editMode = false;
        this.renderFiles();

        const panel = document.getElementById('previewPanel');
        const title = document.getElementById('previewTitle');
        const body = document.getElementById('previewBody');
        const actions = document.getElementById('previewActions');
        const fileInfo = document.getElementById('previewFileInfo');

        title.textContent = file.name;
        panel.classList.add('open');

        if (fileInfo) {
            fileInfo.innerHTML = `
                <span>${this.formatSize(file.size)}</span>
                <span>${file.mimetype || 'unknown'}</span>
                <span>${this.formatDate(file.updated_at)}</span>
            `;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        const mt = (file.mimetype || '').toLowerCase();

        let actionsHtml = `
            <button class="btn btn-sm btn-ghost" onclick="App.downloadFile('${this.escAttr(file.path)}')" title="Download">${this.icons.download} Download</button>
            <button class="btn btn-sm btn-ghost" onclick="App.copyPublicUrl('${this.escAttr(file.path)}')" title="Copy Link">${this.icons.link}</button>
        `;
        if (this.isEditable(ext, mt)) {
            actionsHtml += `<button class="btn btn-sm btn-ghost" onclick="App.editFile(${this.escAttr(JSON.stringify(file))})" title="Edit">${this.icons.edit}</button>`;
        }
        actionsHtml += `<button class="btn btn-sm btn-ghost" onclick="App.closePreview()" title="Close">${this.icons.close}</button>`;
        actions.innerHTML = actionsHtml;

        body.innerHTML = '<div style="display:flex;justify-content:center;padding:60px"><div class="spinner"></div></div>';

        // Render by type
        if (mt.startsWith('image/') || FILE_TYPES.image.includes(ext)) {
            if (this._previewId !== myId) return;
            const url = this.getPublicUrl(file.path);
            body.innerHTML = `<div class="preview-image"><img src="${url}" alt="${this.escHtml(file.name)}" loading="lazy" /></div>`;
        } else if (mt.startsWith('video/') || FILE_TYPES.video.includes(ext)) {
            if (this._previewId !== myId) return;
            const url = this.getPublicUrl(file.path);
            body.innerHTML = `<div class="preview-video"><video controls src="${url}"></video></div>`;
        } else if (mt.startsWith('audio/') || FILE_TYPES.audio.includes(ext)) {
            if (this._previewId !== myId) return;
            const url = this.getPublicUrl(file.path);
            body.innerHTML = `<div class="preview-audio"><div class="audio-icon">${this.icons.audio}</div><audio controls src="${url}"></audio></div>`;
        } else if (ext === 'pdf') {
            if (this._previewId !== myId) return;
            const url = this.getPublicUrl(file.path);
            body.innerHTML = `<div class="preview-pdf"><iframe src="${url}#toolbar=1"></iframe></div>`;
        } else if (['docx'].includes(ext)) {
            await this.previewDocx(file, body, myId);
        } else if (FILE_TYPES.markdown.includes(ext)) {
            await this.previewMarkdown(file, body, myId);
        } else if (this.isTextType(ext, mt)) {
            await this.previewText(file, body, myId);
        } else {
            if (this._previewId !== myId) return;
            body.innerHTML = `<div class="empty-state">
                <div style="opacity:0.3">${this.getFileIcon(file.name, file.mimetype).icon}</div>
                <p>Preview not available for this file type</p>
                <button class="btn btn-primary" onclick="App.downloadFile('${this.escAttr(file.path)}')">${this.icons.download} Download</button>
            </div>`;
        }
    },

    async previewMarkdown(file, body, previewId) {
        try {
            const res = await fetch(`api.php?action=content&path=${encodeURIComponent(file.path)}`);
            if (this._previewId !== previewId) return;
            const data = await res.json();
            if (data.success) {
                const rendered = this.renderMarkdown(data.content);
                const isRtl = this.hasArabic(data.content);
                body.innerHTML = `<div class="preview-markdown${isRtl ? ' rtl-content' : ''}" ${isRtl ? 'dir="rtl"' : ''}>${rendered}</div>`;
            } else {
                body.innerHTML = `<div class="empty-state"><p>Failed to load file</p></div>`;
            }
        } catch (e) {
            if (this._previewId !== previewId) return;
            body.innerHTML = `<div class="empty-state"><p>Error loading file</p></div>`;
        }
    },

    async previewText(file, body, previewId) {
        try {
            const res = await fetch(`api.php?action=content&path=${encodeURIComponent(file.path)}`);
            if (this._previewId !== previewId) return;
            const data = await res.json();
            if (data.success) {
                const isRtl = this.hasArabic(data.content);
                body.innerHTML = `<pre class="code-editor" style="white-space:pre-wrap;cursor:text;border:none;resize:none;" ${isRtl ? 'dir="rtl"' : ''} readonly>${this.escHtml(data.content)}</pre>`;
            } else {
                body.innerHTML = `<div class="empty-state"><p>Failed to load file</p></div>`;
            }
        } catch (e) {
            if (this._previewId !== previewId) return;
            body.innerHTML = `<div class="empty-state"><p>Error loading file</p></div>`;
        }
    },

    async previewDocx(file, body, previewId) {
        try {
            const res = await fetch(`api.php?action=proxy&path=${encodeURIComponent(file.path)}`);
            if (this._previewId !== previewId) return;
            if (!res.ok) {
                body.innerHTML = `<div class="empty-state"><p>Failed to load DOCX file</p></div>`;
                return;
            }
            const arrayBuffer = await res.arrayBuffer();
            if (this._previewId !== previewId) return;

            if (typeof mammoth === 'undefined') {
                body.innerHTML = `<div class="empty-state"><p>DOCX viewer loading failed</p></div>`;
                return;
            }

            const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            if (this._previewId !== previewId) return;
            const htmlContent = result.value;
            const isRtl = this.hasArabic(htmlContent);

            body.innerHTML = `<div class="preview-docx${isRtl ? ' rtl-content' : ''}" ${isRtl ? 'dir="rtl"' : ''}>${htmlContent}</div>`;
        } catch (e) {
            if (this._previewId !== previewId) return;
            body.innerHTML = `<div class="empty-state"><p>Error loading DOCX: ${this.escHtml(e.message)}</p>
                <button class="btn btn-primary" onclick="App.downloadFile('${this.escAttr(file.path)}')">${this.icons.download} Download Instead</button>
            </div>`;
        }
    },

    async editFile(file) {
        this.editMode = true;
        const body = document.getElementById('previewBody');
        const actions = document.getElementById('previewActions');

        actions.innerHTML = `
            <button class="btn btn-sm btn-primary" onclick="App.saveFile()" title="Save (Ctrl+S)">${this.icons.save} Save</button>
            <button class="btn btn-sm btn-ghost" onclick="App.previewFile(${this.escAttr(JSON.stringify(file))})">Cancel</button>
            <button class="btn btn-sm btn-ghost" onclick="App.closePreview()">${this.icons.close}</button>
        `;

        body.innerHTML = '<div style="display:flex;justify-content:center;padding:60px"><div class="spinner"></div></div>';

        try {
            const res = await fetch(`api.php?action=content&path=${encodeURIComponent(file.path)}`);
            const data = await res.json();
            if (data.success) {
                this.editedContent = data.content;
                const isRtl = this.hasArabic(data.content);
                body.innerHTML = `<textarea class="code-editor" id="fileEditor" ${isRtl ? 'dir="rtl"' : ''} oninput="App.editedContent = this.value">${this.escHtml(data.content)}</textarea>`;
                document.getElementById('fileEditor').focus();
            }
        } catch (e) {
            this.toast('Failed to load file for editing', 'error');
        }
    },

    async saveFile() {
        if (!this.selectedFile) return;
        const ext = this.selectedFile.name.split('.').pop().toLowerCase();
        let mimeType = 'text/plain';
        if (FILE_TYPES.markdown.includes(ext)) mimeType = 'text/markdown';
        else if (ext === 'json') mimeType = 'application/json';
        else if (ext === 'html') mimeType = 'text/html';
        else if (ext === 'css') mimeType = 'text/css';
        else if (ext === 'js') mimeType = 'application/javascript';
        else if (ext === 'xml') mimeType = 'application/xml';
        else if (ext === 'yaml' || ext === 'yml') mimeType = 'text/yaml';

        const formData = new FormData();
        formData.append('action', 'save');
        formData.append('path', this.selectedFile.path);
        formData.append('content', this.editedContent);
        formData.append('mimeType', mimeType);

        try {
            const res = await fetch('api.php', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                this.toast('File saved', 'success');
                this.previewFile(this.selectedFile);
            } else {
                this.toast('Save failed: ' + (data.error || ''), 'error');
            }
        } catch (e) {
            this.toast('Save error: ' + e.message, 'error');
        }
    },

    closePreview() {
        document.getElementById('previewPanel').classList.remove('open');
        this.selectedFile = null;
        this.editMode = false;
        this.renderFiles();
    },

    // === Upload ===
    triggerUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.addEventListener('change', () => { if (input.files.length > 0) this.uploadFiles(input.files); });
        input.click();
    },

    async uploadFiles(fileList) {
        const progress = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('uploadProgressFill');
        const progressText = document.getElementById('uploadProgressText');
        progress.classList.add('active');

        const maxSize = window.PYRA_CONFIG?.maxUploadSize || 524288000;
        const total = fileList.length;
        let done = 0;
        let errors = 0;
        const concurrency = 3;
        const files = Array.from(fileList);

        const uploadOne = async (file) => {
            if (file.size > maxSize) {
                this.toast(`${file.name} exceeds max size (${this.formatSize(maxSize)})`, 'error');
                errors++;
                done++;
                progressFill.style.width = `${(done / total) * 100}%`;
                return;
            }
            progressText.textContent = `Uploading ${file.name} (${done + 1}/${total})...`;
            const formData = new FormData();
            formData.append('action', 'upload');
            formData.append('prefix', this.currentPath);
            formData.append('file', file);
            try {
                const res = await fetch('api.php', { method: 'POST', body: formData });
                const data = await res.json();
                if (!data.success) { this.toast(`Failed: ${file.name}`, 'error'); errors++; }
            } catch (e) {
                this.toast(`Error: ${file.name}`, 'error');
                errors++;
            }
            done++;
            progressFill.style.width = `${(done / total) * 100}%`;
            progressText.textContent = `Uploaded ${done}/${total}`;
        };

        for (let i = 0; i < files.length; i += concurrency) {
            const batch = files.slice(i, i + concurrency);
            await Promise.all(batch.map(f => uploadOne(f)));
        }

        progressText.textContent = `Done (${done - errors}/${total} successful)`;
        setTimeout(() => { progress.classList.remove('active'); progressFill.style.width = '0%'; }, 2000);
        this.loadFiles();
        this.toast(`${done - errors} file(s) uploaded${errors ? `, ${errors} failed` : ''}`, errors ? 'error' : 'success');
    },

    downloadFile(path) {
        const a = document.createElement('a');
        a.href = `api.php?action=download&path=${encodeURIComponent(path)}`;
        a.download = path.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    async deleteFile(path) {
        if (!confirm(`Delete "${path.split('/').pop()}"?`)) return;
        try {
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('path', path);
            const res = await fetch('api.php', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                this.toast('File deleted', 'success');
                if (this.selectedFile && this.selectedFile.path === path) this.closePreview();
                this.loadFiles();
            } else {
                this.toast('Delete failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Delete error: ' + e.message, 'error'); }
    },

    async deleteFolder(path) {
        if (!confirm(`Delete folder "${path.split('/').pop()}" and all its contents?`)) return;
        this.showLoading(true);
        try {
            const allPaths = await this.collectFolderFiles(path);
            if (allPaths.length > 0) {
                const formData = new FormData();
                formData.append('action', 'deleteBatch');
                formData.append('paths', JSON.stringify(allPaths));
                const res = await fetch('api.php', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    const failed = (data.results || []).filter(r => !r.success).length;
                    if (failed > 0) {
                        this.toast(`Deleted with ${failed} error(s)`, 'error');
                    } else {
                        this.toast('Folder deleted', 'success');
                    }
                } else {
                    this.toast('Delete failed: ' + (data.error || ''), 'error');
                }
            } else {
                this.toast('Folder deleted', 'success');
            }
            this.loadFiles();
        } catch (e) {
            this.toast('Delete error: ' + e.message, 'error');
        }
        this.showLoading(false);
    },

    async collectFolderFiles(path) {
        let allPaths = [];
        try {
            const res = await fetch(`api.php?action=list&prefix=${encodeURIComponent(path)}`);
            if (!res.ok) return allPaths;
            const data = await res.json();
            if (data.success) {
                for (const file of data.files) {
                    allPaths.push(file.path);
                }
                for (const folder of data.folders) {
                    const subPaths = await this.collectFolderFiles(folder.path);
                    allPaths = allPaths.concat(subPaths);
                }
            }
        } catch (e) {
            // Continue with what we have
        }
        return allPaths;
    },

    showRenameModal(path, currentName) {
        this.showModal('Rename', currentName, (newName) => {
            if (newName && newName !== currentName) {
                const dir = path.substring(0, path.lastIndexOf('/'));
                const newPath = dir ? dir + '/' + newName : newName;
                this.renameFile(path, newPath);
            }
        });
    },

    async renameFile(oldPath, newPath) {
        try {
            const formData = new FormData();
            formData.append('action', 'rename');
            formData.append('oldPath', oldPath);
            formData.append('newPath', newPath);
            const res = await fetch('api.php', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                this.toast('Renamed', 'success');
                this.loadFiles();
                if (this.selectedFile && this.selectedFile.path === oldPath) this.closePreview();
            } else {
                this.toast('Rename failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    showRenameFolderModal(path, currentName) {
        this.showModal('Rename Folder', currentName, async (newName) => {
            if (!newName || newName === currentName) return;
            this.showLoading(true);
            try {
                const allFiles = await this.collectFolderFiles(path);
                const dir = path.substring(0, path.lastIndexOf('/'));
                const newFolderPath = dir ? dir + '/' + newName : newName;

                for (const filePath of allFiles) {
                    const newFilePath = filePath.replace(path, newFolderPath);
                    const fd = new FormData();
                    fd.append('action', 'rename');
                    fd.append('oldPath', filePath);
                    fd.append('newPath', newFilePath);
                    await fetch('api.php', { method: 'POST', body: fd });
                }

                this.toast('Folder renamed', 'success');
                this.loadFiles();
            } catch (e) {
                this.toast('Rename failed: ' + e.message, 'error');
            }
            this.showLoading(false);
        });
    },

    showNewFolderModal() {
        this.showModal('New Folder', '', (name) => { if (name) this.createFolder(name); });
    },

    async createFolder(name) {
        try {
            const formData = new FormData();
            formData.append('action', 'createFolder');
            formData.append('prefix', this.currentPath);
            formData.append('folderName', name);
            const res = await fetch('api.php', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) { this.toast('Folder created', 'success'); this.loadFiles(); }
            else this.toast('Failed: ' + (data.error || ''), 'error');
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    copyPublicUrl(path) {
        const url = this.getPublicUrl(path);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                this.toast('Link copied', 'success');
            }).catch(() => {
                this.fallbackCopy(url);
            });
        } else {
            this.fallbackCopy(url);
        }
    },

    fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            this.toast('Link copied', 'success');
        } catch (e) {
            this.toast('Failed to copy link', 'error');
        }
        document.body.removeChild(ta);
    },

    getPublicUrl(path) {
        const base = window.PYRA_CONFIG?.supabaseUrl || '';
        const bucket = window.PYRA_CONFIG?.bucket || '';
        return `${base}/storage/v1/object/public/${bucket}/${path}`;
    },

    // === Context Menu ===
    showContextMenu(e, type, item) {
        e.preventDefault();
        e.stopPropagation();
        const menu = document.getElementById('contextMenu');
        const fJson = this.escAttr(JSON.stringify(item));
        let html = '';

        if (type === 'folder') {
            html = `
                <div class="context-menu-item" onclick="App.navigateTo('${this.escAttr(item.path)}')">${this.icons.folder} Open</div>
                <div class="context-menu-sep"></div>
                <div class="context-menu-item" onclick="App.showRenameFolderModal('${this.escAttr(item.path)}', '${this.escAttr(item.name)}')">${this.icons.rename} Rename</div>
                <div class="context-menu-item danger" onclick="App.deleteFolder('${this.escAttr(item.path)}')">${this.icons.trash} Delete</div>
            `;
        } else {
            html = `
                <div class="context-menu-item" onclick="App.previewFile(${fJson})">${this.icons.eye} Preview</div>
                <div class="context-menu-item" onclick="App.downloadFile('${this.escAttr(item.path)}')">${this.icons.download} Download</div>
                <div class="context-menu-item" onclick="App.copyPublicUrl('${this.escAttr(item.path)}')">${this.icons.link} Copy Link</div>
            `;
            const ext = item.name.split('.').pop().toLowerCase();
            if (this.isEditable(ext, item.mimetype)) {
                html += `<div class="context-menu-item" onclick="App.previewFile(${fJson}); setTimeout(() => App.editFile(${fJson}), 300)">${this.icons.edit} Edit</div>`;
            }
            html += `
                <div class="context-menu-sep"></div>
                <div class="context-menu-item" onclick="App.showRenameModal('${this.escAttr(item.path)}', '${this.escAttr(item.name)}')">${this.icons.rename} Rename</div>
                <div class="context-menu-item danger" onclick="App.deleteFile('${this.escAttr(item.path)}')">${this.icons.trash} Delete</div>
            `;
        }

        menu.innerHTML = html;
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.classList.add('active');

        requestAnimationFrame(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) menu.style.left = (e.clientX - rect.width) + 'px';
            if (rect.bottom > window.innerHeight) menu.style.top = (e.clientY - rect.height) + 'px';
        });
    },

    // === Modal ===
    showModal(title, defaultValue, callback) {
        const overlay = document.getElementById('modalOverlay');
        document.getElementById('modalTitle').textContent = title;
        const input = document.getElementById('modalInput');
        input.value = defaultValue;
        overlay.classList.add('active');

        if (this._modalAbort) this._modalAbort.abort();
        this._modalAbort = new AbortController();
        const signal = this._modalAbort.signal;

        setTimeout(() => {
            input.focus();
            const dotIndex = defaultValue.lastIndexOf('.');
            if (dotIndex > 0) input.setSelectionRange(0, dotIndex);
            else input.select();
        }, 100);

        const confirmBtn = document.getElementById('modalConfirm');
        const cancelBtn = document.getElementById('modalCancel');

        const execute = () => { callback(input.value.trim()); this.closeModal(); };

        confirmBtn.addEventListener('click', execute, { signal });
        cancelBtn.addEventListener('click', () => this.closeModal(), { signal });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') execute(); }, { signal });
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.getElementById('modalInput').value = '';
        if (this._modalAbort) { this._modalAbort.abort(); this._modalAbort = null; }
    },

    // === Helpers ===
    isEditable(ext) {
        return FILE_TYPES.editable.includes(ext);
    },

    isTextType(ext, mimetype) {
        const mt = (mimetype || '').toLowerCase();
        return FILE_TYPES.allText.includes(ext) || mt.startsWith('text/') || mt === 'application/json' || mt === 'application/xml' || mt === 'application/javascript';
    },

    formatSize(bytes) {
        if (!bytes || bytes === 0) return '';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0, size = bytes;
        while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
        return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        if (diff < TIME.MINUTE) return 'Just now';
        if (diff < TIME.HOUR) return Math.floor(diff / TIME.MINUTE) + 'm ago';
        if (diff < TIME.DAY) return Math.floor(diff / TIME.HOUR) + 'h ago';
        if (diff < TIME.WEEK) return Math.floor(diff / TIME.DAY) + 'd ago';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    },

    escHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    escAttr(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    sanitizeUrl(url) {
        const decoded = url.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const trimmed = decoded.trim().toLowerCase();
        if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
            return '#';
        }
        return url.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    },

    toast(msg, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = '0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    // === Markdown Renderer ===
    renderMarkdown(text) {
        if (!text) return '';
        let html = text;

        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
            return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
        });

        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Headers
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

        // Formatting
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Checkboxes
        html = html.replace(/^- \[x\]\s+(.+)$/gm, '<li style="list-style:none"><input type="checkbox" checked disabled> $1</li>');
        html = html.replace(/^- \[ \]\s+(.+)$/gm, '<li style="list-style:none"><input type="checkbox" disabled> $1</li>');

        // Links & Images (with URL sanitization)
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, src) => {
            return `<img src="${this.sanitizeUrl(src)}" alt="${alt}" />`;
        });
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, href) => {
            return `<a href="${this.sanitizeUrl(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        });

        // Blockquotes
        html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

        // HR
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/^\*\*\*$/gm, '<hr>');

        // Lists
        html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => {
            if (!match.startsWith('<ul>')) return '<ul>' + match + '</ul>';
            return match;
        });
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

        // Tables
        html = html.replace(/^(\|.+\|)\n(\|[\s\-:]+\|)\n((?:\|.+\|\n?)+)/gm, (match, header, sep, tBody) => {
            const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
            const rows = tBody.trim().split('\n').map(row => {
                const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
        });

        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        if (!html.startsWith('<')) html = '<p>' + html + '</p>';

        // Cleanup
        html = html.replace(/<p>\s*<\/p>/g, '');
        html = html.replace(/<p>\s*(<(?:h[1-6]|pre|ul|ol|table|blockquote|hr))/g, '$1');
        html = html.replace(/(<\/(?:h[1-6]|pre|ul|ol|table|blockquote|hr)>)\s*<\/p>/g, '$1');

        return html;
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
