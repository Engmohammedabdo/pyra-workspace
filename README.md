# Pyra Workspace

A dynamic PHP file manager for **Supabase Self-Hosted Storage**. Browse, preview, upload, download, edit, and manage files directly from the browser.

![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?logo=php&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Storage-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **File Browsing** - Navigate folders with breadcrumb trail, back button, and keyboard shortcuts
- **File Preview** - Inline preview for images, video, audio, PDF, Markdown, DOCX, code, and text files
- **DOCX Support** - Word documents rendered as HTML using mammoth.js
- **Markdown Rendering** - Full Markdown preview with syntax highlighting
- **RTL / Arabic Support** - Auto-detects Arabic text and switches to RTL layout
- **Upload** - Drag & drop or button upload with progress indicator, multi-file support
- **Download** - Download any file directly to your computer
- **Edit** - Edit text-based files (Markdown, JSON, YAML, code, etc.) with Ctrl+S save
- **Rename** - Rename files and folders inline
- **Delete** - Delete files and folders (recursive)
- **Create Folders** - Create new folders in any location
- **Copy Public URL** - Copy the public Supabase URL for any file
- **Search** - Instant search/filter within the current directory
- **Context Menu** - Right-click context menu on files and folders
- **Dark Theme** - Clean dark UI built with CSS custom properties

## Requirements

- PHP 8.0+ with cURL extension
- Apache (XAMPP, WAMP, etc.) or any PHP web server
- Supabase Self-Hosted instance with Storage enabled

## Installation

1. Clone this repository into your web server directory:

```bash
git clone https://github.com/Engmohammedabdo/pyra-workspace.git
```

2. Edit `config.php` with your Supabase credentials:

```php
define('SUPABASE_URL', 'https://your-supabase-url.com');
define('SUPABASE_SERVICE_KEY', 'your-service-role-key');
define('SUPABASE_BUCKET', 'your-bucket-name');
```

3. Open in browser: `http://localhost/pyra-workspace/`

## Project Structure

```
pyra-workspace/
├── index.php      # Main HTML page
├── api.php        # PHP API backend (Supabase Storage operations)
├── config.php     # Supabase connection configuration
├── app.js         # Frontend JavaScript (file manager logic)
├── style.css      # Stylesheet (dark theme, RTL support)
├── .gitignore
└── README.md
```

## API Endpoints

All API calls go through `api.php` with an `action` parameter:

| Action | Method | Description |
|--------|--------|-------------|
| `list` | GET | List files and folders in a directory |
| `upload` | POST | Upload one or more files |
| `download` | GET | Download a file |
| `delete` | POST | Delete a file |
| `rename` | POST | Move/rename a file |
| `content` | GET | Get text content of a file (JSON) |
| `save` | POST | Save/update text content of a file |
| `createFolder` | POST | Create a new folder |
| `proxy` | GET | Proxy binary file (used for DOCX preview) |
| `publicUrl` | GET | Get the public URL for a file |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + Left` | Go back to parent folder |
| `Ctrl + S` | Save file (in edit mode) |
| `Escape` | Close preview / modal |
| `Delete` | Delete selected file |

## Supported File Previews

| Type | Extensions |
|------|-----------|
| Images | jpg, png, gif, svg, webp, bmp, ico |
| Video | mp4, webm, mov |
| Audio | mp3, wav, ogg, flac, aac, m4a |
| Documents | docx (via mammoth.js), pdf |
| Markdown | md, markdown |
| Code | js, ts, py, php, html, css, json, xml, yaml, sql, and more |
| Text | txt, log, csv, ini, cfg, conf, env |

## Configuration

Edit `config.php` to set:

- `SUPABASE_URL` - Your Supabase instance URL
- `SUPABASE_SERVICE_KEY` - Service role key (full access)
- `SUPABASE_BUCKET` - Storage bucket name
- `MAX_UPLOAD_SIZE` - Maximum upload size in bytes (default: 500MB)

## Security Note

This application uses the Supabase **service role key** which has full access to storage. It is designed for personal/local use without authentication. **Do not expose this to the public internet** without adding authentication.

## License

MIT
