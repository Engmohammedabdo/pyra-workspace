<?php
/**
 * Authentication & Authorization for Pyra Workspace
 * Uses Supabase PostgreSQL via REST API (PostgREST)
 */

session_start();
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Strict');

// === Database (Supabase REST API) ===

function dbRequest(string $method, string $endpoint, $body = null, array $extraHeaders = []): array {
    $url = SUPABASE_URL . '/rest/v1' . $endpoint;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $headers = [
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'apikey: ' . SUPABASE_SERVICE_KEY,
        'Content-Type: application/json',
    ];

    foreach ($extraHeaders as $h) {
        $headers[] = $h;
    }

    switch (strtoupper($method)) {
        case 'POST':
            curl_setopt($ch, CURLOPT_POST, true);
            if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            break;
        case 'PATCH':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
            if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            break;
        case 'DELETE':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
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

// === User Functions ===

function findUser(string $username): ?array {
    $result = dbRequest('GET', '/pyra_users?username=eq.' . rawurlencode($username) . '&limit=1');
    if ($result['httpCode'] === 200 && is_array($result['data']) && count($result['data']) > 0) {
        $user = $result['data'][0];
        if (is_string($user['permissions'])) {
            $user['permissions'] = json_decode($user['permissions'], true);
        }
        return $user;
    }
    return null;
}

function getAllUsers(): array {
    $result = dbRequest('GET', '/pyra_users?order=created_at.asc', null, ['Prefer: return=representation']);
    if ($result['httpCode'] === 200 && is_array($result['data'])) {
        return array_map(function($user) {
            if (is_string($user['permissions'])) {
                $user['permissions'] = json_decode($user['permissions'], true);
            }
            unset($user['password_hash']);
            return $user;
        }, $result['data']);
    }
    return [];
}

function createUser(string $username, string $password, string $role, string $displayName, array $permissions): array {
    $existing = findUser($username);
    if ($existing) {
        return ['success' => false, 'error' => 'Username already exists'];
    }

    $data = [
        'username' => $username,
        'password_hash' => password_hash($password, PASSWORD_BCRYPT),
        'role' => $role,
        'display_name' => $displayName,
        'permissions' => $permissions
    ];

    $result = dbRequest('POST', '/pyra_users', $data, ['Prefer: return=representation']);
    if ($result['httpCode'] === 201) {
        return ['success' => true];
    }
    return ['success' => false, 'error' => $result['data']['message'] ?? 'Failed to create user'];
}

function updateUser(string $username, array $fields): array {
    $allowed = ['display_name', 'role', 'permissions'];
    $update = [];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $fields)) {
            $update[$key] = $fields[$key];
        }
    }
    if (empty($update)) {
        return ['success' => false, 'error' => 'No valid fields to update'];
    }

    $result = dbRequest('PATCH', '/pyra_users?username=eq.' . rawurlencode($username), $update);
    if ($result['httpCode'] === 200 || $result['httpCode'] === 204) {
        // Update session if the current user was modified
        if (isset($_SESSION['user']) && $_SESSION['user'] === $username) {
            if (isset($update['display_name'])) $_SESSION['display_name'] = $update['display_name'];
            if (isset($update['role'])) $_SESSION['role'] = $update['role'];
            if (isset($update['permissions'])) $_SESSION['permissions'] = $update['permissions'];
        }
        return ['success' => true];
    }
    return ['success' => false, 'error' => 'Failed to update user'];
}

function changeUserPassword(string $username, string $newPassword): array {
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $result = dbRequest('PATCH', '/pyra_users?username=eq.' . rawurlencode($username), ['password_hash' => $hash]);
    if ($result['httpCode'] === 200 || $result['httpCode'] === 204) {
        return ['success' => true];
    }
    return ['success' => false, 'error' => 'Failed to change password'];
}

function deleteUser(string $username): array {
    if (isset($_SESSION['user']) && $_SESSION['user'] === $username) {
        return ['success' => false, 'error' => 'Cannot delete yourself'];
    }
    $result = dbRequest('DELETE', '/pyra_users?username=eq.' . rawurlencode($username));
    if ($result['httpCode'] === 200 || $result['httpCode'] === 204) {
        return ['success' => true];
    }
    return ['success' => false, 'error' => 'Failed to delete user'];
}

// === Authentication ===

