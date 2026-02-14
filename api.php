<?php
/**
 * API Handler for Supabase Storage operations
 * With Authentication, RBAC, Reviews, Trash, Activity Log, Notifications, Deep Search, Share Links
 */
require_once 'config.php';
require_once 'auth.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

function sanitizePath(string $path): string {
    $path = str_replace("\0", '', $path);
    $path = str_replace('\\', '/', $path);
    $parts = explode('/', $path);
    $safe = [];
    foreach ($parts as $part) {
        if ($part === '' || $part === '.' || $part === '..') continue;
        $safe[] = $part;
    }
    return implode('/', $safe);
}

function supabaseRequest(string $method, string $endpoint, ?array $body = null, bool $isRaw = false): array {
    $url = SUPABASE_URL . '/storage/v1' . $endpoint;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);

    $headers = [
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
    ];

    if (!$isRaw) {
        $headers[] = 'Content-Type: application/json';
    }

    switch (strtoupper($method)) {
        case 'POST':
            curl_setopt($ch, CURLOPT_POST, true);
            if ($body !== null) {
                if ($isRaw) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
                } else {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
                }
            }
            break;
        case 'PUT':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if ($body !== null) {
                if ($isRaw) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
                } else {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
                }
            }
            break;
        case 'DELETE':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
            if ($body !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
            break;
        case 'MOVE':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
            if ($body !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
            break;
    }

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        return ['error' => $error, 'httpCode' => 0];
    }

    return ['data' => json_decode($response, true), 'httpCode' => $httpCode, 'raw' => $response];
}

function listFiles(string $prefix = ''): array {
    $body = [
        'prefix' => $prefix,
        'limit' => 1000,
        'offset' => 0,
        'sortBy' => ['column' => 'name', 'order' => 'asc']
    ];

    $result = supabaseRequest('POST', '/object/list/' . SUPABASE_BUCKET, $body);

    if ($result['httpCode'] === 200) {
        $items = $result['data'];
        $folders = [];
        $files = [];

        foreach ($items as $item) {
            if ($item['id'] === null && $item['metadata'] === null) {
                $folders[] = [
                    'name' => $item['name'],
                    'type' => 'folder',
                    'path' => $prefix ? $prefix . '/' . $item['name'] : $item['name']
                ];
            } else {
                $files[] = [
                    'name' => $item['name'],
                    'type' => 'file',
                    'path' => $prefix ? $prefix . '/' . $item['name'] : $item['name'],
                    'id' => $item['id'],
                    'size' => $item['metadata']['size'] ?? 0,
                    'mimetype' => $item['metadata']['mimetype'] ?? 'application/octet-stream',
                    'updated_at' => $item['updated_at'] ?? '',
                    'created_at' => $item['created_at'] ?? ''
                ];
            }
        }

        return ['success' => true, 'folders' => $folders, 'files' => $files, 'prefix' => $prefix];
    }

    return ['success' => false, 'error' => $result['data']['message'] ?? 'Failed to list files'];
}

function uploadFile(string $prefix, array $file): array {
    $filePath = $prefix ? $prefix . '/' . $file['name'] : $file['name'];
    $endpoint = '/object/' . SUPABASE_BUCKET . '/' . rawurlencode($filePath);

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    $fileContent = file_get_contents($file['tmp_name']);

    $encodedPath = implode('/', array_map('rawurlencode', explode('/', $filePath)));
    $url = SUPABASE_URL . '/storage/v1/object/' . SUPABASE_BUCKET . '/' . $encodedPath;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fileContent);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'Content-Type: ' . $mimeType,
        'x-upsert: true',
        'Cache-Control: max-age=3600'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        return ['success' => false, 'error' => $error];
    }

    if ($httpCode === 200 || $httpCode === 201) {
        return ['success' => true, 'path' => $filePath];
    }

    $data = json_decode($response, true);
    return ['success' => false, 'error' => $data['message'] ?? 'Upload failed (HTTP ' . $httpCode . ')'];
}

function deleteFile(string $filePath): array {
    $encodedPath = implode('/', array_map('rawurlencode', explode('/', $filePath)));
    $url = SUPABASE_URL . '/storage/v1/object/' . SUPABASE_BUCKET . '/' . $encodedPath;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        return ['success' => true];
    }

    $data = json_decode($response, true);
    return ['success' => false, 'error' => $data['message'] ?? 'Delete failed'];
}

