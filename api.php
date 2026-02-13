<?php
/**
 * API Handler for Supabase Storage operations
 */
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

function supabaseRequest($method, $endpoint, $body = null, $isRaw = false) {
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

function listFiles($prefix = '') {
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

function uploadFile($prefix, $file) {
    $filePath = $prefix ? $prefix . '/' . $file['name'] : $file['name'];
    $endpoint = '/object/' . SUPABASE_BUCKET . '/' . rawurlencode($filePath);

    // Detect mime type
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

function deleteFile($filePath) {
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

function renameFile($oldPath, $newPath) {
    $body = [
        'bucketId' => SUPABASE_BUCKET,
        'sourceKey' => $oldPath,
        'destinationKey' => $newPath
    ];

    $result = supabaseRequest('POST', '/object/move', $body);

    if ($result['httpCode'] === 200) {
        return ['success' => true];
    }

    return ['success' => false, 'error' => $result['data']['message'] ?? 'Rename failed'];
}

function getFileContent($filePath) {
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

function saveFileContent($filePath, $content, $mimeType = 'text/plain') {
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

function createFolder($prefix, $folderName) {
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

function getPublicUrl($filePath) {
    return SUPABASE_URL . '/storage/v1/object/public/' . SUPABASE_BUCKET . '/' . $filePath;
}

function getSignedUrl($filePath) {
    $body = [
        'expiresIn' => 3600
    ];
    $result = supabaseRequest('POST', '/object/sign/' . SUPABASE_BUCKET . '/' . $filePath, $body);
    if ($result['httpCode'] === 200 && isset($result['data']['signedURL'])) {
        return SUPABASE_URL . '/storage/v1' . $result['data']['signedURL'];
    }
    // Fallback to public URL
    return getPublicUrl($filePath);
}

// Route API actions
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'list':
        $prefix = $_GET['prefix'] ?? '';
        echo json_encode(listFiles($prefix));
        break;

    case 'upload':
        if (!isset($_FILES['file'])) {
            echo json_encode(['success' => false, 'error' => 'No file provided']);
            break;
        }
        $prefix = $_POST['prefix'] ?? '';

        // Handle multiple files
        if (is_array($_FILES['file']['name'])) {
            $results = [];
            for ($i = 0; $i < count($_FILES['file']['name']); $i++) {
                $file = [
                    'name' => $_FILES['file']['name'][$i],
                    'tmp_name' => $_FILES['file']['tmp_name'][$i],
                    'type' => $_FILES['file']['type'][$i],
                    'size' => $_FILES['file']['size'][$i]
                ];
                $results[] = uploadFile($prefix, $file);
            }
            echo json_encode(['success' => true, 'results' => $results]);
        } else {
            echo json_encode(uploadFile($prefix, $_FILES['file']));
        }
        break;

    case 'delete':
        $path = $_POST['path'] ?? '';
        if (!$path) {
            echo json_encode(['success' => false, 'error' => 'No path provided']);
            break;
        }
        echo json_encode(deleteFile($path));
        break;

    case 'rename':
        $oldPath = $_POST['oldPath'] ?? '';
        $newPath = $_POST['newPath'] ?? '';
        if (!$oldPath || !$newPath) {
            echo json_encode(['success' => false, 'error' => 'Paths required']);
            break;
        }
        echo json_encode(renameFile($oldPath, $newPath));
        break;

    case 'content':
        $path = $_GET['path'] ?? '';
        if (!$path) {
            echo json_encode(['success' => false, 'error' => 'No path provided']);
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
        $path = $_POST['path'] ?? '';
        $content = $_POST['content'] ?? '';
        $mimeType = $_POST['mimeType'] ?? 'text/plain';
        if (!$path) {
            echo json_encode(['success' => false, 'error' => 'No path provided']);
            break;
        }
        echo json_encode(saveFileContent($path, $content, $mimeType));
        break;

    case 'createFolder':
        $prefix = $_POST['prefix'] ?? '';
        $folderName = $_POST['folderName'] ?? '';
        if (!$folderName) {
            echo json_encode(['success' => false, 'error' => 'Folder name required']);
            break;
        }
        echo json_encode(createFolder($prefix, $folderName));
        break;

    case 'proxy':
        // Proxy raw binary file (for DOCX preview with mammoth.js)
        $path = $_GET['path'] ?? '';
        if (!$path) {
            http_response_code(400);
            echo 'No path provided';
            break;
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
            header('Access-Control-Allow-Origin: *');
            echo $result['content'];
        } else {
            http_response_code(404);
            echo 'File not found';
        }
        exit;

    case 'download':
        $path = $_GET['path'] ?? '';
        if (!$path) {
            http_response_code(400);
            echo 'No path provided';
            break;
        }
        $result = getFileContent($path);
        if ($result['success']) {
            $filename = basename($path);
            header_remove('Content-Type');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Length: ' . strlen($result['content']));
            echo $result['content'];
        } else {
            http_response_code(404);
            echo 'File not found';
        }
        exit;

    case 'publicUrl':
        $path = $_GET['path'] ?? '';
        echo json_encode(['success' => true, 'url' => getPublicUrl($path)]);
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
