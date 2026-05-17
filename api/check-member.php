<?php
header('Content-Type: application/json; charset=utf-8');

$dbFile = dirname(__DIR__) . '/data/members.json';

if (!file_exists($dbFile)) {
    echo json_encode(['success' => false, 'message' => 'Belum ada data member.']);
    exit;
}

$telepon = preg_replace('/\D+/', '', $_GET['telepon'] ?? '');
$memberId = trim($_GET['id'] ?? '');

if ($telepon === '' && $memberId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Masukkan nomor telepon atau ID member.']);
    exit;
}

$members = json_decode(file_get_contents($dbFile), true);
if (!is_array($members)) {
    $members = [];
}

$found = null;

foreach ($members as $member) {
    if ($memberId !== '' && ($member['id'] ?? '') === $memberId) {
        $found = $member;
        break;
    }
    if ($telepon !== '' && ($member['telepon'] ?? '') === $telepon) {
        $found = $member;
        break;
    }
}

if (!$found) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Member tidak ditemukan.']);
    exit;
}

echo json_encode([
    'success' => true,
    'member' => [
        'id' => $found['id'],
        'nama' => $found['nama'],
        'email' => $found['email'],
        'telepon' => $found['telepon'],
        'kecamatan' => $found['kecamatan'],
        'gerai' => $found['gerai'] ?? '',
        'poin' => $found['poin'] ?? 0,
        'status' => $found['status'] ?? 'aktif',
        'registered_at' => $found['registered_at'] ?? '',
    ],
]);