function moveToTrash(string $filePath, int $fileSize = 0, string $mimeType = 'application/octet-stream'): array {
    $fileName = basename($filePath);
    $trashPath = '.trash/' . time() . '_' . bin2hex(random_bytes(3)) . '_' . $fileName;

    $body = [
        'bucketId' => SUPABASE_BUCKET,
        'sourceKey' => $filePath,
        'destinationKey' => $trashPath
    ];
    $result = supabaseRequest('POST', '/object/move', $body);

    if ($result['httpCode'] === 200) {
        addTrashRecord([
            'original_path' => $filePath,
            'trash_path' => $trashPath,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'mime_type' => $mimeType
        ]);
        return ['success' => true];
    }
    return ['success' => false, 'error' => $result['data']['message'] ?? 'Failed to move to trash'];
}

function renameFile(string $oldPath, string $newPath): array {
    $body = [
        'bucketId' => SUPABASE_BUCKET,
        'sourceKey' => $oldPath,
        'destinationKey' => $newPath
    ];

    $result = supabaseRequest('POST', '/object/move', $body);

    if ($result['httpCode'] === 200) {
        updateReviewPaths($oldPath, $newPath);
        return ['success' => true];
    }

    return ['success' => false, 'error' => $result['data']['message'] ?? 'Rename failed'];
}

function getFileContent(string $filePath): array {
    $encodedPath = implode('/', array_map('rawurlencode', explode('/', $filePath)));
    $url = SUPABASE_URL . '/storage/v1/object/' . SUPABASE_BUCKET . '/' . $encodedPath;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($httpCode === 200) {
        return ['success' => true, 'content' => $response, 'contentType' => $contentType];
    }

    return ['success' => false, 'error' => 'Failed to get file content'];
}

function saveFileContent(string $filePath, string $content, string $mimeType = 'text/plain'): array {
    $encodedPath = implode('/', array_map('rawurlencode', explode('/', $filePath)));
    $url = SUPABASE_URL . '/storage/v1/object/' . SUPABASE_BUCKET . '/' . $encodedPath;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'Content-Type: ' . $mimeType,
        'x-upsert: true',
        'Cache-Control: max-age=3600'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 || $httpCode === 201) {
        return ['success' => true];
    }

    $data = json_decode($response, true);
    return ['success' => false, 'error' => $data['message'] ?? 'Save failed (HTTP ' . $httpCode . ')'];
}

function createFolder(string $prefix, string $folderName): array {
    $path = $prefix ? $prefix . '/' . $folderName . '/.keep' : $folderName . '/.keep';
    $url = SUPABASE_URL . '/storage/v1/object/' . SUPABASE_BUCKET . '/' . $path;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, '');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'Content-Type: text/plain',
        'x-upsert: true'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 || $httpCode === 201) {
        return ['success' => true];
    }

    $data = json_decode($response, true);
    return ['success' => false, 'error' => $data['message'] ?? 'Create folder failed'];
}

function getPublicUrl(string $filePath): string {
    return SUPABASE_URL . '/storage/v1/object/public/' . SUPABASE_BUCKET . '/' . $filePath;
}

function getSignedUrl(string $filePath): string {
    $body = [
        'expiresIn' => 3600
    ];
    $result = supabaseRequest('POST', '/object/sign/' . SUPABASE_BUCKET . '/' . $filePath, $body);
    if ($result['httpCode'] === 200 && isset($result['data']['signedURL'])) {
        return SUPABASE_URL . '/storage/v1' . $result['data']['signedURL'];
    }
    return getPublicUrl($filePath);
}

function recursiveListFiles(string $prefix = '', int $maxDepth = 10, int $currentDepth = 0): array {
    if ($currentDepth >= $maxDepth) return [];

    $allFiles = [];
    $body = [
        'prefix' => $prefix,
        'limit' => 1000,
        'offset' => 0,
        'sortBy' => ['column' => 'name', 'order' => 'asc']
    ];

    $result = supabaseRequest('POST', '/object/list/' . SUPABASE_BUCKET, $body);

    if ($result['httpCode'] === 200 && is_array($result['data'])) {
        foreach ($result['data'] as $item) {
            $itemPath = $prefix ? $prefix . '/' . $item['name'] : $item['name'];

            if ($item['name'] === '.trash' || $item['name'] === '.keep') continue;

            if ($item['id'] === null && $item['metadata'] === null) {
                $subFiles = recursiveListFiles($itemPath, $maxDepth, $currentDepth + 1);
                $allFiles = array_merge($allFiles, $subFiles);
            } else {
                $allFiles[] = [
                    'name' => $item['name'],
                    'path' => $itemPath,
                    'size' => $item['metadata']['size'] ?? 0,
                    'mimetype' => $item['metadata']['mimetype'] ?? 'application/octet-stream',
                    'updated_at' => $item['updated_at'] ?? '',
                    'created_at' => $item['created_at'] ?? ''
                ];
            }
        }
    }

    return $allFiles;
}

