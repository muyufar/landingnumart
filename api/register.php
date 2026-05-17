<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metode tidak diizinkan.']);
    exit;
}

$dbFile = dirname(__DIR__) . '/data/members.json';

if (!file_exists($dbFile)) {
    file_put_contents($dbFile, '[]');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}

$nama = trim($input['nama'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$telepon = preg_replace('/\D+/', '', $input['telepon'] ?? '');
$alamat = trim($input['alamat'] ?? '');
$kecamatan = trim($input['kecamatan'] ?? '');
$gerai = trim($input['gerai'] ?? '');

$errors = [];

if ($nama === '' || mb_strlen($nama) < 3) {
    $errors[] = 'Nama lengkap minimal 3 karakter.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Format email tidak valid.';
}

if (strlen($telepon) < 10 || strlen($telepon) > 15) {
    $errors[] = 'Nomor telepon harus 10–15 digit.';
}

if ($alamat === '' || mb_strlen($alamat) < 5) {
    $errors[] = 'Alamat minimal 5 karakter.';
}

$kecamatanValid = ['Sawangan', 'Borobudur', 'Srumbung', 'Tegalrejo', 'Mungkid', 'Salam', 'Lainnya'];
if (!in_array($kecamatan, $kecamatanValid, true)) {
    $errors[] = 'Pilih kecamatan yang valid.';
}

if ($errors) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors), 'errors' => $errors]);
    exit;
}

$fp = fopen($dbFile, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database tidak dapat dibuka.']);
    exit;
}

flock($fp, LOCK_EX);

$raw = stream_get_contents($fp);
$members = json_decode($raw, true);
if (!is_array($members)) {
    $members = [];
}

foreach ($members as $member) {
    if (strtolower($member['email'] ?? '') === $email) {
        flock($fp, LOCK_UN);
        fclose($fp);
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar sebagai member.']);
        exit;
    }
    if (($member['telepon'] ?? '') === $telepon) {
        flock($fp, LOCK_UN);
        fclose($fp);
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Nomor telepon sudah terdaftar sebagai member.']);
        exit;
    }
}

$year = date('Y');
$seq = 1;
foreach ($members as $member) {
    if (preg_match('/^NUM-' . $year . '-(\d+)$/', $member['id'] ?? '', $m)) {
        $seq = max($seq, (int) $m[1] + 1);
    }
}

$newMember = [
    'id' => sprintf('NUM-%s-%04d', $year, $seq),
    'nama' => $nama,
    'email' => $email,
    'telepon' => $telepon,
    'alamat' => $alamat,
    'kecamatan' => $kecamatan,
    'gerai' => $gerai,
    'poin' => 0,
    'status' => 'aktif',
    'registered_at' => date('c'),
];

$members[] = $newMember;

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($members, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode([
    'success' => true,
    'message' => 'Registrasi member berhasil!',
    'member' => $newMember,
]);
