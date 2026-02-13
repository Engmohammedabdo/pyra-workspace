<?php
/**
 * Password Hash Generator for Pyra Workspace
 * Usage (CLI): php setup.php <password>
 * Usage (Web): Open in browser and use the form
 */
if (php_sapi_name() === 'cli') {
    if (isset($argv[1])) {
        echo password_hash($argv[1], PASSWORD_BCRYPT) . "\n";
    } else {
        echo "Usage: php setup.php <password>\n";
    }
} else {
    $hash = '';
    if (isset($_POST['password']) && $_POST['password'] !== '') {
        $hash = password_hash($_POST['password'], PASSWORD_BCRYPT);
    }
    echo '<!DOCTYPE html><html><head><title>Pyra - Password Hash Generator</title>';
    echo '<style>body{font-family:sans-serif;background:#0d1017;color:#e6eaf0;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}';
    echo '.card{background:#151a23;border:1px solid #232d42;border-radius:14px;padding:32px;max-width:400px;width:90%}';
    echo 'h2{margin:0 0 20px;color:#7c6fff}input{width:100%;padding:10px;background:#0d1017;border:1px solid #232d42;border-radius:8px;color:#e6eaf0;font-size:14px;margin-bottom:12px;box-sizing:border-box}';
    echo 'button{background:#7c6fff;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;width:100%}';
    echo 'pre{background:#0d1017;padding:12px;border-radius:8px;font-size:12px;word-break:break-all;margin-top:16px;border:1px solid #232d42}</style></head>';
    echo '<body><div class="card"><h2>Password Hash Generator</h2>';
    echo '<form method="post"><input name="password" placeholder="Enter password..." required autofocus><button type="submit">Generate Hash</button></form>';
    if ($hash) {
        echo '<pre>' . htmlspecialchars($hash) . '</pre>';
    }
    echo '</div></body></html>';
}
