<?php
/**
 * ZoomCast CRM — High-Speed Resend OTP Endpoint (Hostinger PHP Compatible)
 * Place this folder inside Hostinger public_html/api/send-otp.php
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Idempotency-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

$email   = isset($payload['email']) ? trim($payload['email']) : '';
$otp     = isset($payload['otp']) ? trim($payload['otp']) : '';
$purpose = isset($payload['purpose']) ? trim($payload['purpose']) : 'verification';
$subject = isset($payload['subject']) && $payload['subject'] !== ''
    ? trim($payload['subject'])
    : "ZoomCast CRM — Your 4-Digit Security OTP Code ($otp)";

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{4,6}$/', $otp)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email or OTP format']);
    exit;
}

// Load Resend API Key & Verified Domain Sender from resend-secret.php or Environment
$resendApiKey = getenv('RESEND_API_KEY') ?: '';
$resendFrom   = getenv('RESEND_FROM_EMAIL') ?: 'ZoomCast CRM <onboarding@resend.dev>';

$secretFile = __DIR__ . '/resend-secret.php';
if (file_exists($secretFile)) {
    $secretConfig = include $secretFile;
    if (is_array($secretConfig)) {
        if (!empty($secretConfig['api_key'])) {
            $resendApiKey = $secretConfig['api_key'];
        }
        if (!empty($secretConfig['from_email'])) {
            $resendFrom = $secretConfig['from_email'];
        }
    }
}

if (empty($resendApiKey)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'RESEND_API_KEY is not configured in api/resend-secret.php']);
    exit;
}

$purposeLabel = ($purpose === 'forgot') ? 'Password Reset Request' : 'Account Verification';

$htmlBody = <<<HTML
<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px;background:#0e0d0a;color:#f8fafc;border-radius:16px;border:1px solid rgba(245,183,0,0.35);">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
    <span style="display:inline-block;padding:6px 12px;border-radius:8px;background:#f5b700;color:#0a0a0a;font-weight:900;font-size:14px;">Z</span>
    <span style="font-size:18px;font-weight:800;color:#ffffff;">ZoomCast <span style="color:#f5b700;">CRM</span></span>
  </div>
  <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px 0;">{$purposeLabel}</h2>
  <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
    Use the 4-digit security code below to verify your email address on ZoomCast CRM:
  </p>
  <div style="background:#181611;border:1px solid #f5b700;border-radius:12px;padding:18px;text-align:center;margin:20px 0;">
    <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#f5b700;">{$otp}</span>
  </div>
  <p style="color:#94a3b8;font-size:12px;margin:0;">
    This security code expires in 10 minutes. If you did not request this code, you can safely ignore this email.
  </p>
</div>
HTML;

$idempotencyKey = hash('sha256', strtolower($email) . ':' . $otp . ':' . floor(time() / 60));

$postData = json_encode([
    'from'    => $resendFrom,
    'to'      => [$email],
    'subject' => $subject,
    'html'    => $htmlBody
]);

$maxAttempts = 2;
$attempt = 0;
$responseBody = '';
$httpCode = 0;

while ($attempt < $maxAttempts) {
    $attempt++;
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postData,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $resendApiKey,
            'Content-Type: application/json',
            'Idempotency-Key: ' . $idempotencyKey
        ]
    ]);
    $responseBody = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        break;
    }
    if ($httpCode === 429 || $httpCode >= 500) {
        usleep(500000);
        continue;
    }
    break;
}

$decoded = json_decode($responseBody, true);
if ($httpCode >= 200 && $httpCode < 300 && isset($decoded['id'])) {
    echo json_encode([
        'ok'        => true,
        'sentEmail' => true,
        'id'        => $decoded['id'],
        'provider'  => 'resend'
    ]);
} else {
    http_response_code($httpCode ?: 500);
    echo json_encode([
        'ok'        => false,
        'sentEmail' => false,
        'error'     => $decoded['message'] ?? 'Resend API error',
        'status'    => $httpCode
    ]);
}
