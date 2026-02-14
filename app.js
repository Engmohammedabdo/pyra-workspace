/**
 * Pyra Workspace - File Manager v3
 * Security hardening, performance improvements, enhanced UX
 * Auth, permissions, reviews, and user management
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
    user: window.PYRA_CONFIG?.user || null,
    permissions: window.PYRA_CONFIG?.user?.permissions || {},
    _notifCount: 0,
    _notifPollTimer: null,
    _deepSearchAbort: null,
    _currentView: localStorage.getItem('pyra-view') || 'list',

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
        sortDesc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
        bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
        activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
        restore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
        team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="9" r="1.5"/></svg>',
        shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    },

    init() {
        this.applyTheme();
        this.applyView();
        this.bindEvents();
        if (!window.PYRA_CONFIG?.auth) return;
        this.user = window.PYRA_CONFIG.user;
        this.permissions = window.PYRA_CONFIG.user?.permissions || {};
        this.initNotifications();
        if (this.user && this.user.role !== 'admin' && this.user.permissions?.allowed_paths) {
            const allowed = this.user.permissions.allowed_paths;
            if (Array.isArray(allowed) && allowed.length > 0 && allowed[0] !== '*') {
                this.loadFiles(allowed[0]);
                return;
            }
        }
        this.loadFiles('');
    },

    _debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    },

    // === Theme Toggle ===
    applyTheme() {
        const saved = localStorage.getItem('pyra-theme');
        const body = document.getElementById('bodyEl') || document.body;
        if (saved === 'pyramedia') {
            body.setAttribute('data-theme', 'pyramedia');
            document.querySelector('.theme-toggle')?.classList.add('active');
        } else {
            body.removeAttribute('data-theme');
            document.querySelector('.theme-toggle')?.classList.remove('active');
        }
    },

    toggleTheme() {
        const body = document.getElementById('bodyEl') || document.body;
        const current = body.getAttribute('data-theme');
        if (current === 'pyramedia') {
            body.removeAttribute('data-theme');
            localStorage.setItem('pyra-theme', 'default');
            document.querySelector('.theme-toggle')?.classList.remove('active');
        } else {
            body.setAttribute('data-theme', 'pyramedia');
            localStorage.setItem('pyra-theme', 'pyramedia');
            document.querySelector('.theme-toggle')?.classList.add('active');
        }
    },

    // === View Toggle ===
    applyView() {
        const view = this._currentView;
        const grid = document.getElementById('fileGrid');
        const header = document.querySelector('.file-list-header');
        if (!grid) return;
        if (view === 'grid') {
            grid.classList.add('grid-view');
            if (header) header.style.display = 'none';
        } else {
            grid.classList.remove('grid-view');
            if (header) header.style.display = '';
        }
        // Update toggle button states
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    },

    setView(view) {
        this._currentView = view;
        localStorage.setItem('pyra-view', view);
        this.applyView();
    },

    // === Auth Helpers ===
    canDo(permission) {
        if (this.isAdmin()) return true;
        return !!this.permissions[permission];
    },

    isAdmin() {
        return this.user?.role === 'admin';
    },

    async apiFetch(url, options) {
        const res = await fetch(url, options);
        if (res.status === 401) {
            location.reload();
            return res;
        }
        return res;
    },

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('loginBtn');
        const errorEl = document.getElementById('loginError');
        errorEl.textContent = '';
        btn.disabled = true;

        const remember = document.getElementById('rememberMe')?.checked || false;

        this.apiFetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', username, password, remember })
        }).then(res => res.json()).then(data => {
            if (data.success) {
                location.reload();
            } else {
                errorEl.textContent = data.error || 'Login failed';
                btn.disabled = false;
            }
        }).catch(err => {
            errorEl.textContent = 'Connection error: ' + err.message;
            btn.disabled = false;
        });

        return false;
    },

    handleLogout() {
        this.apiFetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' })
        }).then(() => {
            location.reload();
        }).catch(() => {
            location.reload();
        });
    },

    bindEvents() {
        document.getElementById('searchInput')?.addEventListener('input',
            this._debounce(() => this.renderFiles(), 200)
        );

        // Drag & drop - only if user can upload
        if (this.canDo('can_upload')) {
            let dragCounter = 0;
            document.body.addEventListener('dragenter', (e) => { e.preventDefault(); dragCounter++; document.getElementById('dropZone').classList.add('active'); });
            document.body.addEventListener('dragleave', (e) => { e.preventDefault(); dragCounter--; if (dragCounter === 0) document.getElementById('dropZone').classList.remove('active'); });
            document.body.addEventListener('dragover', (e) => e.preventDefault());
            document.body.addEventListener('drop', (e) => {
                e.preventDefault(); dragCounter = 0;
                document.getElementById('dropZone').classList.remove('active');
                if (e.dataTransfer.files.length > 0) this.uploadFiles(e.dataTransfer.files);
            });
        }

        document.addEventListener('click', () => document.getElementById('contextMenu').classList.remove('active'));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { this.closePreview(); this.closeModal(); document.getElementById('contextMenu').classList.remove('active'); }
            if (e.key === 'Delete' && this.selectedFile && !this.editMode) this.deleteFile(this.selectedFile.path);
            if (e.ctrlKey && e.key === 's' && this.editMode) { e.preventDefault(); this.saveFile(); }
            if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); this.goBack(); }
            if (e.ctrlKey && e.shiftKey && e.key === 'F') { e.preventDefault(); this.showDeepSearchModal(); }
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
            const res = await this.apiFetch(`api.php?action=list&prefix=${encodeURIComponent(this.currentPath)}`);
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
            html += `<span class="breadcrumb-sep">›</span>`;
            html += `<span class="breadcrumb-item ${i === parts.length - 1 ? 'active' : ''}" onclick="App.loadFiles('${this.escAttr(p)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> ${this.escHtml(part)}</span>`;
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
            // Staggered entrance animation
            el.querySelectorAll('.file-item').forEach((item, i) => {
                item.style.animationDelay = `${i * 0.03}s`;
                item.classList.add('animate-in');
            });
        }
        this.applyView();
    },

    renderFolderItem(f) {
        const fJson = this.escAttr(JSON.stringify(f));
        let deleteBtn = '';
        if (this.canDo('can_delete')) {
            deleteBtn = `<button class="file-action-btn delete" onclick="event.stopPropagation(); App.deleteFolder('${this.escAttr(f.path)}')" title="Delete">${this.icons.trash}</button>`;
        }
        return `<div class="file-item" onclick="App.navigateTo('${this.escAttr(f.path)}')" oncontextmenu="App.showContextMenu(event, 'folder', ${fJson})">
            <div class="file-icon folder">${this.icons.folder}</div>
            <div class="file-name">${this.escHtml(f.name)}</div>
            <div class="file-size"></div>
            <div class="file-date"></div>
            <div class="file-actions-col">
                ${deleteBtn}
            </div>
        </div>`;
    },

    renderFileItem(f) {
        const iconInfo = this.getFileIcon(f.name, f.mimetype);
        const selected = this.selectedFile && this.selectedFile.path === f.path ? 'selected' : '';
        const fJson = this.escAttr(JSON.stringify(f));

        let actionBtns = '';
        if (this.canDo('can_download')) {
            actionBtns += `<button class="file-action-btn" onclick="event.stopPropagation(); App.downloadFile('${this.escAttr(f.path)}')" title="Download">${this.icons.download}</button>`;
        }
        if (this.canDo('can_edit')) {
            actionBtns += `<button class="file-action-btn" onclick="event.stopPropagation(); App.showRenameModal('${this.escAttr(f.path)}', '${this.escAttr(f.name)}')" title="Rename">${this.icons.rename}</button>`;
        }
        if (this.canDo('can_delete')) {
            actionBtns += `<button class="file-action-btn delete" onclick="event.stopPropagation(); App.deleteFile('${this.escAttr(f.path)}')" title="Delete">${this.icons.trash}</button>`;
        }

        return `<div class="file-item ${selected}" onclick="App.previewFile(${fJson})" oncontextmenu="App.showContextMenu(event, 'file', ${fJson})">
            <div class="file-icon ${iconInfo.class}">${iconInfo.icon}</div>
            <div class="file-name">${this.escHtml(f.name)}</div>
            <div class="file-size">${this.formatSize(f.size)}</div>
            <div class="file-date">${this.formatDate(f.updated_at)}</div>
            <div class="file-actions-col">
                ${actionBtns}
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

        let actionsHtml = '';
        if (this.canDo('can_download')) {
            actionsHtml += `<button class="btn btn-sm btn-ghost" onclick="App.downloadFile('${this.escAttr(file.path)}')" title="Download">${this.icons.download} Download</button>`;
        }
        actionsHtml += `<button class="btn btn-sm btn-ghost" onclick="App.copyPublicUrl('${this.escAttr(file.path)}')" title="Copy Link">${this.icons.link}</button>`;
        if (this.canDo('can_download') || this.isAdmin()) {
            actionsHtml += `<button class="btn btn-sm btn-ghost" onclick="App.showShareModal('${this.escAttr(file.path)}', '${this.escAttr(file.name)}')" title="Share">${this.icons.share}</button>`;
        }
        if (this.canDo('can_edit') && this.isEditable(ext, mt)) {
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

        // Load reviews below preview content
        if (this._previewId === myId) {
            this.loadFileReviews(file.path);
        }
    },

    async previewMarkdown(file, body, previewId) {
        try {
            const res = await this.apiFetch(`api.php?action=content&path=${encodeURIComponent(file.path)}`);
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
            const res = await this.apiFetch(`api.php?action=content&path=${encodeURIComponent(file.path)}`);
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
            const res = await this.apiFetch(`api.php?action=proxy&path=${encodeURIComponent(file.path)}`);
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
        if (!this.canDo('can_edit')) {
            this.toast('You do not have permission to edit files', 'error');
            return;
        }
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
            const res = await this.apiFetch(`api.php?action=content&path=${encodeURIComponent(file.path)}`);
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
            const res = await this.apiFetch('api.php', { method: 'POST', body: formData });
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
                const res = await this.apiFetch('api.php', { method: 'POST', body: formData });
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
        const filename = path.split('/').pop();
        if (!confirm(`Move "${filename}" to trash?`)) return;
        try {
            const file = this.files.find(f => f.path === path);
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('path', path);
            if (file) {
                formData.append('fileSize', file.size || 0);
                formData.append('mimeType', file.mimetype || '');
            }
            const res = await this.apiFetch('api.php', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                this.toast('Moved to trash', 'success');
                if (this.selectedFile && this.selectedFile.path === path) this.closePreview();
                this.loadFiles();
            } else {
                this.toast('Delete failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Delete error: ' + e.message, 'error'); }
    },

    async deleteFolder(path) {
        const name = path.split('/').pop();
        if (!confirm(`Move folder "${name}" to trash?`)) return;
        this.showLoading(true);
        try {
            const allPaths = await this.collectFolderFiles(path);
            if (allPaths.length > 0) {
                const formData = new FormData();
                formData.append('action', 'deleteBatch');
                formData.append('paths', JSON.stringify(allPaths));
                const res = await this.apiFetch('api.php', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    const failed = (data.results || []).filter(r => !r.success).length;
                    if (failed > 0) {
                        this.toast(`Moved to trash with ${failed} error(s)`, 'error');
                    } else {
                        this.toast('Moved to trash', 'success');
                    }
                } else {
                    this.toast('Delete failed: ' + (data.error || ''), 'error');
                }
            } else {
                this.toast('Moved to trash', 'success');
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
            const res = await this.apiFetch(`api.php?action=list&prefix=${encodeURIComponent(path)}`);
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
            const res = await this.apiFetch('api.php', { method: 'POST', body: formData });
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
                    await this.apiFetch('api.php', { method: 'POST', body: fd });
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
            const res = await this.apiFetch('api.php', { method: 'POST', body: formData });
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
            html = `<div class="context-menu-item" onclick="App.navigateTo('${this.escAttr(item.path)}')">${this.icons.folder} Open</div>`;
            if (this.canDo('can_edit') || this.canDo('can_delete')) {
                html += `<div class="context-menu-sep"></div>`;
            }
            if (this.canDo('can_edit')) {
                html += `<div class="context-menu-item" onclick="App.showRenameFolderModal('${this.escAttr(item.path)}', '${this.escAttr(item.name)}')">${this.icons.rename} Rename</div>`;
            }
            if (this.canDo('can_delete')) {
                html += `<div class="context-menu-item danger" onclick="App.deleteFolder('${this.escAttr(item.path)}')">${this.icons.trash} Delete</div>`;
            }
            if (this.isAdmin()) {
                html += `<div class="context-menu-sep"></div>`;
                html += `<div class="context-menu-item" onclick="App.showFilePermPanel('${this.escAttr(item.path)}')">${this.icons.shield} Permissions</div>`;
            }
        } else {
            html = `<div class="context-menu-item" onclick="App.previewFile(${fJson})">${this.icons.eye} Preview</div>`;
            if (this.canDo('can_download')) {
                html += `<div class="context-menu-item" onclick="App.downloadFile('${this.escAttr(item.path)}')">${this.icons.download} Download</div>`;
            }
            html += `<div class="context-menu-item" onclick="App.copyPublicUrl('${this.escAttr(item.path)}')">${this.icons.link} Copy Link</div>`;
            if (this.canDo('can_download') || this.isAdmin()) {
                html += `<div class="context-menu-item" onclick="App.showShareModal('${this.escAttr(item.path)}', '${this.escAttr(item.name)}')">${this.icons.share} Share Link</div>`;
            }
            const ext = item.name.split('.').pop().toLowerCase();
            if (this.canDo('can_edit') && this.isEditable(ext, item.mimetype)) {
                html += `<div class="context-menu-item" onclick="App.previewFile(${fJson}); setTimeout(() => App.editFile(${fJson}), 300)">${this.icons.edit} Edit</div>`;
            }
            if (this.canDo('can_edit') || this.canDo('can_delete')) {
                html += `<div class="context-menu-sep"></div>`;
            }
            if (this.canDo('can_edit')) {
                html += `<div class="context-menu-item" onclick="App.showRenameModal('${this.escAttr(item.path)}', '${this.escAttr(item.name)}')">${this.icons.rename} Rename</div>`;
            }
            if (this.canDo('can_delete')) {
                html += `<div class="context-menu-item danger" onclick="App.deleteFile('${this.escAttr(item.path)}')">${this.icons.trash} Delete</div>`;
            }
            if (this.isAdmin()) {
                html += `<div class="context-menu-sep"></div>`;
                html += `<div class="context-menu-item" onclick="App.showFilePermPanel('${this.escAttr(item.path)}')">${this.icons.shield} Permissions</div>`;
            }
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

    // === Reviews ===
    async loadFileReviews(path) {
        try {
            const res = await this.apiFetch(`api.php?action=getReviews&path=${encodeURIComponent(path)}`);
            const data = await res.json();
            if (data.success) {
                const container = document.createElement('div');
                container.className = 'reviews-section';
                container.id = 'reviewsSection';
                const body = document.getElementById('previewBody');
                // Remove any existing reviews section
                const existing = document.getElementById('reviewsSection');
                if (existing) existing.remove();
                body.appendChild(container);
                this.renderReviews(container, data.reviews || [], path);
            }
        } catch (e) {
            // Silently fail - reviews are supplemental
        }
    },

    renderReviews(container, reviews, path) {
        let html = `<div class="reviews-header">
            <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Reviews <span class="reviews-count">${reviews.length}</span></h3>
        </div>`;

        if (reviews.length > 0) {
            reviews.forEach(r => {
                const isResolved = !!r.resolved;
                const isApproval = r.type === 'approval';
                const typeClass = isApproval ? 'approval' : 'comment';
                const dateStr = r.created_at ? this.formatDate(r.created_at) : '';

                html += `<div class="review-item ${typeClass}${isResolved ? ' resolved' : ''}">`;
                html += `<div class="review-meta">`;
                html += `<div class="review-meta-left">`;
                html += `<span class="review-author">${this.escHtml(r.display_name || r.username || 'Unknown')}</span>`;
                html += `<span class="review-type-badge ${typeClass}">${isApproval ? 'Approved' : 'Comment'}</span>`;
                if (isResolved) html += `<span class="review-resolved-badge">resolved</span>`;
                html += `</div>`;
                html += `<div class="review-meta-right">`;
                html += `<span class="review-date">${this.escHtml(dateStr)}</span>`;
                if (this.isAdmin()) {
                    html += `<div class="review-actions">`;
                    html += `<button class="btn btn-sm btn-ghost" onclick="App.toggleResolve('${this.escAttr(String(r.id))}', '${this.escAttr(path)}')">${isResolved ? 'Unresolve' : 'Resolve'}</button>`;
                    html += `<button class="btn btn-sm btn-ghost btn-danger" onclick="App.deleteReviewItem('${this.escAttr(String(r.id))}', '${this.escAttr(path)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`;
                    html += `</div>`;
                }
                html += `</div>`;
                html += `</div>`;
                if (r.text) {
                    html += `<div class="review-text">${this.escHtml(r.text)}</div>`;
                }
                html += `</div>`;
            });
        } else {
            html += `<div class="review-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" style="opacity:0.3;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>No reviews yet</div>`;
        }

        if (this.canDo('can_review') || this.isAdmin()) {
            html += `<div class="review-input-area">`;
            html += `<textarea id="reviewTextarea" class="review-textarea" placeholder="Write a comment..."></textarea>`;
            html += `<div class="review-submit-actions">`;
            html += `<button class="btn btn-sm btn-primary" onclick="App.submitComment('${this.escAttr(path)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Send Comment</button>`;
            html += `<button class="btn btn-sm btn-approve" onclick="App.approveFile('${this.escAttr(path)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Approve File</button>`;
            html += `</div>`;
            html += `</div>`;
        }

        container.innerHTML = html;
    },

    async submitComment(path) {
        const textarea = document.getElementById('reviewTextarea');
        if (!textarea) return;
        const text = textarea.value.trim();
        if (!text) {
            this.toast('Please enter a comment', 'error');
            return;
        }
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addReview', path, type: 'comment', text })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Comment added', 'success');
                this.loadFileReviews(path);
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) {
            this.toast('Error: ' + e.message, 'error');
        }
    },

    async approveFile(path) {
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addReview', path, type: 'approval', text: '' })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('File approved', 'success');
                this.loadFileReviews(path);
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) {
            this.toast('Error: ' + e.message, 'error');
        }
    },

    async toggleResolve(reviewId, path) {
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resolveReview', id: reviewId })
            });
            const data = await res.json();
            if (data.success) {
                this.loadFileReviews(path);
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) {
            this.toast('Error: ' + e.message, 'error');
        }
    },

    async deleteReviewItem(reviewId, path) {
        if (!confirm('Delete this review?')) return;
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteReview', id: reviewId })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Review deleted', 'success');
                this.loadFileReviews(path);
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) {
            this.toast('Error: ' + e.message, 'error');
        }
    },

    // === User Management ===
    // === User Management ===
    _ufFolders: [],
    _ufSelectedPaths: ['*'],

    // Role presets - default permissions per role
    _rolePresets: {
        admin: {
            can_upload: true, can_edit: true, can_delete: true,
            can_download: true, can_create_folder: true, can_review: true,
            allowed_paths: ['*']
        },
        employee: {
            can_upload: true, can_edit: true, can_delete: false,
            can_download: true, can_create_folder: true, can_review: true,
            allowed_paths: ['*']
        },
        client: {
            can_upload: false, can_edit: false, can_delete: false,
            can_download: true, can_create_folder: false, can_review: true,
            allowed_paths: []
        }
    },

    async showUsersPanel() {
        if (!this.isAdmin()) { this.toast('Admin access required', 'error'); return; }
        try {
            const res = await this.apiFetch('api.php?action=getUsers');
            const data = await res.json();
            if (!data.success) { this.toast('Failed to load users: ' + (data.error || ''), 'error'); return; }
            this._renderUsersPanel(data.users || []);
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    _renderUsersPanel(users) {
        const existing = document.getElementById('usersPanelOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'usersPanelOverlay';
        overlay.className = 'um-overlay';

        const permLabels = { can_upload: 'Upload', can_edit: 'Edit', can_delete: 'Delete', can_download: 'Download', can_create_folder: 'Folder', can_review: 'Review' };

        let tableRows = '';
        users.forEach(u => {
            const perms = u.permissions || {};
            const paths = Array.isArray(perms.allowed_paths) ? perms.allowed_paths : ['*'];
            const pathDisplay = paths.includes('*') ? 'All folders' : paths.join(', ');
            const uJson = this.escAttr(JSON.stringify(u));

            let permTags = '';
            for (const [key, label] of Object.entries(permLabels)) {
                permTags += `<span class="user-perm-tag ${perms[key] ? 'active' : ''}">${label}</span>`;
            }

            tableRows += `<tr>
                <td>${this.escHtml(u.username)}</td>
                <td>${this.escHtml(u.display_name || '')}</td>
                <td><span class="user-role-badge ${this.escAttr(u.role)}">${this.escHtml(u.role)}</span></td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${this.escAttr(pathDisplay)}">${this.escHtml(pathDisplay)}</td>
                <td><div class="user-perms-tags">${permTags}</div></td>
                <td><div class="user-actions">
                    <button class="btn btn-sm btn-ghost" onclick="App.showEditUserModal(${uJson})" title="Edit">${this.icons.edit}</button>
                    <button class="btn btn-sm btn-ghost" onclick="App.showChangePasswordModal('${this.escAttr(u.username)}')" title="Change Password">${this.icons.key}</button>
                    <button class="btn btn-sm btn-ghost" style="color:var(--danger);" onclick="App.deleteUserItem('${this.escAttr(u.username)}')" title="Delete">${this.icons.trash}</button>
                </div></td>
            </tr>`;
        });

        overlay.innerHTML = `
            <div class="users-panel">
                <div class="users-panel-header">
                    <h2>${this.icons.users} User Management</h2>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-sm btn-primary" onclick="App.showAddUserModal()">+ Add User</button>
                        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('usersPanelOverlay').remove()">${this.icons.close}</button>
                    </div>
                </div>
                <div class="users-panel-body">
                    <table class="users-table">
                        <thead><tr>
                            <th>Username</th><th>Display Name</th><th>Role</th><th>Paths</th><th>Permissions</th><th style="text-align:right">Actions</th>
                        </tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                    ${users.length === 0 ? '<div style="padding:40px;text-align:center;color:var(--text-muted);">No users found</div>' : ''}
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    },

    async _loadRootFolders() {
        try {
            const res = await this.apiFetch('api.php?action=list&prefix=');
            const data = await res.json();
            if (data.success) {
                this._ufFolders = data.folders || [];
            }
        } catch (e) { this._ufFolders = []; }
    },

    _checkSvg() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    },

    _renderFolderPicker(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const isAll = this._ufSelectedPaths.includes('*');

        let html = `<div class="folder-picker-item all-access ${isAll ? 'selected' : ''}" data-path="*">
            <span class="fp-check">${this._checkSvg()}</span>
            <span class="fp-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 8 16 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg></span>
            <span>All Folders (Full Access)</span>
        </div>`;

        if (this._ufFolders.length === 0) {
            html += '<div class="folder-picker-empty">No folders found. Create folders first.</div>';
        } else {
            this._ufFolders.forEach(f => {
                const selected = !isAll && this._ufSelectedPaths.includes(f.path);
                html += `<div class="folder-picker-item ${selected ? 'selected' : ''} ${isAll ? 'disabled' : ''}" data-path="${this.escAttr(f.path)}" ${isAll ? 'style="opacity:0.4;pointer-events:none;"' : ''}>
                    <span class="fp-check">${this._checkSvg()}</span>
                    <span class="fp-icon">${this.icons.folder}</span>
                    <span>${this.escHtml(f.name)}</span>
                </div>`;
            });
        }

        container.innerHTML = html;

        container.querySelectorAll('.folder-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                if (path === '*') {
                    this._ufSelectedPaths = ['*'];
                } else {
                    this._ufSelectedPaths = this._ufSelectedPaths.filter(p => p !== '*');
                    if (this._ufSelectedPaths.includes(path)) {
                        this._ufSelectedPaths = this._ufSelectedPaths.filter(p => p !== path);
                    } else {
                        this._ufSelectedPaths.push(path);
                    }
                    if (this._ufSelectedPaths.length === 0) this._ufSelectedPaths = ['*'];
                }
                this._renderFolderPicker(containerId);
            });
        });
    },

    _renderPermCheckboxes(containerId, perms) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const permDefs = [
            { key: 'can_upload', label: 'Upload', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
            { key: 'can_edit', label: 'Edit', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
            { key: 'can_delete', label: 'Delete', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' },
            { key: 'can_download', label: 'Download', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' },
            { key: 'can_create_folder', label: 'Create Folder', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>' },
            { key: 'can_review', label: 'Review', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
        ];

        let html = '';
        permDefs.forEach(p => {
            const checked = !!perms[p.key];
            html += `<label class="perm-checkbox ${checked ? 'checked' : ''}" data-key="${p.key}">
                <input type="checkbox" ${checked ? 'checked' : ''}>
                <span class="perm-icon">${this._checkSvg()}</span>
                <span>${p.label}</span>
            </label>`;
        });
        container.innerHTML = html;

        container.querySelectorAll('.perm-checkbox').forEach(label => {
            label.addEventListener('click', (e) => {
                e.preventDefault();
                const cb = label.querySelector('input[type="checkbox"]');
                cb.checked = !cb.checked;
                label.classList.toggle('checked', cb.checked);
            });
        });
    },

    _getFormPermissions() {
        const perms = {};
        document.querySelectorAll('#uf_perms_container .perm-checkbox').forEach(label => {
            perms[label.dataset.key] = label.querySelector('input').checked;
        });
        perms.allowed_paths = [...this._ufSelectedPaths];
        return perms;
    },

    _applyRolePreset(role) {
        const preset = this._rolePresets[role];
        if (!preset) return;
        this._ufSelectedPaths = [...preset.allowed_paths];
        this._renderFolderPicker('uf_folder_picker');
        this._renderPermCheckboxes('uf_perms_container', preset);
    },

    _userFormHtml(mode, user) {
        const isEdit = mode === 'edit';
        const currentRole = isEdit ? user.role : 'employee';
        const title = isEdit ? `Edit User: ${this.escHtml(user.username)}` : 'Add User';
        const submitLabel = isEdit ? 'Save Changes' : 'Add User';
        const submitFn = isEdit ? `App._submitEditUser('${this.escAttr(user.username)}')` : 'App._submitAddUser()';

        return `
            <div class="users-panel" style="width:520px;">
                <div class="users-panel-header">
                    <h2>${title}</h2>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('userFormOverlay').remove()">${this.icons.close}</button>
                </div>
                <div class="users-panel-body">
                    <div class="user-form">
                        <div class="user-form-row">
                            <div>
                                <label>Username</label>
                                <input type="text" id="uf_username" value="${isEdit ? this.escAttr(user.username) : ''}" ${isEdit ? 'readonly style="opacity:0.6;cursor:not-allowed;"' : 'placeholder="e.g. john"'} />
                            </div>
                            <div>
                                <label>Display Name</label>
                                <input type="text" id="uf_displayname" value="${isEdit ? this.escAttr(user.display_name || '') : ''}" placeholder="e.g. John Doe" />
                            </div>
                        </div>
                        ${!isEdit ? `<div>
                            <label>Password</label>
                            <input type="password" id="uf_password" placeholder="Min 6 characters" />
                        </div>` : ''}
                        <div>
                            <label>Role</label>
                            <select id="uf_role" onchange="App._applyRolePreset(this.value)">
                                <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Admin - Full access</option>
                                <option value="employee" ${currentRole === 'employee' ? 'selected' : ''}>Employee - Upload, edit, no delete</option>
                                <option value="client" ${currentRole === 'client' ? 'selected' : ''}>Client - View and download only</option>
                            </select>
                        </div>
                        <div class="uf-section-title">Folder Access</div>
                        <div class="folder-picker" id="uf_folder_picker"></div>
                        <div class="uf-section-title">Permissions</div>
                        <div class="permissions-grid" id="uf_perms_container"></div>
                        <div class="user-form-actions">
                            <button class="btn btn-sm" onclick="document.getElementById('userFormOverlay').remove()">Cancel</button>
                            <button class="btn btn-sm btn-primary" onclick="${submitFn}">${submitLabel}</button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async showAddUserModal() {
        const existing = document.getElementById('userFormOverlay');
        if (existing) existing.remove();

        const defaultRole = 'employee';
        const preset = this._rolePresets[defaultRole];
        this._ufSelectedPaths = [...preset.allowed_paths];
        await this._loadRootFolders();

        const overlay = document.createElement('div');
        overlay.id = 'userFormOverlay';
        overlay.className = 'um-overlay z-high';
        overlay.innerHTML = this._userFormHtml('add', null);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        this._renderFolderPicker('uf_folder_picker');
        this._renderPermCheckboxes('uf_perms_container', preset);
    },

    async _submitAddUser() {
        const username = document.getElementById('uf_username').value.trim();
        const display_name = document.getElementById('uf_displayname').value.trim();
        const password = document.getElementById('uf_password').value;
        const role = document.getElementById('uf_role').value;

        if (!username || !password || !display_name) {
            this.toast('Username, display name, and password are required', 'error');
            return;
        }
        if (password.length < 6) {
            this.toast('Password must be at least 6 characters', 'error');
            return;
        }

        const permissions = this._getFormPermissions();

        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addUser', username, password, role, display_name, permissions })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('User created successfully', 'success');
                document.getElementById('userFormOverlay')?.remove();
                this.showUsersPanel();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    async showEditUserModal(user) {
        const existing = document.getElementById('userFormOverlay');
        if (existing) existing.remove();

        const perms = user.permissions || {};
        this._ufSelectedPaths = Array.isArray(perms.allowed_paths) ? [...perms.allowed_paths] : ['*'];
        await this._loadRootFolders();

        const overlay = document.createElement('div');
        overlay.id = 'userFormOverlay';
        overlay.className = 'um-overlay z-high';
        overlay.innerHTML = this._userFormHtml('edit', user);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        this._renderFolderPicker('uf_folder_picker');
        this._renderPermCheckboxes('uf_perms_container', perms);
    },

    async _submitEditUser(username) {
        const display_name = document.getElementById('uf_displayname').value.trim();
        const role = document.getElementById('uf_role').value;
        const permissions = this._getFormPermissions();

        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updateUser', username, role, display_name, permissions })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('User updated', 'success');
                document.getElementById('userFormOverlay')?.remove();
                this.showUsersPanel();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    showChangePasswordModal(username) {
        const existing = document.getElementById('userFormOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'userFormOverlay';
        overlay.className = 'um-overlay z-high';

        overlay.innerHTML = `
            <div class="users-panel" style="width:400px;">
                <div class="users-panel-header">
                    <h2>${this.icons.key} Change Password</h2>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('userFormOverlay').remove()">${this.icons.close}</button>
                </div>
                <div class="users-panel-body">
                    <div class="user-form">
                        <p style="font-size:13px;color:var(--text-muted);">Changing password for <strong>${this.escHtml(username)}</strong></p>
                        <div>
                            <label>New Password</label>
                            <input type="password" id="uf_newpassword" placeholder="Min 6 characters" />
                        </div>
                        <div class="user-form-actions">
                            <button class="btn btn-sm" onclick="document.getElementById('userFormOverlay').remove()">Cancel</button>
                            <button class="btn btn-sm btn-primary" onclick="App._submitChangePassword('${this.escAttr(username)}')">Change Password</button>
                        </div>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    },

    async _submitChangePassword(username) {
        const password = document.getElementById('uf_newpassword').value;
        if (!password || password.length < 6) {
            this.toast('Password must be at least 6 characters', 'error');
            return;
        }
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'changePassword', username, password })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Password changed', 'success');
                document.getElementById('userFormOverlay')?.remove();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    async deleteUserItem(username) {
        if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteUser', username })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('User deleted', 'success');
                this.showUsersPanel();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    // === Teams / Groups Management ===

    async showTeamsPanel() {
        if (!this.isAdmin()) { this.toast('Admin access required', 'error'); return; }
        try {
            const res = await this.apiFetch('api.php?action=getTeams');
            const data = await res.json();
            if (!data.success) { this.toast('Failed to load teams: ' + (data.error || ''), 'error'); return; }
            this._renderTeamsPanel(data.teams || []);
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    _renderTeamsPanel(teams) {
        const existing = document.getElementById('teamsPanelOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'teamsPanelOverlay';
        overlay.className = 'um-overlay';

        let teamsHtml = '';
        if (teams.length === 0) {
            teamsHtml = '<div class="teams-empty">No teams yet. Create your first team to organize users into groups with shared permissions.</div>';
        } else {
            teams.forEach(t => {
                const perms = t.permissions || {};
                const paths = Array.isArray(perms.allowed_paths) ? perms.allowed_paths : [];
                const pathDisplay = paths.includes('*') ? 'All folders' : (paths.length > 0 ? paths.join(', ') : 'No folders');
                const members = t.members || [];
                const memberNames = members.map(m => m.username).join(', ') || 'No members';
                const tJson = this.escAttr(JSON.stringify(t));

                const permLabels = { can_upload: 'Upload', can_edit: 'Edit', can_delete: 'Delete', can_download: 'Download', can_create_folder: 'Folder', can_review: 'Review' };
                let permTags = '';
                for (const [key, label] of Object.entries(permLabels)) {
                    permTags += `<span class="user-perm-tag ${perms[key] ? 'active' : ''}">${label}</span>`;
                }

                teamsHtml += `
                <div class="team-card">
                    <div class="team-card-header">
                        <div class="team-card-info">
                            <h3 class="team-card-name">${this.icons.team} ${this.escHtml(t.name)}</h3>
                            ${t.description ? `<p class="team-card-desc">${this.escHtml(t.description)}</p>` : ''}
                        </div>
                        <div class="team-card-actions">
                            <button class="btn btn-sm btn-ghost" onclick="App.showEditTeamModal(${tJson})" title="Edit">${this.icons.edit}</button>
                            <button class="btn btn-sm btn-ghost" style="color:var(--danger);" onclick="App.deleteTeamItem('${this.escAttr(t.id)}','${this.escAttr(t.name)}')" title="Delete">${this.icons.trash}</button>
                        </div>
                    </div>
                    <div class="team-card-meta">
                        <div class="team-meta-item">
                            <span class="team-meta-label">Members (${members.length})</span>
                            <span class="team-meta-value">${this.escHtml(memberNames)}</span>
                        </div>
                        <div class="team-meta-item">
                            <span class="team-meta-label">Folder Access</span>
                            <span class="team-meta-value" title="${this.escAttr(pathDisplay)}">${this.escHtml(pathDisplay)}</span>
                        </div>
                    </div>
                    <div class="team-card-perms">
                        <div class="user-perms-tags">${permTags}</div>
                    </div>
                    <div class="team-card-footer">
                        <button class="btn btn-xs btn-ghost" onclick="App.showManageMembersModal('${this.escAttr(t.id)}', ${tJson})">${this.icons.users} Manage Members</button>
                        <button class="btn btn-xs btn-ghost" onclick="App.showFilePermissionsModal('${this.escAttr(t.id)}', 'team', '${this.escAttr(t.name)}')">${this.icons.shield} File Permissions</button>
                    </div>
                </div>`;
            });
        }

        overlay.innerHTML = `
            <div class="users-panel" style="width:720px;">
                <div class="users-panel-header">
                    <h2>${this.icons.team} Teams & Groups</h2>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-sm btn-primary" onclick="App.showCreateTeamModal()">+ New Team</button>
                        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('teamsPanelOverlay').remove()">${this.icons.close}</button>
                    </div>
                </div>
                <div class="users-panel-body">
                    <div class="teams-grid">${teamsHtml}</div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    },

    showCreateTeamModal() {
        this._showTeamFormModal('create', null);
    },

    showEditTeamModal(team) {
        this._showTeamFormModal('edit', team);
    },

    async _showTeamFormModal(mode, team) {
        const existing = document.getElementById('teamFormOverlay');
        if (existing) existing.remove();

        const isEdit = mode === 'edit';
        const perms = isEdit ? (team.permissions || {}) : this._rolePresets.employee;
        this._ufSelectedPaths = isEdit ? (Array.isArray(perms.allowed_paths) ? [...perms.allowed_paths] : ['*']) : ['*'];
        await this._loadRootFolders();

        const title = isEdit ? `Edit Team: ${this.escHtml(team.name)}` : 'Create Team';
        const submitLabel = isEdit ? 'Save Changes' : 'Create Team';
        const submitFn = isEdit ? `App._submitTeamForm('edit','${this.escAttr(team.id)}')` : `App._submitTeamForm('create','')`;

        const overlay = document.createElement('div');
        overlay.id = 'teamFormOverlay';
        overlay.className = 'um-overlay z-high';
        overlay.innerHTML = `
            <div class="users-panel" style="width:520px;">
                <div class="users-panel-header">
                    <h2>${title}</h2>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('teamFormOverlay').remove()">${this.icons.close}</button>
                </div>
                <div class="users-panel-body">
                    <div class="user-form">
                        <div>
                            <label>Team Name</label>
                            <input type="text" id="tf_name" value="${isEdit ? this.escAttr(team.name) : ''}" placeholder="e.g. Design Team" />
                        </div>
                        <div>
                            <label>Description</label>
                            <textarea id="tf_desc" rows="2" placeholder="Team description (optional)">${isEdit ? this.escHtml(team.description || '') : ''}</textarea>
                        </div>
                        <div class="uf-section-title">Folder Access</div>
                        <div class="folder-picker" id="tf_folder_picker"></div>
                        <div class="uf-section-title">Team Permissions</div>
                        <div class="permissions-grid" id="tf_perms_container"></div>
                        <div class="user-form-actions">
                            <button class="btn btn-sm" onclick="document.getElementById('teamFormOverlay').remove()">Cancel</button>
                            <button class="btn btn-sm btn-primary" onclick="${submitFn}">${submitLabel}</button>
                        </div>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        this._renderFolderPicker('tf_folder_picker');
        this._renderPermCheckboxes('tf_perms_container', perms);
    },

    _getTeamFormPermissions() {
        const perms = {};
        document.querySelectorAll('#tf_perms_container .perm-checkbox').forEach(label => {
            perms[label.dataset.key] = label.querySelector('input').checked;
        });
        perms.allowed_paths = [...this._ufSelectedPaths];
        return perms;
    },

    async _submitTeamForm(mode, teamId) {
        const name = document.getElementById('tf_name').value.trim();
        const description = document.getElementById('tf_desc').value.trim();
        const permissions = this._getTeamFormPermissions();

        if (!name) {
            this.toast('Team name is required', 'error');
            return;
        }

        const action = mode === 'edit' ? 'updateTeam' : 'createTeam';
        const body = mode === 'edit'
            ? { action, team_id: teamId, name, description, permissions }
            : { action, name, description, permissions };

        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                this.toast(mode === 'edit' ? 'Team updated' : 'Team created', 'success');
                document.getElementById('teamFormOverlay')?.remove();
                this.showTeamsPanel();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    async deleteTeamItem(teamId, teamName) {
        if (!confirm(`Delete team "${teamName}"? All members will be removed.`)) return;
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteTeam', team_id: teamId })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Team deleted', 'success');
                this.showTeamsPanel();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    async showManageMembersModal(teamId, team) {
        const existing = document.getElementById('teamMembersOverlay');
        if (existing) existing.remove();

        // Get current users list
        let allUsers = [];
        try {
            const res = await this.apiFetch('api.php?action=getUsers');
            const data = await res.json();
            if (data.success) allUsers = data.users || [];
        } catch (e) { /* ignore */ }

        const members = team.members || [];
        const memberUsernames = members.map(m => m.username);
        const availableUsers = allUsers.filter(u => !memberUsernames.includes(u.username));

        let membersHtml = '';
        if (members.length === 0) {
            membersHtml = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">No members yet</div>';
        } else {
            members.forEach(m => {
                const user = allUsers.find(u => u.username === m.username);
                const displayName = user ? user.display_name : m.username;
                const role = user ? user.role : '';
                membersHtml += `
                <div class="team-member-row">
                    <div class="team-member-info">
                        <span class="team-member-name">${this.escHtml(displayName)}</span>
                        <span class="team-member-username">@${this.escHtml(m.username)}</span>
                        ${role ? `<span class="user-role-badge ${role}">${role}</span>` : ''}
                    </div>
                    <button class="btn btn-xs btn-ghost" style="color:var(--danger);" onclick="App._removeTeamMember('${this.escAttr(teamId)}','${this.escAttr(m.username)}')">${this.icons.close}</button>
                </div>`;
            });
        }

        let addUserHtml = '';
        if (availableUsers.length > 0) {
            let options = availableUsers.map(u => `<option value="${this.escAttr(u.username)}">${this.escHtml(u.display_name)} (@${this.escHtml(u.username)})</option>`).join('');
            addUserHtml = `
            <div class="team-add-member">
                <select id="tm_add_user">${options}</select>
                <button class="btn btn-sm btn-primary" onclick="App._addTeamMember('${this.escAttr(teamId)}')">Add</button>
            </div>`;
        } else {
            addUserHtml = '<div style="padding:8px;text-align:center;color:var(--text-muted);font-size:12px;">All users are already members</div>';
        }

        const overlay = document.createElement('div');
        overlay.id = 'teamMembersOverlay';
        overlay.className = 'um-overlay z-high';
        overlay.innerHTML = `
            <div class="users-panel" style="width:440px;">
                <div class="users-panel-header">
                    <h2>${this.icons.users} ${this.escHtml(team.name)} - Members</h2>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('teamMembersOverlay').remove()">${this.icons.close}</button>
                </div>
                <div class="users-panel-body">
                    <div class="uf-section-title">Add Member</div>
                    ${addUserHtml}
                    <div class="uf-section-title" style="margin-top:16px;">Current Members (${members.length})</div>
                    <div class="team-members-list">${membersHtml}</div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    },

    async _addTeamMember(teamId) {
        const select = document.getElementById('tm_add_user');
        if (!select) return;
        const username = select.value;
        if (!username) return;

        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addTeamMember', team_id: teamId, username })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Member added', 'success');
                // Refresh both panels
                document.getElementById('teamMembersOverlay')?.remove();
                this.showTeamsPanel();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    async _removeTeamMember(teamId, username) {
        if (!confirm(`Remove ${username} from this team?`)) return;
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'removeTeamMember', team_id: teamId, username })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Member removed', 'success');
                document.getElementById('teamMembersOverlay')?.remove();
                this.showTeamsPanel();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    // === File-Level Permissions ===

    async showFilePermissionsModal(targetId, targetType, targetName) {
        const existing = document.getElementById('filePermOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'filePermOverlay';
        overlay.className = 'um-overlay z-high';
        overlay.innerHTML = `
            <div class="users-panel" style="width:600px;">
                <div class="users-panel-header">
                    <h2>${this.icons.shield} File Permissions - ${this.escHtml(targetName)}</h2>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('filePermOverlay').remove()">${this.icons.close}</button>
                </div>
                <div class="users-panel-body">
                    <div class="uf-section-title">Add File/Folder Permission</div>
                    <div class="fileperm-add-form">
                        <div class="user-form-row">
                            <div>
                                <label>File or Folder Path</label>
                                <input type="text" id="fperm_path" placeholder="e.g. projects/designs/" />
                            </div>
                            <div>
                                <label>Expires (optional)</label>
                                <input type="datetime-local" id="fperm_expires" />
                            </div>
                        </div>
                        <div class="uf-section-title">Permissions to Grant</div>
                        <div class="permissions-grid" id="fperm_perms_container"></div>
                        <div style="margin-top:10px;">
                            <button class="btn btn-sm btn-primary" onclick="App._submitFilePermission('${this.escAttr(targetId)}','${this.escAttr(targetType)}')">Grant Permission</button>
                        </div>
                    </div>
                    <div class="uf-section-title" style="margin-top:20px;">Active File Permissions</div>
                    <div id="fperm_list" class="fperm-list">
                        <div style="padding:16px;text-align:center;color:var(--text-muted);">Loading...</div>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        const defaultPerms = { can_upload: false, can_edit: false, can_delete: false, can_download: true, can_create_folder: false, can_review: true };
        this._renderPermCheckboxes('fperm_perms_container', defaultPerms);

        this._loadActiveFilePermissions(targetId, targetType);
    },

    async _loadActiveFilePermissions(targetId, targetType) {
        const listEl = document.getElementById('fperm_list');
        if (!listEl) return;

        // We need to query all file permissions and filter on client side for this target
        // Since we don't have a dedicated endpoint, we'll search by iterating
        // Let's use a simple approach: get all and filter
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getFilePermissions', file_path: '*' })
            });
            // This won't work since we need a different approach
            // Let's just show a note for now and load per-path
        } catch (e) { /* ignore */ }

        listEl.innerHTML = `<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:12px;">
            File permissions are shown per-file. Select a file in the file browser, then use the context menu to manage its permissions.
        </div>`;
    },

    async _submitFilePermission(targetId, targetType) {
        const filePath = document.getElementById('fperm_path')?.value.trim();
        const expiresInput = document.getElementById('fperm_expires')?.value;
        const expiresAt = expiresInput ? new Date(expiresInput).toISOString() : null;

        if (!filePath) {
            this.toast('File/folder path is required', 'error');
            return;
        }

        const perms = {};
        document.querySelectorAll('#fperm_perms_container .perm-checkbox').forEach(label => {
            perms[label.dataset.key] = label.querySelector('input').checked;
        });

        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'setFilePermission',
                    file_path: filePath,
                    target_type: targetType,
                    target_id: targetId,
                    permissions: perms,
                    expires_at: expiresAt
                })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Permission granted' + (expiresAt ? ' (temporary)' : ''), 'success');
                document.getElementById('fperm_path').value = '';
                document.getElementById('fperm_expires').value = '';
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    // File context menu file permissions (for admin)
    async showFilePermPanel(filePath) {
        if (!this.isAdmin()) return;
        const existing = document.getElementById('filePermDetailOverlay');
        if (existing) existing.remove();

        let permsData = [];
        try {
            const res = await this.apiFetch(`api.php?action=getFilePermissions&file_path=${encodeURIComponent(filePath)}`);
            const data = await res.json();
            if (data.success) permsData = data.permissions || [];
        } catch (e) { /* ignore */ }

        // Get teams and users for adding
        let allTeams = [], allUsers = [];
        try {
            const [tRes, uRes] = await Promise.all([
                this.apiFetch('api.php?action=getTeams'),
                this.apiFetch('api.php?action=getUsers')
            ]);
            const tData = await tRes.json();
            const uData = await uRes.json();
            if (tData.success) allTeams = tData.teams || [];
            if (uData.success) allUsers = uData.users || [];
        } catch (e) { /* ignore */ }

        let existingPermsHtml = '';
        if (permsData.length === 0) {
            existingPermsHtml = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:12px;">No file-specific permissions set</div>';
        } else {
            permsData.forEach(fp => {
                const fpPerms = fp.permissions || {};
                const permLabels = { can_upload: 'Upload', can_edit: 'Edit', can_delete: 'Delete', can_download: 'Download', can_create_folder: 'Folder', can_review: 'Review' };
                let tags = '';
                for (const [key, label] of Object.entries(permLabels)) {
                    if (fpPerms[key]) tags += `<span class="user-perm-tag active">${label}</span>`;
                }
                const isExpired = fp.expires_at && new Date(fp.expires_at) < new Date();
                const expiryText = fp.expires_at ? (isExpired ? '<span style="color:var(--danger);">Expired</span>' : `Expires: ${this.formatDate(fp.expires_at)}`) : 'Permanent';
                const targetLabel = fp.target_type === 'team' ? '(Team)' : '(User)';

                existingPermsHtml += `
                <div class="fperm-item ${isExpired ? 'expired' : ''}">
                    <div class="fperm-item-header">
                        <span class="fperm-target">${this.escHtml(fp.target_id)} ${targetLabel}</span>
                        <button class="btn btn-xs btn-ghost" style="color:var(--danger);" onclick="App._removeFilePerm('${this.escAttr(fp.id)}','${this.escAttr(filePath)}')">${this.icons.close}</button>
                    </div>
                    <div class="user-perms-tags" style="margin:4px 0;">${tags}</div>
                    <div class="fperm-expiry">${this.icons.clock} ${expiryText}</div>
                </div>`;
            });
        }

        // Build add form
        let targetOptions = '';
        allUsers.forEach(u => {
            targetOptions += `<option value="user:${this.escAttr(u.username)}">${this.escHtml(u.display_name)} (User)</option>`;
        });
        allTeams.forEach(t => {
            targetOptions += `<option value="team:${this.escAttr(t.id)}">${this.escHtml(t.name)} (Team)</option>`;
        });

        const overlay = document.createElement('div');
        overlay.id = 'filePermDetailOverlay';
        overlay.className = 'um-overlay z-high';
        overlay.innerHTML = `
            <div class="users-panel" style="width:500px;">
                <div class="users-panel-header">
                    <h2>${this.icons.shield} Permissions: ${this.escHtml(filePath.split('/').pop() || filePath)}</h2>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('filePermDetailOverlay').remove()">${this.icons.close}</button>
                </div>
                <div class="users-panel-body">
                    <div class="uf-section-title">Grant Access</div>
                    <div class="fileperm-add-form">
                        <div class="user-form-row">
                            <div>
                                <label>User or Team</label>
                                <select id="fpdtl_target">${targetOptions}</select>
                            </div>
                            <div>
                                <label>Expires (optional)</label>
                                <input type="datetime-local" id="fpdtl_expires" />
                            </div>
                        </div>
                        <div class="permissions-grid" id="fpdtl_perms"></div>
                        <div style="margin-top:8px;">
                            <button class="btn btn-sm btn-primary" onclick="App._submitFilePermDetail('${this.escAttr(filePath)}')">Grant</button>
                        </div>
                    </div>
                    <div class="uf-section-title" style="margin-top:16px;">Current Permissions (${permsData.length})</div>
                    <div class="fperm-list">${existingPermsHtml}</div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        const defaultPerms = { can_upload: false, can_edit: false, can_delete: false, can_download: true, can_create_folder: false, can_review: true };
        this._renderPermCheckboxes('fpdtl_perms', defaultPerms);
    },

    async _submitFilePermDetail(filePath) {
        const targetSelect = document.getElementById('fpdtl_target');
        const expiresInput = document.getElementById('fpdtl_expires')?.value;
        if (!targetSelect || !targetSelect.value) {
            this.toast('Select a user or team', 'error');
            return;
        }

        const [targetType, targetId] = targetSelect.value.split(':');
        const expiresAt = expiresInput ? new Date(expiresInput).toISOString() : null;

        const perms = {};
        document.querySelectorAll('#fpdtl_perms .perm-checkbox').forEach(label => {
            perms[label.dataset.key] = label.querySelector('input').checked;
        });

        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'setFilePermission',
                    file_path: filePath,
                    target_type: targetType,
                    target_id: targetId,
                    permissions: perms,
                    expires_at: expiresAt
                })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Permission granted', 'success');
                this.showFilePermPanel(filePath);
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    async _removeFilePerm(permId, filePath) {
        if (!confirm('Remove this permission?')) return;
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'removeFilePermission', perm_id: permId })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Permission removed', 'success');
                this.showFilePermPanel(filePath);
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    initNotifications() {
        this.updateNotifBadge();
        this._notifPollTimer = setInterval(() => this.updateNotifBadge(), 30000);
    },

    async updateNotifBadge() {
        try {
            const res = await this.apiFetch('api.php?action=getUnreadCount');
            const data = await res.json();
            if (data.success) {
                this._notifCount = data.count;
                const badge = document.getElementById('notifBadge');
                if (badge) {
                    badge.textContent = data.count;
                    badge.style.display = data.count > 0 ? 'flex' : 'none';
                }
            }
        } catch (e) { /* silent */ }
    },

    async showNotificationsPanel() {
        const existing = document.getElementById('notifDropdown');
        if (existing) { existing.remove(); return; }

        try {
            const res = await this.apiFetch('api.php?action=getNotifications&limit=50');
            const data = await res.json();
            if (!data.success) return;

            const notifs = data.notifications || [];
            const bell = document.getElementById('notifBell');
            const dropdown = document.createElement('div');
            dropdown.id = 'notifDropdown';
            dropdown.className = 'notif-dropdown';

            let itemsHtml = '';
            if (notifs.length === 0) {
                itemsHtml = '<div class="notif-empty">No notifications</div>';
            } else {
                notifs.forEach(n => {
                    const iconClass = n.type === 'approval' ? 'approval' : (n.type === 'upload' ? 'upload' : 'comment');
                    const icon = n.type === 'approval' ? this.icons.check : (n.type === 'upload' ? this.icons.upload : this.icons.comment);
                    const unread = !n.is_read ? 'unread' : '';
                    itemsHtml += `<div class="notif-item ${unread}" onclick="App.handleNotifClick('${this.escAttr(n.id)}', '${this.escAttr(n.target_path || '')}')">
                        <div class="notif-icon ${iconClass}">${icon}</div>
                        <div class="notif-content">
                            <div class="notif-title">${this.escHtml(n.title)}</div>
                            ${n.message ? `<div class="notif-message">${this.escHtml(n.message)}</div>` : ''}
                            <div class="notif-time">${this.escHtml(n.source_display_name || '')} &middot; ${this.formatDate(n.created_at)}</div>
                        </div>
                    </div>`;
                });
            }

            dropdown.innerHTML = `
                <div class="notif-dropdown-header">
                    <h3>${this.icons.bell} Notifications</h3>
                    <button class="btn btn-sm btn-ghost" onclick="App.markAllNotifsRead()">Mark all read</button>
                </div>
                <div class="notif-dropdown-body">${itemsHtml}</div>`;

            if (bell) {
                bell.parentElement.style.position = 'relative';
                bell.parentElement.appendChild(dropdown);
            } else {
                document.body.appendChild(dropdown);
            }

            setTimeout(() => {
                document.addEventListener('click', function closeNotif(e) {
                    if (!dropdown.contains(e.target) && e.target.id !== 'notifBell' && !e.target.closest('#notifBell')) {
                        dropdown.remove();
                        document.removeEventListener('click', closeNotif);
                    }
                });
            }, 100);
        } catch (e) { this.toast('Error loading notifications', 'error'); }
    },

    async handleNotifClick(notifId, targetPath) {
        await this.apiFetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'markNotifRead', id: notifId })
        });
        this.updateNotifBadge();
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) dropdown.remove();
        if (targetPath) {
            const parts = targetPath.split('/');
            const fileName = parts.pop();
            const folderPath = parts.join('/');
            // Navigate to the folder, then auto-preview the file
            await this.loadFiles(folderPath);
            // Find the file in loaded files and preview it
            const targetFile = this.files.find(f => f.name === fileName);
            if (targetFile) {
                this.previewFile(targetFile);
            }
        }
    },

    async markAllNotifsRead() {
        try {
            await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAllNotifsRead' })
            });
            this.updateNotifBadge();
            const dropdown = document.getElementById('notifDropdown');
            if (dropdown) dropdown.remove();
            this.toast('All notifications marked as read', 'success');
        } catch (e) { this.toast('Error', 'error'); }
    },

    async showActivityPanel() {
        if (!this.isAdmin()) { this.toast('Admin access required', 'error'); return; }
        try {
            const res = await this.apiFetch('api.php?action=getActivityLog&limit=100');
            const data = await res.json();
            if (!data.success) { this.toast('Failed to load activity log', 'error'); return; }
            this._renderActivityPanel(data.logs || []);
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    _renderActivityPanel(logs) {
        const existing = document.getElementById('activityPanelOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'activityPanelOverlay';
        overlay.className = 'um-overlay';

        const actionTypes = ['upload', 'delete', 'rename', 'create_folder', 'save_file', 'login', 'logout', 'user_created', 'user_updated', 'user_deleted', 'password_changed', 'review_added', 'review_deleted', 'trash_restore', 'trash_purge', 'share_created'];

        let rowsHtml = '';
        logs.forEach(log => {
            const details = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : (log.details || {});
            let detailStr = '';
            if (details.new_path) detailStr = '→ ' + details.new_path;
            else if (details.target_user) detailStr = details.target_user;
            else if (details.file_name) detailStr = details.file_name;

            rowsHtml += `<tr>
                <td>${this.formatDate(log.created_at)}</td>
                <td>${this.escHtml(log.display_name)}</td>
                <td><span class="action-badge ${log.action_type}">${this._formatActionType(log.action_type)}</span></td>
                <td class="activity-path" title="${this.escAttr(log.target_path || '')}">${this.escHtml(log.target_path || '-')}</td>
                <td style="font-size:11px;color:var(--text-muted);">${this.escHtml(detailStr)}</td>
            </tr>`;
        });

        overlay.innerHTML = `
            <div class="users-panel" style="width:900px;max-width:95%;">
                <div class="users-panel-header">
                    <h2>${this.icons.activity} Activity Log</h2>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('activityPanelOverlay').remove()">${this.icons.close}</button>
                </div>
                <div class="users-panel-body">
                    <div class="activity-filters">
                        <div>
                            <label>User</label>
                            <input type="text" id="actFilterUser" placeholder="Username..." style="width:120px;">
                        </div>
                        <div>
                            <label>Action</label>
                            <select id="actFilterAction" style="width:140px;">
                                <option value="">All</option>
                                ${actionTypes.map(t => `<option value="${t}">${t.replace(/_/g, ' ')}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label>From</label>
                            <input type="date" id="actFilterFrom" style="width:140px;">
                        </div>
                        <div>
                            <label>To</label>
                            <input type="date" id="actFilterTo" style="width:140px;">
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="App._applyActivityFilters()" style="align-self:flex-end;">Filter</button>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="activity-table">
                            <thead><tr>
                                <th>Time</th><th>User</th><th>Action</th><th>Path</th><th>Details</th>
                            </tr></thead>
                            <tbody id="activityTableBody">${rowsHtml}</tbody>
                        </table>
                    </div>
                    ${logs.length === 0 ? '<div style="padding:40px;text-align:center;color:var(--text-muted);">No activity logs found</div>' : ''}
                    ${logs.length >= 100 ? '<div class="activity-load-more"><button class="btn btn-sm" onclick="App._loadMoreActivity(' + logs.length + ')">Load more</button></div>' : ''}
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    },

    _formatActionType(type) {
        const labels = {
            upload: '↑ Upload', delete: '✕ Delete', rename: '↔ Rename', create_folder: '+ Folder',
            save_file: '✎ Save', login: '→ Login', logout: '← Logout', user_created: '+ User',
            user_updated: '✎ User', user_deleted: '✕ User', password_changed: '⚿ Password',
            review_added: '💬 Review', review_deleted: '✕ Review', trash_restore: '↩ Restore',
            trash_purge: '⌫ Purge', share_created: '🔗 Share'
        };
        return labels[type] || type;
    },

    async _applyActivityFilters() {
        const user = document.getElementById('actFilterUser')?.value.trim() || '';
        const action = document.getElementById('actFilterAction')?.value || '';
        const dateFrom = document.getElementById('actFilterFrom')?.value || '';
        const dateTo = document.getElementById('actFilterTo')?.value || '';

        let url = 'api.php?action=getActivityLog&limit=100';
        if (user) url += '&user=' + encodeURIComponent(user);
        if (action) url += '&actionType=' + encodeURIComponent(action);
        if (dateFrom) url += '&dateFrom=' + encodeURIComponent(dateFrom + 'T00:00:00');
        if (dateTo) url += '&dateTo=' + encodeURIComponent(dateTo + 'T23:59:59');

        try {
            const res = await this.apiFetch(url);
            const data = await res.json();
            if (data.success) {
                this._renderActivityPanel(data.logs || []);
            }
        } catch (e) { this.toast('Error loading logs', 'error'); }
    },

    async _loadMoreActivity(offset) {
        const user = document.getElementById('actFilterUser')?.value.trim() || '';
        const action = document.getElementById('actFilterAction')?.value || '';
        let url = `api.php?action=getActivityLog&limit=100&offset=${offset}`;
        if (user) url += '&user=' + encodeURIComponent(user);
        if (action) url += '&actionType=' + encodeURIComponent(action);

        try {
            const res = await this.apiFetch(url);
            const data = await res.json();
            if (data.success && data.logs.length > 0) {
                const tbody = document.getElementById('activityTableBody');
                if (tbody) {
                    data.logs.forEach(log => {
                        const details = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : (log.details || {});
                        let detailStr = '';
                        if (details.new_path) detailStr = '→ ' + details.new_path;
                        else if (details.target_user) detailStr = details.target_user;
                        else if (details.file_name) detailStr = details.file_name;

                        tbody.innerHTML += `<tr>
                            <td>${this.formatDate(log.created_at)}</td>
                            <td>${this.escHtml(log.display_name)}</td>
                            <td><span class="action-badge ${log.action_type}">${this._formatActionType(log.action_type)}</span></td>
                            <td class="activity-path" title="${this.escAttr(log.target_path || '')}">${this.escHtml(log.target_path || '-')}</td>
                            <td style="font-size:11px;color:var(--text-muted);">${this.escHtml(detailStr)}</td>
                        </tr>`;
                    });
                }
            }
        } catch (e) { /* silent */ }
    },

    async showTrashPanel() {
        if (!this.isAdmin()) { this.toast('Admin access required', 'error'); return; }
        try {
            const res = await this.apiFetch('api.php?action=listTrash');
            const data = await res.json();
            if (!data.success) { this.toast('Failed to load trash', 'error'); return; }
            this._renderTrashPanel(data.items || []);
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    _renderTrashPanel(items) {
        const existing = document.getElementById('trashPanelOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'trashPanelOverlay';
        overlay.className = 'um-overlay';

        let rowsHtml = '';
        items.forEach(item => {
            rowsHtml += `<tr>
                <td>
                    <div style="font-weight:500;">${this.escHtml(item.file_name)}</div>
                    <div class="trash-meta">${this.escHtml(item.original_path)}</div>
                </td>
                <td>${this.formatSize(item.file_size)}</td>
                <td>${this.escHtml(item.deleted_by_display)}</td>
                <td>${this.formatDate(item.deleted_at)}</td>
                <td>
                    <div class="trash-actions">
                        <button class="btn btn-sm btn-ghost btn-restore" onclick="App.restoreTrashItem('${this.escAttr(item.id)}')" title="Restore">${this.icons.restore} Restore</button>
                        <button class="btn btn-sm btn-ghost" style="color:var(--danger);" onclick="App.permanentDeleteTrashItem('${this.escAttr(item.id)}')" title="Delete Permanently">${this.icons.trash}</button>
                    </div>
                </td>
            </tr>`;
        });

        overlay.innerHTML = `
            <div class="users-panel" style="width:800px;max-width:95%;">
                <div class="users-panel-header">
                    <h2>${this.icons.trash} Trash</h2>
                    <div style="display:flex;gap:8px;">
                        ${items.length > 0 ? `<button class="btn btn-sm" style="color:var(--danger);border-color:var(--danger);" onclick="App.emptyTrashAll()">Empty Trash</button>` : ''}
                        ${items.length > 0 ? `<button class="btn btn-sm" onclick="App.purgeExpiredTrash()">Purge Expired</button>` : ''}
                        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('trashPanelOverlay').remove()">${this.icons.close}</button>
                    </div>
                </div>
                <div class="users-panel-body">
                    ${items.length > 0 ? `<div style="overflow-x:auto;">
                        <table class="users-table">
                            <thead><tr>
                                <th>File</th><th>Size</th><th>Deleted By</th><th>Deleted At</th><th style="text-align:right">Actions</th>
                            </tr></thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>` : '<div style="padding:40px;text-align:center;color:var(--text-muted);">Trash is empty</div>'}
                    <div style="padding:8px 0;font-size:11px;color:var(--text-muted);">Items are automatically purged after 30 days.</div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    },

    async restoreTrashItem(id) {
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restoreTrash', id })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('File restored', 'success');
                this.showTrashPanel();
                this.loadFiles();
            } else {
                this.toast('Restore failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    async permanentDeleteTrashItem(id) {
        if (!confirm('Permanently delete this file? This cannot be undone.')) return;
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'permanentDelete', id })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Permanently deleted', 'success');
                this.showTrashPanel();
            } else {
                this.toast('Delete failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    async emptyTrashAll() {
        if (!confirm('Permanently delete ALL trash items? This cannot be undone.')) return;
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'emptyTrash' })
            });
            const data = await res.json();
            if (data.success) {
                this.toast(`Trash emptied (${data.deleted} items)`, 'success');
                this.showTrashPanel();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    async purgeExpiredTrash() {
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'purgeExpired' })
            });
            const data = await res.json();
            if (data.success) {
                this.toast(`Purged ${data.purged} expired items`, 'success');
                this.showTrashPanel();
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    showDeepSearchModal() {
        const existing = document.getElementById('deepSearchOverlay');
        if (existing) { existing.remove(); return; }

        const overlay = document.createElement('div');
        overlay.id = 'deepSearchOverlay';
        overlay.className = 'um-overlay';

        overlay.innerHTML = `
            <div class="deep-search-panel">
                <div class="deep-search-input-wrap">
                    ${this.icons.search}
                    <input type="text" class="deep-search-input" id="deepSearchInput" placeholder="Search all files and folders..." autofocus>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('deepSearchOverlay').remove()">${this.icons.close}</button>
                </div>
                <div class="deep-search-results" id="deepSearchResults">
                    <div class="deep-search-status">Type at least 2 characters to search across all folders</div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        const input = document.getElementById('deepSearchInput');
        input.focus();

        let debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => this._performDeepSearch(input.value.trim()), 300);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') overlay.remove();
        });
    },

    async _performDeepSearch(query) {
        const resultsEl = document.getElementById('deepSearchResults');
        if (!resultsEl) return;

        if (query.length < 2) {
            resultsEl.innerHTML = '<div class="deep-search-status">Type at least 2 characters to search</div>';
            return;
        }

        if (this._deepSearchAbort) this._deepSearchAbort.abort();
        this._deepSearchAbort = new AbortController();

        resultsEl.innerHTML = '<div class="deep-search-loading"><div class="spinner"></div></div>';

        try {
            const res = await this.apiFetch(`api.php?action=deepSearch&query=${encodeURIComponent(query)}`, {
                signal: this._deepSearchAbort.signal
            });
            const data = await res.json();

            if (!data.success) {
                resultsEl.innerHTML = `<div class="deep-search-status">${this.escHtml(data.error || 'Search failed')}</div>`;
                return;
            }

            if (data.results.length === 0) {
                resultsEl.innerHTML = '<div class="deep-search-empty">No files found matching your search</div>';
                return;
            }

            let html = `<div class="deep-search-status">${data.results.length}${data.total > 200 ? '+' : ''} results found</div>`;
            data.results.forEach(f => {
                const iconInfo = this.getFileIcon(f.name, f.mimetype);
                const dir = f.path.substring(0, f.path.lastIndexOf('/')) || '/';
                html += `<div class="deep-search-item" onclick="App._navigateToSearchResult(${this.escAttr(JSON.stringify(f))})">
                    <div class="file-icon ${iconInfo.class}" style="width:28px;height:28px;">${iconInfo.icon}</div>
                    <div class="deep-search-item-info">
                        <div class="deep-search-item-name">${this.escHtml(f.name)}</div>
                        <div class="deep-search-item-path">${this.escHtml(dir)}</div>
                    </div>
                    <div class="deep-search-item-meta">${this.formatSize(f.size)}</div>
                </div>`;
            });
            resultsEl.innerHTML = html;
        } catch (e) {
            if (e.name === 'AbortError') return;
            resultsEl.innerHTML = '<div class="deep-search-status">Search error</div>';
        }
    },

    _navigateToSearchResult(file) {
        document.getElementById('deepSearchOverlay')?.remove();
        const dir = file.path.substring(0, file.path.lastIndexOf('/')) || '';
        this.loadFiles(dir).then(() => {
            setTimeout(() => this.previewFile(file), 300);
        });
    },

    async showShareModal(filePath, fileName) {
        const existing = document.getElementById('sharePanelOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'sharePanelOverlay';
        overlay.className = 'um-overlay z-high';

        overlay.innerHTML = `
            <div class="users-panel" style="width:500px;">
                <div class="users-panel-header">
                    <h2>${this.icons.share} Share Link</h2>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('sharePanelOverlay').remove()">${this.icons.close}</button>
                </div>
                <div class="users-panel-body">
                    <p style="font-size:13px;color:var(--text-muted);margin:0 0 12px;">Generate a temporary download link for <strong>${this.escHtml(fileName)}</strong></p>
                    <div class="share-config">
                        <div>
                            <label>Expires in</label>
                            <select id="shareExpiry">
                                <option value="1">1 hour</option>
                                <option value="6">6 hours</option>
                                <option value="24" selected>24 hours</option>
                                <option value="168">7 days</option>
                                <option value="720">30 days</option>
                            </select>
                        </div>
                        <div>
                            <label>Max downloads (0 = unlimited)</label>
                            <input type="number" id="shareMaxAccess" value="0" min="0" max="1000" style="width:100px;">
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="App.generateShareLink('${this.escAttr(filePath)}', '${this.escAttr(fileName)}')">Generate Link</button>
                    </div>
                    <div id="shareResult"></div>
                    <div id="shareExistingLinks"><div style="padding:12px 0;text-align:center;"><div class="spinner" style="width:20px;height:20px;"></div></div></div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        this.loadFileShareLinks(filePath);
    },

    async generateShareLink(path, fileName) {
        const expiry = parseInt(document.getElementById('shareExpiry')?.value || '24');
        const maxAccess = parseInt(document.getElementById('shareMaxAccess')?.value || '0');
        const resultEl = document.getElementById('shareResult');
        if (!resultEl) return;

        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'createShareLink', path, fileName, expiresInHours: expiry, maxAccess })
            });
            const data = await res.json();
            if (data.success) {
                const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
                const shareUrl = baseUrl + 'api.php?action=shareAccess&token=' + data.token;
                resultEl.innerHTML = `
                    <div class="share-link-result">
                        <div class="share-link-url" title="${this.escAttr(shareUrl)}">${this.escHtml(shareUrl)}</div>
                        <button class="btn btn-sm btn-primary" onclick="App.copyShareUrl('${this.escAttr(shareUrl)}')">Copy</button>
                    </div>`;
                this.toast('Share link created', 'success');
                this.loadFileShareLinks(path);
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    copyShareUrl(url) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => this.toast('Link copied', 'success')).catch(() => this.fallbackCopy(url));
        } else {
            this.fallbackCopy(url);
        }
    },

    async loadFileShareLinks(path) {
        const container = document.getElementById('shareExistingLinks');
        if (!container) return;

        try {
            const res = await this.apiFetch(`api.php?action=getShareLinks&path=${encodeURIComponent(path)}`);
            const data = await res.json();
            if (!data.success || !data.links || data.links.length === 0) {
                container.innerHTML = '';
                return;
            }

            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
            let html = '<div class="share-existing-title">Active Share Links</div>';
            data.links.forEach(link => {
                const expired = new Date(link.expires_at) < new Date();
                const url = baseUrl + 'api.php?action=shareAccess&token=' + link.token;
                html += `<div class="share-link-item ${expired ? 'share-link-expired' : ''}">
                    <div class="share-link-info">
                        <div style="font-size:12px;font-family:var(--font-mono);color:var(--accent);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;" onclick="App.copyShareUrl('${this.escAttr(url)}')" title="Click to copy">${this.escHtml(url.slice(-30))}</div>
                        <div style="display:flex;gap:8px;">
                            <span class="share-link-expires">${expired ? 'Expired' : 'Expires: ' + this.formatDate(link.expires_at)}</span>
                            <span class="share-link-count">Downloads: ${link.access_count}${link.max_access > 0 ? '/' + link.max_access : ''}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-ghost" style="color:var(--danger);" onclick="App.deactivateShareLink('${this.escAttr(link.id)}', '${this.escAttr(path)}')" title="Deactivate">${this.icons.close}</button>
                </div>`;
            });
            container.innerHTML = html;
        } catch (e) { container.innerHTML = ''; }
    },

    async deactivateShareLink(id, path) {
        if (!confirm('Deactivate this share link?')) return;
        try {
            const res = await this.apiFetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deactivateShareLink', id })
            });
            const data = await res.json();
            if (data.success) {
                this.toast('Share link deactivated', 'success');
                this.loadFileShareLinks(path);
            } else {
                this.toast('Failed: ' + (data.error || ''), 'error');
            }
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
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
