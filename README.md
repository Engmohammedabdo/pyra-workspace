# Pyra Workspace

A full-featured PHP file manager for **Supabase Self-Hosted Storage** with team collaboration, role-based access control, and a modern dark luxury UI.

![PHP](https://img.shields.io/badge/PHP-8.0+-777BB4?logo=php&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Self--Hosted-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

> **Live**: [workspeace.pyramedia.info](http://workspeace.pyramedia.info/)

---

## Features

### Core - File Management
- **File Browsing** - Navigate folders with breadcrumb trail, back button, and keyboard shortcuts
- **File Preview** - Inline preview for images, video, audio, PDF, Markdown, DOCX, code, and text files
- **Upload** - Drag & drop or button upload with animated progress indicator, multi-file support
- **Download** - Download any file directly
- **Edit** - Edit text-based files (Markdown, JSON, YAML, code, etc.) with `Ctrl+S` save
- **Rename / Delete / Batch Delete** - Full file operations with confirmation
- **Create Folders** - Create new folders anywhere
- **Copy Public URL** - Copy the Supabase public URL for any file
- **Search** - Instant filter within the current directory
- **Deep Search** - Search across all files and folders (`Ctrl+Shift+F`)
- **Sort** - Sort by name, size, or modification date
- **Context Menu** - Right-click context menu on files and folders
- **DOCX Support** - Word documents rendered as HTML via mammoth.js
- **Markdown Rendering** - Full Markdown preview with syntax highlighting
- **RTL / Arabic Support** - Auto-detects Arabic text and switches to RTL layout

### Authentication & Access Control
- **Session-based Authentication** - Secure login with bcrypt password hashing
- **Role-based Access Control (RBAC)** - Three user roles: `admin` / `employee` / `client`
- **Path-based Permissions** - Restrict users to specific folders
- **Granular Permissions** - Control upload, edit, delete, download, create folder, and review per user
- **User Management Panel** - Admin UI to add, edit, delete users and change passwords

### Teams & Advanced Permissions
- **Teams / Groups** - Create teams with shared permissions and manage members
- **File-Level Permissions** - Grant access to individual files/folders for a user or team
- **Temporary Permissions** - Set expiry dates on permissions (auto-cleanup)
- **Enhanced Access Control** - `canAccessPathEnhanced()` checks user + team + file-level permissions
- **Context Menu Permissions** - Right-click any file/folder to manage permissions (admin)

### Collaboration
- **Review System** - Comments and approvals on files
- **Resolve Reviews** - Admin can mark reviews as resolved
- **Review Tracking** - Reviews follow files when renamed/moved
- **Notifications** - Real-time notification bell with polling (30s)
- **Smart Notifications** - Comments notify all admins + users with access; clicking opens the file directly
- **Notification Badge** - Pulsing red badge for unread notifications

### File Safety
- **Trash / Recycle Bin** - Soft delete with restore capability
- **Auto-Purge** - Trashed files auto-delete after 30 days
- **Activity Log** - Full audit trail of all operations with IP address tracking
- **Share Links** - Temporary links with expiry date and download limit

### UI / UX
- **Dual Theme** - Purple (default) and Pyramedia Orange theme with toggle switch
- **List / Grid View** - Toggle between list and grid layout (persisted in localStorage)
- **Colored File Icons** - Each file type has a unique color (folders=amber, images=pink, video=red, audio=purple, PDF=red, code=green, docs=blue, archives=orange)
- **Animations** - Staggered file entrance, preview slide-in, modal pop-in, folder hover bounce
- **Enhanced Login** - Floating particles, animated logo, "Remember Me" checkbox
- **User Avatar** - Initials-based avatar in the top bar
- **Enhanced Breadcrumbs** - Folder icons in each breadcrumb segment
- **Enhanced Drag & Drop** - Pulsing border, radial gradient, floating upload icon
- **Enhanced Empty State** - Large SVG icon with helpful text
- **Responsive Design** - Optimized for mobile and tablet screens
- **Glass Morphism** - Backdrop blur, grain texture overlay
- **Dark Luxury Aesthetic** - Refined dark theme with layered depth

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.0+ with cURL |
| Database | PostgreSQL (via Supabase PostgREST) |
| Storage | Supabase Self-Hosted Storage API |
| Frontend | Vanilla JavaScript (single `App` object) |
| Styling | CSS3 with custom properties, no frameworks |
| Fonts | Inter, JetBrains Mono, Noto Sans Arabic |
| Auth | Session-based with bcrypt |

---

## Requirements

- PHP 8.0+ with cURL extension
- Apache (XAMPP, WAMP, etc.) or any PHP web server
- Supabase Self-Hosted instance with Storage and PostgreSQL enabled
- Service role API key from Supabase

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Engmohammedabdo/pyra-workspace.git
cd pyra-workspace
```

### 2. Create configuration file

```bash
cp config.example.php config.php
```

Edit `config.php`:

```php
define('SUPABASE_URL', 'https://your-supabase-instance.com');
define('SUPABASE_SERVICE_KEY', 'your-service-role-key-here');
define('SUPABASE_BUCKET', 'your-bucket-name');
define('MAX_UPLOAD_SIZE', 524288000); // 500MB
```

### 3. Run database schema

Run the entire `schema.sql` file in your **Supabase SQL Editor**. This creates all 9 tables:

| Table | Purpose |
|-------|---------|
| `pyra_users` | Users with roles and permissions |
| `pyra_reviews` | File comments and approvals |
| `pyra_trash` | Soft-deleted files (recycle bin) |
| `pyra_activity_log` | Audit trail of all operations |
| `pyra_notifications` | User notifications |
| `pyra_share_links` | Temporary file sharing links |
| `pyra_teams` | Teams/groups with shared permissions |
| `pyra_team_members` | Team membership (user-team mapping) |
| `pyra_file_permissions` | File/folder level permissions with expiry |

### 4. Create first admin user

Open `http://localhost/pyra-workspace/setup.php` and follow the wizard, or create manually via SQL:

```sql
INSERT INTO pyra_users (username, password_hash, role, display_name, permissions)
VALUES ('admin', '$2y$10$...', 'admin', 'Administrator', '{"allowed_paths":["*"],"can_upload":true,"can_edit":true,"can_delete":true,"can_download":true,"can_create_folder":true,"can_review":true}');
```

### 5. Delete setup file and open

```bash
rm setup.php
```

Navigate to: `http://localhost/pyra-workspace/`

---

## Project Structure

```
pyra-workspace/
├── index.php              # HTML shell (login + app layout)           262 lines
├── api.php                # REST API (45 endpoints)                  1,355 lines
├── auth.php               # Auth, RBAC, teams, permissions            827 lines
├── app.js                 # Frontend controller (single App object)  2,982 lines
├── style.css              # Dark luxury theme + responsive           3,328 lines
├── schema.sql             # Database schema (9 tables + indexes)       186 lines
├── config.php             # Supabase credentials (gitignored)
├── config.example.php     # Config template
├── setup.php              # Setup wizard (delete after use)
├── ROADMAP.md             # Feature roadmap (Arabic)
└── README.md              # This file
```

**Total codebase**: ~8,950 lines

---

## Roles & Permissions

| Permission | Admin | Employee | Client |
|------------|:-----:|:--------:|:------:|
| View files | All folders | Assigned folders | Assigned folder |
| Upload | Yes | Yes | No |
| Edit | Yes | Yes | No |
| Delete | Yes | No | No |
| Create Folder | Yes | Yes | No |
| Download | Yes | Yes | Yes |
| Review/Comment | Yes | Yes | Yes |
| Manage Users | Yes | No | No |
| Manage Teams | Yes | No | No |
| Manage Permissions | Yes | No | No |

### Permissions JSON structure

```json
{
    "allowed_paths": ["*"],
    "can_upload": true,
    "can_edit": true,
    "can_delete": false,
    "can_download": true,
    "can_create_folder": true,
    "can_review": true
}
```

### Team Permissions

Teams inherit permissions applied to the group. When checking access, the system evaluates:
1. **User permissions** (from `pyra_users.permissions`)
2. **Team permissions** (from teams the user belongs to)
3. **File-level permissions** (from `pyra_file_permissions`, with expiry check)

---

## API Reference

All API calls go through `api.php` with an `action` parameter.

### Authentication (3 endpoints)

| Action | Method | Description |
|--------|--------|-------------|
| `login` | POST | Authenticate user (supports `remember` flag) |
| `logout` | POST | End session |
| `session` | GET | Check authentication status |

### File Operations (11 endpoints)

| Action | Method | Description |
|--------|--------|-------------|
| `list` | GET | List files and folders in a directory |
| `upload` | POST (multipart) | Upload one or more files |
| `download` | GET | Download a file |
| `delete` | POST | Delete a file (moves to trash) |
| `deleteBatch` | POST | Delete multiple files |
| `rename` | POST | Move/rename a file |
| `content` | GET | Get text content (JSON) |
| `save` | POST | Save/update text content |
| `createFolder` | POST | Create a new folder |
| `proxy` | GET | Proxy binary file (DOCX preview) |
| `publicUrl` | GET | Get public URL |

### Reviews (4 endpoints)

| Action | Method | Description |
|--------|--------|-------------|
| `getReviews` | GET | Get all reviews for a file |
| `addReview` | POST | Add comment or approval (notifies admins + users) |
| `resolveReview` | POST | Toggle resolved status (admin) |
| `deleteReview` | POST | Delete a review (admin) |

### Trash (5 endpoints)

| Action | Method | Description |
|--------|--------|-------------|
| `listTrash` | GET | List trashed items |
| `restoreTrash` | POST | Restore a trashed item |
| `permanentDelete` | POST | Permanently delete from trash |
| `emptyTrash` | POST | Empty all trash (admin) |
| `purgeExpired` | POST | Remove items past 30-day retention |

### Notifications (4 endpoints)

| Action | Method | Description |
|--------|--------|-------------|
| `getNotifications` | GET | Get user notifications |
| `getUnreadCount` | GET | Get unread notification count |
| `markNotifRead` | POST | Mark single notification as read |
| `markAllNotifsRead` | POST | Mark all notifications as read |

### Activity Log (1 endpoint)

| Action | Method | Description |
|--------|--------|-------------|
| `getActivityLog` | GET | Get activity log (filters: user, action, date range) |

### Search (1 endpoint)

| Action | Method | Description |
|--------|--------|-------------|
| `deepSearch` | GET | Search all files/folders recursively |

### Share Links (3 endpoints)

| Action | Method | Description |
|--------|--------|-------------|
| `createShareLink` | POST | Create temporary share link |
| `getShareLinks` | GET | Get share links for a file |
| `deactivateShareLink` | POST | Deactivate a share link |
| `shareAccess` | GET | Access shared file via token |

### User Management (5 endpoints, admin only)

| Action | Method | Description |
|--------|--------|-------------|
| `getUsers` | GET | List all users |
| `addUser` | POST | Create a new user |
| `updateUser` | POST | Update user details/permissions |
| `deleteUser` | POST | Delete a user |
| `changePassword` | POST | Change user password |

### Teams (6 endpoints, admin only)

| Action | Method | Description |
|--------|--------|-------------|
| `getTeams` | GET | List all teams |
| `createTeam` | POST | Create a team with permissions |
| `updateTeam` | POST | Update team details |
| `deleteTeam` | POST | Delete a team |
| `addTeamMember` | POST | Add user to team (notifies user) |
| `removeTeamMember` | POST | Remove user from team |

### File Permissions (4 endpoints, admin only)

| Action | Method | Description |
|--------|--------|-------------|
| `setFilePermission` | POST | Set permission on file/folder for user/team |
| `getFilePermissions` | GET | Get permissions for a file |
| `removeFilePermission` | POST | Remove a permission |
| `cleanExpiredPermissions` | POST | Remove all expired permissions |

**Total: 45 API endpoints**

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + Left` | Go back to parent folder |
| `Ctrl + S` | Save file (in edit mode) |
| `Ctrl + Shift + F` | Deep search all folders |
| `Escape` | Close preview / modal / context menu |
| `Delete` | Delete selected file |

---

## Supported File Previews

| Type | Extensions |
|------|-----------|
| Images | jpg, jpeg, png, gif, svg, webp, bmp, ico, tiff |
| Video | mp4, webm, mov, avi, mkv, flv, wmv |
| Audio | mp3, wav, ogg, flac, aac, m4a, wma |
| Documents | docx (via mammoth.js), pdf |
| Markdown | md, markdown |
| Code | js, ts, py, php, html, css, json, xml, yaml, yml, sh, bash, sql, rb, go, rs, java, c, cpp, h, jsx, tsx, vue, svelte |
| Text | txt, log, csv, ini, cfg, conf, env, toml, properties |

---

## UI Themes

The app includes two themes, toggled via the switch in the top bar:

| Theme | Accent Color | Description |
|-------|-------------|-------------|
| **Purple** (default) | `#8b5cf6` | Refined dark luxury with purple accents |
| **Pyramedia Orange** | `#F97316` | Warm orange theme matching Pyramedia branding |

Theme preference is saved in `localStorage` under key `pyra-theme`.

---

## Security

- **Password Hashing** - bcrypt via `password_hash()`
- **Session Security** - HTTPOnly and SameSite=Strict cookies
- **Path Sanitization** - All file paths sanitized to prevent path traversal
- **RBAC Enforcement** - Every API operation checks role and permissions
- **Path Filtering** - Non-admin users only see files within their allowed paths
- **Security Headers** - X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- **Brute Force Protection** - 200ms delay on login attempts
- **Service Role Key** - Stored server-side only, never exposed to client

> **Important**: This application uses the Supabase **service role key** which has full access. Always keep `config.php` out of version control.

---

## Database Schema

9 tables with 17 indexes. See `schema.sql` for full definitions.

```
pyra_users              - User accounts with RBAC and JSONB permissions
pyra_reviews            - File comments and approvals
pyra_trash              - Soft-deleted files with 30-day auto-purge
pyra_activity_log       - Audit trail with IP tracking
pyra_notifications      - User notification system
pyra_share_links        - Temporary file sharing with token auth
pyra_teams              - Teams/groups with shared JSONB permissions
pyra_team_members       - Team membership (M:N with cascade delete)
pyra_file_permissions   - File-level permissions with expiry dates
```

---

## License

MIT
