<?php
/**
 * ZoomCast by Aamiq — High-Speed Resend Transactional Email & OTP Endpoint
 * Supports:
 *   1. 4-Digit Security OTP (Sign Up & Password Reset)
 *   2. Subscription Payment Receipts (Safepay PKR & Lemon Squeezy USD)
 *   3. Priority Support Ticket Notifications (to amirjupiteradvisers@gmail.com)
 * Place inside Hostinger: public_html/api/send-otp.php
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
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
    exit;
}

// Load Resend API Key & Verified Domain Sender from resend-secret.php or Environment
$resendApiKey = getenv('RESEND_API_KEY') ?: '';
$resendFrom   = getenv('RESEND_FROM_EMAIL') ?: 'ZoomCast by Aamiq <noreply@aamiq.online>';

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

$type    = isset($payload['type']) ? trim($payload['type']) : 'otp';
$email   = isset($payload['email']) ? trim($payload['email']) : '';
$otp     = isset($payload['otp']) ? trim($payload['otp']) : '';
$purpose = isset($payload['purpose']) ? trim($payload['purpose']) : 'verification';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid recipient email address']);
    exit;
}

$toList = [$email];
$subject = '';
$htmlBody = '';

if ($type === 'receipt') {
    $planName  = htmlspecialchars($payload['planName'] ?? 'Business Pro', ENT_QUOTES, 'UTF-8');
    $amountStr = htmlspecialchars($payload['amountFormatted'] ?? '$35.00', ENT_QUOTES, 'UTF-8');
    $gateway   = htmlspecialchars($payload['gateway'] ?? 'Lemon Squeezy / Safepay', ENT_QUOTES, 'UTF-8');
    $txnId     = htmlspecialchars($payload['txnId'] ?? ('TXN-' . time()), ENT_QUOTES, 'UTF-8');
    $userName  = htmlspecialchars($payload['userName'] ?? 'Subscriber', ENT_QUOTES, 'UTF-8');

    $subject = "ZoomCast by Aamiq — Payment Receipt & Active Subscription ($planName)";
    $htmlBody = <<<HTML
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0e0d0a;color:#f8fafc;border-radius:16px;border:1px solid rgba(245,183,0,0.35);">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
    <img src="https://ah130580-maker.github.io/zoomcast-cloud/aamiq-logo.png" alt="Aamiq" style="height:40px;width:auto;object-fit:contain;" />
    <span style="font-size:18px;font-weight:800;color:#ffffff;">ZoomCast <span style="color:#f5b700;">by Aamiq</span></span>
  </div>
  <h2 style="color:#10b981;font-size:20px;margin:0 0 8px 0;">✓ Payment Confirmed & Workspace Activated</h2>
  <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 18px 0;">
    Hi <strong>{$userName}</strong>, thank you for subscribing to <strong>ZoomCast by Aamiq</strong>! Your subscription is now active.
  </p>
  <div style="background:#181611;border:1px solid rgba(245,183,0,0.35);border-radius:12px;padding:16px;margin:18px 0;font-size:13px;line-height:1.8;color:#e2e8f0;">
    <div><strong>Plan:</strong> <span style="color:#f5b700;">{$planName}</span></div>
    <div><strong>Amount Paid:</strong> <span style="color:#10b981;font-weight:700;">{$amountStr}</span></div>
    <div><strong>Payment Gateway:</strong> {$gateway}</div>
    <div><strong>Transaction ID:</strong> <code>{$txnId}</code></div>
    <div><strong>Refund Guarantee:</strong> 7-Day 100% Money-Back Guarantee</div>
  </div>
  <p style="color:#94a3b8;font-size:12px;margin:0;">
    Need help? Reply to this email or contact <a href="mailto:amirjupiteradvisers@gmail.com" style="color:#f5b700;">amirjupiteradvisers@gmail.com</a>.
  </p>
</div>
HTML;
} elseif ($type === 'ticket') {
    $ticketId   = htmlspecialchars($payload['ticketId'] ?? 'TCK-1000', ENT_QUOTES, 'UTF-8');
    $clientName = htmlspecialchars($payload['clientName'] ?? 'Client', ENT_QUOTES, 'UTF-8');
    $priority   = htmlspecialchars($payload['priority'] ?? 'Normal', ENT_QUOTES, 'UTF-8');
    $tckSubj    = htmlspecialchars($payload['ticketSubject'] ?? 'Support Request', ENT_QUOTES, 'UTF-8');
    $tckMsg     = nl2br(htmlspecialchars($payload['message'] ?? '', ENT_QUOTES, 'UTF-8'));

    $toList = ['amirjupiteradvisers@gmail.com', $email];
    $subject = "[{$priority} Priority #{$ticketId}] {$tckSubj} — ZoomCast by Aamiq";
    $htmlBody = <<<HTML
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0e0d0a;color:#f8fafc;border-radius:16px;border:1px solid rgba(245,183,0,0.35);">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
    <img src="https://ah130580-maker.github.io/zoomcast-cloud/aamiq-logo.png" alt="Aamiq" style="height:40px;width:auto;object-fit:contain;" />
    <span style="font-size:18px;font-weight:800;color:#ffffff;">ZoomCast <span style="color:#f5b700;">by Aamiq Support</span></span>
  </div>
  <h2 style="color:#f5b700;font-size:18px;margin:0 0 8px 0;">Ticket #{$ticketId} ({$priority} Priority)</h2>
  <p style="color:#cbd5e1;font-size:13px;margin:0 0 12px 0;">
    <strong>From:</strong> {$clientName} ({$email})<br/>
    <strong>Subject:</strong> {$tckSubj}
  </p>
  <div style="background:#181611;border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:16px;margin:16px 0;font-size:13px;color:#f8fafc;line-height:1.6;">
    {$tckMsg}
  </div>
  <p style="color:#94a3b8;font-size:12px;margin:0;">
    Our team has received this ticket and will respond shortly.
  </p>
</div>
HTML;
} else {
    if (!preg_match('/^\d{4,6}$/', $otp)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid 4-digit OTP code']);
        exit;
    }
    $purposeLabel = ($purpose === 'forgot') ? 'Password Reset Request' : 'Account Verification';
    $subject = isset($payload['subject']) && $payload['subject'] !== ''
        ? trim($payload['subject'])
        : "ZoomCast by Aamiq — Your 4-Digit Security OTP Code ($otp)";

    $htmlBody = <<<HTML
<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px;background:#0e0d0a;color:#f8fafc;border-radius:16px;border:1px solid rgba(245,183,0,0.35);">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
    <img src="https://ah130580-maker.github.io/zoomcast-cloud/aamiq-logo.png" alt="Aamiq" style="height:40px;width:auto;object-fit:contain;" />
    <span style="font-size:18px;font-weight:800;color:#ffffff;">ZoomCast <span style="color:#f5b700;">by Aamiq</span></span>
  </div>
  <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px 0;">{$purposeLabel}</h2>
  <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
    Use the 4-digit security code below to verify your email address on ZoomCast by Aamiq:
  </p>
  <div style="background:#181611;border:1px solid #f5b700;border-radius:12px;padding:18px;text-align:center;margin:20px 0;">
    <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#f5b700;">{$otp}</span>
  </div>
  <p style="color:#94a3b8;font-size:12px;margin:0;">
    This security code expires in 10 minutes. If you did not request this code, you can safely ignore this email.
  </p>
</div>
HTML;
}

$idempotencyKey = hash('sha256', $type . ':' . strtolower($email) . ':' . $otp . ':' . floor(time() / 60));

$postData = json_encode([
    'from'    => $resendFrom,
    'to'      => array_values(array_unique($toList)),
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