// Route API actions
$rawBody = file_get_contents('php://input');
$jsonBody = json_decode($rawBody, true);
if (!is_array($jsonBody)) $jsonBody = [];

$action = $_GET['action'] ?? $_POST['action'] ?? ($jsonBody['action'] ?? '');

// Actions that don't require authentication
$publicActions = ['login', 'logout', 'session', 'shareAccess'];

if (!in_array($action, $publicActions)) {
    requireAuth();
}

switch ($action) {

    // === Authentication ===

    case 'login':
        $input = $jsonBody;
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';
        if (!$username || !$password) {
            echo json_encode(['success' => false, 'error' => 'Username and password required']);
            break;
        }
        usleep(200000);
        $result = attemptLogin($username, $password);
        if ($result['success']) {
            logActivity('login', '', ['username' => $username]);
        }
        echo json_encode($result);
        break;

    case 'logout':
        logActivity('logout');
        logout();
        echo json_encode(['success' => true]);
        break;

    case 'session':
        if (isLoggedIn()) {
            echo json_encode(['success' => true, 'authenticated' => true, 'user' => sessionUserInfo()]);
        } else {
            echo json_encode(['success' => true, 'authenticated' => false]);
        }
        break;

    // === File Operations ===

    case 'list':
        $prefix = sanitizePath($_GET['prefix'] ?? '');
        if (!canAccessPath($prefix)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        $result = listFiles($prefix);
        if ($result['success']) {
            // Hide .trash folder from normal listing
            $result['folders'] = array_values(array_filter($result['folders'], function($f) {
                return $f['name'] !== '.trash';
            }));
            $result['files'] = array_values(array_filter($result['files'], function($f) {
                return strpos($f['path'], '.trash/') !== 0;
            }));
            // Filter for non-admin users
            if (!isAdmin()) {
                $result['folders'] = array_values(array_filter($result['folders'], function($f) {
                    return canAccessPath($f['path']);
                }));
                $result['files'] = array_values(array_filter($result['files'], function($f) {
                    return isPathDirectlyAllowed($f['path']);
                }));
            }
        }
        echo json_encode($result);
        break;

    case 'upload':
        if (!hasPermission('can_upload')) {
            echo json_encode(['success' => false, 'error' => 'Upload not permitted']);
            break;
        }
        if (!isset($_FILES['file'])) {
            echo json_encode(['success' => false, 'error' => 'No file provided']);
            break;
        }
        $prefix = sanitizePath($_POST['prefix'] ?? '');
        if (!canAccessPath($prefix)) {
            echo json_encode(['success' => false, 'error' => 'Access denied to this path']);
            break;
        }

        if (is_array($_FILES['file']['name'])) {
            $results = [];
            for ($i = 0; $i < count($_FILES['file']['name']); $i++) {
                $file = [
                    'name' => $_FILES['file']['name'][$i],
                    'tmp_name' => $_FILES['file']['tmp_name'][$i],
                    'type' => $_FILES['file']['type'][$i],
                    'size' => $_FILES['file']['size'][$i]
                ];
                $uploadResult = uploadFile($prefix, $file);
                if ($uploadResult['success']) {
                    logActivity('upload', $uploadResult['path'], ['file_name' => $file['name'], 'size' => $file['size']]);
                    // Notify users with folder access
                    $usersWithAccess = findUsersWithPathAccess($prefix);
                    foreach ($usersWithAccess as $recipient) {
                        createNotification($recipient, 'upload', 'New file uploaded: ' . $file['name'], '', $uploadResult['path']);
                    }
                }
                $results[] = $uploadResult;
            }
            echo json_encode(['success' => true, 'results' => $results]);
        } else {
            $uploadResult = uploadFile($prefix, $_FILES['file']);
            if ($uploadResult['success']) {
                logActivity('upload', $uploadResult['path'], ['file_name' => $_FILES['file']['name'], 'size' => $_FILES['file']['size']]);
                $usersWithAccess = findUsersWithPathAccess($prefix);
                foreach ($usersWithAccess as $recipient) {
                    createNotification($recipient, 'upload', 'New file uploaded: ' . $_FILES['file']['name'], '', $uploadResult['path']);
                }
            }
            echo json_encode($uploadResult);
        }
        break;

    case 'delete':
        if (!hasPermission('can_delete')) {
            echo json_encode(['success' => false, 'error' => 'Delete not permitted']);
            break;
        }
        $path = sanitizePath($_POST['path'] ?? '');
        $fileSize = (int)($_POST['fileSize'] ?? 0);
        $mimeType = $_POST['mimeType'] ?? 'application/octet-stream';
        if (!$path) {
            echo json_encode(['success' => false, 'error' => 'No path provided']);
            break;
        }
        if (!canAccessPath($path)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        $result = moveToTrash($path, $fileSize, $mimeType);
        if ($result['success']) {
            logActivity('delete', $path, ['moved_to_trash' => true]);
        }
        echo json_encode($result);
        break;

    case 'rename':
        if (!hasPermission('can_edit')) {
            echo json_encode(['success' => false, 'error' => 'Edit not permitted']);
            break;
        }
        $oldPath = sanitizePath($_POST['oldPath'] ?? '');
        $newPath = sanitizePath($_POST['newPath'] ?? '');
        if (!$oldPath || !$newPath) {
            echo json_encode(['success' => false, 'error' => 'Paths required']);
            break;
        }
        if (!canAccessPath($oldPath) || !canAccessPath($newPath)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        $result = renameFile($oldPath, $newPath);
        if ($result['success']) {
            logActivity('rename', $oldPath, ['new_path' => $newPath]);
        }
        echo json_encode($result);
        break;

    case 'content':
        $path = sanitizePath($_GET['path'] ?? '');
        if (!$path) {
            echo json_encode(['success' => false, 'error' => 'No path provided']);
            break;
        }
        if (!canAccessPath($path)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        $result = getFileContent($path);
        if ($result['success']) {
            echo json_encode(['success' => true, 'content' => $result['content'], 'contentType' => $result['contentType']]);
        } else {
            echo json_encode($result);
        }
        break;

    case 'save':
        if (!hasPermission('can_edit')) {
            echo json_encode(['success' => false, 'error' => 'Edit not permitted']);
            break;
        }
        $path = sanitizePath($_POST['path'] ?? '');
        $content = $_POST['content'] ?? '';
        $mimeType = $_POST['mimeType'] ?? 'text/plain';
        if (!$path) {
            echo json_encode(['success' => false, 'error' => 'No path provided']);
            break;
        }
        if (!canAccessPath($path)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        $result = saveFileContent($path, $content, $mimeType);
        if ($result['success']) {
            logActivity('save_file', $path);
        }
        echo json_encode($result);
        break;

    case 'createFolder':
        if (!hasPermission('can_create_folder')) {
            echo json_encode(['success' => false, 'error' => 'Folder creation not permitted']);
            break;
        }
        $prefix = sanitizePath($_POST['prefix'] ?? '');
        $folderName = sanitizePath($_POST['folderName'] ?? '');
        if (!$folderName) {
            echo json_encode(['success' => false, 'error' => 'Folder name required']);
            break;
        }
        if (!canAccessPath($prefix)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        $result = createFolder($prefix, $folderName);
        if ($result['success']) {
            logActivity('create_folder', $prefix ? $prefix . '/' . $folderName : $folderName);
        }
        echo json_encode($result);
        break;

    case 'proxy':
        $path = sanitizePath($_GET['path'] ?? '');
        if (!$path) {
            http_response_code(400);
            echo 'No path provided';
            break;
        }
        if (!canAccessPath($path)) {
            http_response_code(403);
            echo 'Access denied';
            exit;
        }
        $result = getFileContent($path);
        if ($result['success']) {
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $mimeMap = [
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'doc' => 'application/msword',
                'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            ];
            $mime = $mimeMap[$ext] ?? ($result['contentType'] ?? 'application/octet-stream');
            header_remove('Content-Type');
            header('Content-Type: ' . $mime);
            header('Content-Length: ' . strlen($result['content']));
            echo $result['content'];
        } else {
            http_response_code(404);
            echo 'File not found';
        }
        exit;

    case 'download':
        $path = sanitizePath($_GET['path'] ?? '');
        if (!$path) {
            http_response_code(400);
            echo 'No path provided';
            break;
        }
        if (!canAccessPath($path)) {
            http_response_code(403);
            echo 'Access denied';
            exit;
        }
        if (!hasPermission('can_download')) {
            http_response_code(403);
            echo 'Download not permitted';
            exit;
        }
        $result = getFileContent($path);
        if ($result['success']) {
            $filename = basename($path);
            $safeName = preg_replace('/[^\w\-. ]/', '_', $filename);
            header_remove('Content-Type');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $safeName . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
            header('Content-Length: ' . strlen($result['content']));
            echo $result['content'];
        } else {
            http_response_code(404);
            echo 'File not found';
        }
        exit;

    case 'publicUrl':
        $path = sanitizePath($_GET['path'] ?? '');
        if (!canAccessPath($path)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        echo json_encode(['success' => true, 'url' => getPublicUrl($path)]);
        break;

    case 'deleteBatch':
        if (!hasPermission('can_delete')) {
            echo json_encode(['success' => false, 'error' => 'Delete not permitted']);
            break;
        }
        $paths = json_decode($_POST['paths'] ?? '[]', true);
        if (!is_array($paths) || count($paths) === 0) {
            echo json_encode(['success' => false, 'error' => 'No paths provided']);
            break;
        }
        $results = [];
        foreach ($paths as $p) {
            $safePath = sanitizePath($p);
            if ($safePath && canAccessPath($safePath)) {
                $trashResult = moveToTrash($safePath);
                if ($trashResult['success']) {
                    logActivity('delete', $safePath, ['moved_to_trash' => true, 'batch' => true]);
                }
                $results[] = array_merge($trashResult, ['path' => $safePath]);
            }
        }
        echo json_encode(['success' => true, 'results' => $results]);
        break;

    // === Reviews ===

    case 'getReviews':
        $path = sanitizePath($_GET['path'] ?? '');
        if (!$path || !canAccessPath($path)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        $reviews = getFileReviews($path);
        echo json_encode(['success' => true, 'reviews' => $reviews]);
        break;

    case 'addReview':
        if (!hasPermission('can_review') && !isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Review not permitted']);
            break;
        }
        $input = $jsonBody;
        $path = sanitizePath($input['path'] ?? '');
        $type = $input['type'] ?? 'comment';
        $text = trim($input['text'] ?? '');

        if (!$path || !canAccessPath($path)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        if ($type === 'comment' && $text === '') {
            echo json_encode(['success' => false, 'error' => 'Comment text required']);
            break;
        }
        if (!in_array($type, ['comment', 'approval'])) {
            echo json_encode(['success' => false, 'error' => 'Invalid review type']);
            break;
        }

        $result = addReview(['file_path' => $path, 'type' => $type, 'text' => $text]);
        if ($result['success']) {
            logActivity('review_added', $path, ['type' => $type]);
            $fileName = basename($path);
            $notifTitle = $type === 'approval' ? 'File approved: ' . $fileName : 'New comment on ' . $fileName;
            $usersWithAccess = findUsersWithPathAccess(dirname($path));
            foreach ($usersWithAccess as $recipient) {
                createNotification($recipient, $type, $notifTitle, $text, $path);
            }
        }
        echo json_encode($result);
        break;

    case 'resolveReview':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $reviewId = $input['id'] ?? '';
        if (!$reviewId) {
            echo json_encode(['success' => false, 'error' => 'Review ID required']);
            break;
        }
        echo json_encode(toggleResolveReview($reviewId));
        break;

    case 'deleteReview':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $reviewId = $input['id'] ?? '';
        if (!$reviewId) {
            echo json_encode(['success' => false, 'error' => 'Review ID required']);
            break;
        }
        $result = deleteReview($reviewId);
        if ($result['success']) {
            logActivity('review_deleted', '', ['review_id' => $reviewId]);
        }
        echo json_encode($result);
        break;

    // === Trash Management (Admin only) ===

    case 'listTrash':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        echo json_encode(['success' => true, 'items' => getTrashItems()]);
        break;

    case 'restoreTrash':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $trashId = $input['id'] ?? '';
        if (!$trashId) {
            echo json_encode(['success' => false, 'error' => 'Trash item ID required']);
            break;
        }
        $trashRecord = getTrashRecord($trashId);
        if (!$trashRecord) {
            echo json_encode(['success' => false, 'error' => 'Trash item not found']);
            break;
        }
        $moveResult = supabaseRequest('POST', '/object/move', [
            'bucketId' => SUPABASE_BUCKET,
            'sourceKey' => $trashRecord['trash_path'],
            'destinationKey' => $trashRecord['original_path']
        ]);
        if ($moveResult['httpCode'] === 200) {
            deleteTrashRecord($trashId);
            logActivity('trash_restore', $trashRecord['original_path'], ['file_name' => $trashRecord['file_name']]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => $moveResult['data']['message'] ?? 'Failed to restore file']);
        }
        break;

    case 'permanentDelete':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $trashId = $input['id'] ?? '';
        if (!$trashId) {
            echo json_encode(['success' => false, 'error' => 'Trash item ID required']);
            break;
        }
        $trashRecord = getTrashRecord($trashId);
        if (!$trashRecord) {
            echo json_encode(['success' => false, 'error' => 'Trash item not found']);
            break;
        }
        deleteFile($trashRecord['trash_path']);
        deleteTrashRecord($trashId);
        logActivity('trash_purge', $trashRecord['original_path'], ['file_name' => $trashRecord['file_name'], 'permanent' => true]);
        echo json_encode(['success' => true]);
        break;

    case 'emptyTrash':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $items = getTrashItems();
        $deleted = 0;
        foreach ($items as $item) {
            deleteFile($item['trash_path']);
            deleteTrashRecord($item['id']);
            $deleted++;
        }
        logActivity('trash_purge', '', ['count' => $deleted, 'empty_all' => true]);
        echo json_encode(['success' => true, 'deleted' => $deleted]);
        break;

    case 'purgeExpired':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $expired = getExpiredTrashItems();
        $purged = 0;
        foreach ($expired as $item) {
            deleteFile($item['trash_path']);
            deleteTrashRecord($item['id']);
            $purged++;
        }
        logActivity('trash_purge', '', ['count' => $purged, 'expired' => true]);
        echo json_encode(['success' => true, 'purged' => $purged]);
        break;

    // === Activity Log (Admin only) ===

    case 'getActivityLog':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $limit = min((int)($_GET['limit'] ?? 100), 500);
        $offset = (int)($_GET['offset'] ?? 0);
        $filterUser = $_GET['user'] ?? null;
        $filterAction = $_GET['actionType'] ?? null;
        $filterDateFrom = $_GET['dateFrom'] ?? null;
        $filterDateTo = $_GET['dateTo'] ?? null;
        $logs = getActivityLog($limit, $offset, $filterUser, $filterAction, $filterDateFrom, $filterDateTo);
        echo json_encode(['success' => true, 'logs' => $logs]);
        break;

    // === Notifications ===

    case 'getNotifications':
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $unreadOnly = ($_GET['unreadOnly'] ?? 'false') === 'true';
        $notifs = getNotifications($_SESSION['user'], $limit, $unreadOnly);
        echo json_encode(['success' => true, 'notifications' => $notifs]);
        break;

    case 'getUnreadCount':
        $count = getUnreadNotificationCount($_SESSION['user']);
        echo json_encode(['success' => true, 'count' => $count]);
        break;

    case 'markNotifRead':
        $input = $jsonBody;
        $notifId = $input['id'] ?? '';
        if (!$notifId) {
            echo json_encode(['success' => false, 'error' => 'Notification ID required']);
            break;
        }
        echo json_encode(markNotificationRead($notifId));
        break;

    case 'markAllNotifsRead':
        echo json_encode(markAllNotificationsRead($_SESSION['user']));
        break;

    // === Deep Search ===

    case 'deepSearch':
        $query = trim($_GET['query'] ?? '');
        if (strlen($query) < 2) {
            echo json_encode(['success' => false, 'error' => 'Search query must be at least 2 characters']);
            break;
        }

        $allFiles = recursiveListFiles('');
        $queryLower = strtolower($query);

        $matched = array_filter($allFiles, function($file) use ($queryLower) {
            return strpos(strtolower($file['name']), $queryLower) !== false
                || strpos(strtolower($file['path']), $queryLower) !== false;
        });

        if (!isAdmin()) {
            $matched = array_filter($matched, function($file) {
                return isPathDirectlyAllowed($file['path']);
            });
        }

        $matched = array_values($matched);
        $matched = array_slice($matched, 0, 200);

        echo json_encode(['success' => true, 'results' => $matched, 'total' => count($matched)]);
        break;

    // === Share Links ===

    case 'createShareLink':
        if (!isAdmin() && !hasPermission('can_download')) {
            echo json_encode(['success' => false, 'error' => 'Not permitted']);
            break;
        }
        $input = $jsonBody;
        $path = sanitizePath($input['path'] ?? '');
        $fileName = $input['fileName'] ?? basename($path);
        $expiresInHours = (int)($input['expiresInHours'] ?? 24);
        $maxAccess = (int)($input['maxAccess'] ?? 0);
        if (!$path) {
            echo json_encode(['success' => false, 'error' => 'Path required']);
            break;
        }
        if (!canAccessPath($path)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        if ($expiresInHours < 1 || $expiresInHours > 720) {
            echo json_encode(['success' => false, 'error' => 'Expiry must be 1-720 hours']);
            break;
        }
        $result = createShareLink($path, $fileName, $expiresInHours, $maxAccess);
        if ($result['success']) {
            logActivity('share_created', $path, ['expires_in_hours' => $expiresInHours]);
        }
        echo json_encode($result);
        break;

    case 'getShareLinks':
        $path = sanitizePath($_GET['path'] ?? '');
        if (!$path || !canAccessPath($path)) {
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            break;
        }
        echo json_encode(['success' => true, 'links' => getShareLinksForFile($path)]);
        break;

    case 'deactivateShareLink':
        $input = $jsonBody;
        $shareId = $input['id'] ?? '';
        if (!$shareId) {
            echo json_encode(['success' => false, 'error' => 'Share link ID required']);
            break;
        }
        if (!isAdmin()) {
            $linkResult = dbRequest('GET', '/pyra_share_links?id=eq.' . rawurlencode($shareId) . '&limit=1');
            if (!$linkResult || $linkResult['httpCode'] !== 200 || empty($linkResult['data']) || $linkResult['data'][0]['created_by'] !== $_SESSION['user']) {
                echo json_encode(['success' => false, 'error' => 'Not permitted']);
                break;
            }
        }
        echo json_encode(deactivateShareLink($shareId));
        break;

    case 'shareAccess':
        $token = $_GET['token'] ?? '';
        if (!$token) {
            http_response_code(400);
            header_remove('Content-Type');
            header('Content-Type: text/html; charset=utf-8');
            echo '<h2>Invalid share link</h2>';
            exit;
        }
        $shareLink = getShareLinkByToken($token);
        if (!$shareLink) {
            http_response_code(404);
            header_remove('Content-Type');
            header('Content-Type: text/html; charset=utf-8');
            echo '<h2>Share link not found</h2>';
            exit;
        }
        if (!$shareLink['is_active']) {
            http_response_code(410);
            header_remove('Content-Type');
            header('Content-Type: text/html; charset=utf-8');
            echo '<h2>This share link has been deactivated</h2>';
            exit;
        }
        $expiresAt = new DateTime($shareLink['expires_at']);
        if ($expiresAt < new DateTime()) {
            http_response_code(410);
            header_remove('Content-Type');
            header('Content-Type: text/html; charset=utf-8');
            echo '<h2>This share link has expired</h2>';
            exit;
        }
        if ($shareLink['max_access'] > 0 && $shareLink['access_count'] >= $shareLink['max_access']) {
            http_response_code(410);
            header_remove('Content-Type');
            header('Content-Type: text/html; charset=utf-8');
            echo '<h2>This share link has reached its access limit</h2>';
            exit;
        }

        $result = getFileContent($shareLink['file_path']);
        if ($result['success']) {
            incrementShareAccess($shareLink['id']);
            $filename = $shareLink['file_name'];
            $safeName = preg_replace('/[^\w\-. ]/', '_', $filename);
            header_remove('Content-Type');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $safeName . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
            header('Content-Length: ' . strlen($result['content']));
            echo $result['content'];
        } else {
            http_response_code(404);
            header_remove('Content-Type');
            header('Content-Type: text/html; charset=utf-8');
            echo '<h2>File not found</h2>';
        }
        exit;

    // === User Management (Admin only) ===

    case 'getUsers':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        echo json_encode(['success' => true, 'users' => getAllUsers()]);
        break;

    case 'addUser':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? 'client';
        $displayName = trim($input['display_name'] ?? '');
        $permissions = $input['permissions'] ?? [];

        if (!$username || !$password || !$displayName) {
            echo json_encode(['success' => false, 'error' => 'Username, password, and display name required']);
            break;
        }
        if (!in_array($role, ['admin', 'employee', 'client'])) {
            echo json_encode(['success' => false, 'error' => 'Invalid role']);
            break;
        }
        $result = createUser($username, $password, $role, $displayName, $permissions);
        if ($result['success']) {
            logActivity('user_created', '', ['target_user' => $username, 'role' => $role]);
        }
        echo json_encode($result);
        break;

    case 'updateUser':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $username = trim($input['username'] ?? '');
        if (!$username) {
            echo json_encode(['success' => false, 'error' => 'Username required']);
            break;
        }
        $result = updateUser($username, $input);
        if ($result['success']) {
            logActivity('user_updated', '', ['target_user' => $username]);
        }
        echo json_encode($result);
        break;

    case 'deleteUser':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $username = trim($input['username'] ?? '');
        if (!$username) {
            echo json_encode(['success' => false, 'error' => 'Username required']);
            break;
        }
        $result = deleteUser($username);
        if ($result['success']) {
            logActivity('user_deleted', '', ['target_user' => $username]);
        }
        echo json_encode($result);
        break;

    case 'changePassword':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $username = trim($input['username'] ?? '');
        $newPassword = $input['password'] ?? '';
        if (!$username || !$newPassword) {
            echo json_encode(['success' => false, 'error' => 'Username and password required']);
            break;
        }
        $result = changeUserPassword($username, $newPassword);
        if ($result['success']) {
            logActivity('password_changed', '', ['target_user' => $username]);
        }
        echo json_encode($result);
        break;

    // === Teams / Groups (Admin only) ===

    case 'getTeams':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $teams = getAllTeams();
        // Attach member counts
        foreach ($teams as &$t) {
            $members = getTeamMembers($t['id']);
            $t['member_count'] = count($members);
            $t['members'] = $members;
        }
        echo json_encode(['success' => true, 'teams' => $teams]);
        break;

    case 'createTeam':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');
        $permissions = $input['permissions'] ?? [];

        if (!$name) {
            echo json_encode(['success' => false, 'error' => 'Team name is required']);
            break;
        }
        $result = createTeam($name, $description, $permissions);
        if ($result['success']) {
            logActivity('team_created', '', ['team_name' => $name]);
        }
        echo json_encode($result);
        break;

    case 'updateTeam':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $teamId = trim($input['team_id'] ?? '');
        if (!$teamId) {
            echo json_encode(['success' => false, 'error' => 'Team ID required']);
            break;
        }
        $result = updateTeam($teamId, $input);
        if ($result['success']) {
            logActivity('team_updated', '', ['team_id' => $teamId]);
        }
        echo json_encode($result);
        break;

    case 'deleteTeam':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $teamId = trim($input['team_id'] ?? '');
        if (!$teamId) {
            echo json_encode(['success' => false, 'error' => 'Team ID required']);
            break;
        }
        $result = deleteTeam($teamId);
        if ($result['success']) {
            logActivity('team_deleted', '', ['team_id' => $teamId]);
        }
        echo json_encode($result);
        break;

    case 'addTeamMember':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $teamId = trim($input['team_id'] ?? '');
        $username = trim($input['username'] ?? '');
        if (!$teamId || !$username) {
            echo json_encode(['success' => false, 'error' => 'Team ID and username required']);
            break;
        }
        // Verify user exists
        $userCheck = findUser($username);
        if (!$userCheck) {
            echo json_encode(['success' => false, 'error' => 'User not found']);
            break;
        }
        $result = addTeamMember($teamId, $username);
        if ($result['success']) {
            logActivity('team_member_added', '', ['team_id' => $teamId, 'member' => $username]);
            $team = getTeam($teamId);
            createNotification($username, 'team', 'Added to Team', 'You were added to team "' . ($team['name'] ?? '') . '"');
        }
        echo json_encode($result);
        break;

    case 'removeTeamMember':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $teamId = trim($input['team_id'] ?? '');
        $username = trim($input['username'] ?? '');
        if (!$teamId || !$username) {
            echo json_encode(['success' => false, 'error' => 'Team ID and username required']);
            break;
        }
        $result = removeTeamMember($teamId, $username);
        if ($result['success']) {
            logActivity('team_member_removed', '', ['team_id' => $teamId, 'member' => $username]);
        }
        echo json_encode($result);
        break;

    // === File-Level Permissions (Admin only) ===

    case 'setFilePermission':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $filePath = $input['file_path'] ?? '';
        $targetType = $input['target_type'] ?? '';
        $targetId = $input['target_id'] ?? '';
        $permissions = $input['permissions'] ?? [];
        $expiresAt = $input['expires_at'] ?? null;

        if (!$filePath || !$targetType || !$targetId) {
            echo json_encode(['success' => false, 'error' => 'file_path, target_type, and target_id required']);
            break;
        }
        if (!in_array($targetType, ['user', 'team'])) {
            echo json_encode(['success' => false, 'error' => 'target_type must be user or team']);
            break;
        }
        $result = setFilePermission($filePath, $targetType, $targetId, $permissions, $expiresAt);
        if ($result['success']) {
            logActivity('file_permission_set', $filePath, ['target_type' => $targetType, 'target_id' => $targetId, 'expires_at' => $expiresAt]);
            if ($targetType === 'user') {
                createNotification($targetId, 'permission', 'Access Granted', 'You were granted access to: ' . basename($filePath), $filePath);
            }
        }
        echo json_encode($result);
        break;

    case 'getFilePermissions':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $filePath = $_GET['file_path'] ?? ($jsonBody['file_path'] ?? '');
        if (!$filePath) {
            echo json_encode(['success' => false, 'error' => 'file_path required']);
            break;
        }
        echo json_encode(['success' => true, 'permissions' => getFilePermissions($filePath)]);
        break;

    case 'removeFilePermission':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $input = $jsonBody;
        $permId = trim($input['perm_id'] ?? '');
        if (!$permId) {
            echo json_encode(['success' => false, 'error' => 'Permission ID required']);
            break;
        }
        $result = removeFilePermission($permId);
        if ($result['success']) {
            logActivity('file_permission_removed', '', ['perm_id' => $permId]);
        }
        echo json_encode($result);
        break;

    case 'cleanExpiredPermissions':
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'error' => 'Admin only']);
            break;
        }
        $count = cleanExpiredFilePermissions();
        echo json_encode(['success' => true, 'cleaned' => $count]);
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