function attemptLogin(string $username, string $password): array {
    $user = findUser($username);
    if (!$user) {
        return ['success' => false, 'error' => 'Invalid credentials'];
    }
    if (!password_verify($password, $user['password_hash'])) {
        return ['success' => false, 'error' => 'Invalid credentials'];
    }

    $_SESSION['user'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['display_name'] = $user['display_name'];
    $_SESSION['permissions'] = $user['permissions'];

    return ['success' => true, 'user' => sessionUserInfo()];
}

function logout(): void {
    session_unset();
    session_destroy();
}

function isLoggedIn(): bool {
    return isset($_SESSION['user']);
}

function sessionUserInfo(): array {
    return [
        'username' => $_SESSION['user'] ?? '',
        'role' => $_SESSION['role'] ?? '',
        'display_name' => $_SESSION['display_name'] ?? '',
        'permissions' => $_SESSION['permissions'] ?? []
    ];
}

function requireAuth(): void {
    if (!isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
}

// === Authorization ===

function canAccessPath(string $path): bool {
    $permissions = $_SESSION['permissions'] ?? [];
    $allowed = $permissions['allowed_paths'] ?? [];

    if (in_array('*', $allowed)) return true;

    $pathNorm = rtrim($path, '/');

    foreach ($allowed as $prefix) {
        $prefixNorm = rtrim($prefix, '/');

        // Direct match
        if ($pathNorm === $prefixNorm) return true;

        // Path is inside allowed prefix
        if ($pathNorm !== '' && strpos($pathNorm . '/', $prefixNorm . '/') === 0) return true;

        // Path is a parent of an allowed prefix (so client can navigate down to their folder)
        if ($pathNorm === '' || strpos($prefixNorm . '/', $pathNorm . '/') === 0) return true;
    }
    return false;
}

function hasPermission(string $perm): bool {
    $permissions = $_SESSION['permissions'] ?? [];
    return !empty($permissions[$perm]);
}

function isAdmin(): bool {
    return ($_SESSION['role'] ?? '') === 'admin';
}

function isPathDirectlyAllowed(string $path): bool {
    $permissions = $_SESSION['permissions'] ?? [];
    $allowed = $permissions['allowed_paths'] ?? [];
    if (in_array('*', $allowed)) return true;

    $pathNorm = rtrim($path, '/');
    foreach ($allowed as $prefix) {
        $prefixNorm = rtrim($prefix, '/');
        if ($pathNorm === $prefixNorm || strpos($pathNorm . '/', $prefixNorm . '/') === 0) {
            return true;
        }
    }
    return false;
}

// === Reviews ===

function getFileReviews(string $filePath): array {
    $result = dbRequest('GET', '/pyra_reviews?file_path=eq.' . rawurlencode($filePath) . '&order=created_at.desc');
    if ($result['httpCode'] === 200 && is_array($result['data'])) {
        return $result['data'];
    }
    return [];
}

function addReview(array $data): array {
    $review = [
        'id' => generateReviewId(),
        'file_path' => $data['file_path'],
        'username' => $_SESSION['user'],
        'display_name' => $_SESSION['display_name'] ?? $_SESSION['user'],
        'type' => $data['type'],
        'text' => $data['text'] ?? '',
        'resolved' => false
    ];

    $result = dbRequest('POST', '/pyra_reviews', $review, ['Prefer: return=representation']);
    if ($result['httpCode'] === 201) {
        return ['success' => true, 'review' => is_array($result['data']) && count($result['data']) > 0 ? $result['data'][0] : $review];
    }
    return ['success' => false, 'error' => $result['data']['message'] ?? 'Failed to add review'];
}

function toggleResolveReview(string $reviewId): array {
    // First get current state
    $result = dbRequest('GET', '/pyra_reviews?id=eq.' . rawurlencode($reviewId) . '&limit=1');
    if ($result['httpCode'] !== 200 || !is_array($result['data']) || count($result['data']) === 0) {
        return ['success' => false, 'error' => 'Review not found'];
    }
    $current = $result['data'][0];
    $newState = !$current['resolved'];

    $result = dbRequest('PATCH', '/pyra_reviews?id=eq.' . rawurlencode($reviewId), ['resolved' => $newState]);
    if ($result['httpCode'] === 200 || $result['httpCode'] === 204) {
        return ['success' => true, 'resolved' => $newState];
    }
    return ['success' => false, 'error' => 'Failed to update review'];
}

function deleteReview(string $reviewId): array {
    $result = dbRequest('DELETE', '/pyra_reviews?id=eq.' . rawurlencode($reviewId));
    if ($result['httpCode'] === 200 || $result['httpCode'] === 204) {
        return ['success' => true];
    }
    return ['success' => false, 'error' => 'Failed to delete review'];
}

function updateReviewPaths(string $oldPath, string $newPath): void {
    $reviews = dbRequest('GET', '/pyra_reviews?file_path=like.' . rawurlencode($oldPath . '%'));
    if ($reviews['httpCode'] === 200 && is_array($reviews['data'])) {
        foreach ($reviews['data'] as $review) {
            $newFilePath = $newPath . substr($review['file_path'], strlen($oldPath));
            dbRequest('PATCH', '/pyra_reviews?id=eq.' . rawurlencode($review['id']), ['file_path' => $newFilePath]);
        }
    }
}

function generateReviewId(): string {
    return 'r_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 5);
}
