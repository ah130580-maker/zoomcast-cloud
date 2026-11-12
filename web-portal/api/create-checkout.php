<?php
/**
 * ZoomCast by Aamiq — Dynamic Checkout Session Generator
 * Supports Safepay (PKR at Live Exchange Rate) + Lemon Squeezy (USD)
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

$planId   = isset($payload['planId']) ? trim($payload['planId']) : 'pro';
$currency = isset($payload['currency']) ? strtoupper(trim($payload['currency'])) : 'USD';
$amount   = isset($payload['amount']) ? (float) $payload['amount'] : 35.0;
$email    = isset($payload['email']) ? trim($payload['email']) : '';
$name     = isset($payload['name']) ? trim($payload['name']) : '';

$configFile = __DIR__ . '/payment-config.php';
$config = file_exists($configFile) ? (include $configFile) : (include __DIR__ . '/payment-config.example.php');

$returnBase = rtrim($config['return_url'] ?? 'https://aamiq.online/', '/');
$successUrl = $returnBase . '/?payment_status=success&plan=' . urlencode($planId) . '&currency=' . urlencode($currency);
$cancelUrl  = $returnBase . '/?payment_status=cancelled&plan=' . urlencode($planId);

if ($currency === 'PKR') {
    // 1. Check if direct Safepay Payment Link is configured
    $directLink = $config['safepay']['payment_links'][$planId] ?? '';
    if (!empty($directLink)) {
        echo json_encode(['ok' => true, 'checkoutUrl' => $directLink, 'gateway' => 'safepay']);
        exit;
    }

    // 2. Check if Safepay API Key is configured to create a dynamic PKR order at live rate
    $spKey = $config['safepay']['api_key'] ?? '';
    $spEnv = $config['safepay']['environment'] ?? 'production';
    if (!empty($spKey)) {
        $baseUrl = ($spEnv === 'sandbox')
            ? 'https://sandbox.api.getsafepay.com'
            : 'https://api.getsafepay.com';

        $initPayload = json_encode([
            'client'      => $spKey,
            'amount'      => round($amount, 2),
            'currency'    => 'PKR',
            'environment' => $spEnv
        ]);

        $ch = curl_init($baseUrl . '/order/v1/init');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $initPayload,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json']
        ]);
        $resp = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode($resp, true);
        $token = $decoded['data']['token'] ?? '';
        if ($code >= 200 && $code < 300 && !empty($token)) {
            $checkoutBase = ($spEnv === 'sandbox')
                ? 'https://sandbox.api.getsafepay.com/components'
                : 'https://getsafepay.com/checkout/pay';
            $redirectUrl = $checkoutBase
                . '?env=' . urlencode($spEnv)
                . '&beacon=' . urlencode($token)
                . '&source=custom'
                . '&order_id=' . urlencode('ZC-' . time())
                . '&redirect_url=' . urlencode($successUrl)
                . '&cancel_url=' . urlencode($cancelUrl);
            echo json_encode(['ok' => true, 'checkoutUrl' => $redirectUrl, 'gateway' => 'safepay']);
            exit;
        }
    }
} else {
    // USD -> Lemon Squeezy
    $lsLink = $config['lemonsqueezy']['checkout_urls'][$planId] ?? '';
    if (!empty($lsLink)) {
        $sep = (strpos($lsLink, '?') !== false) ? '&' : '?';
        $prefilledUrl = $lsLink . $sep . 'checkout[email]=' . urlencode($email) . '&checkout[name]=' . urlencode($name);
        echo json_encode(['ok' => true, 'checkoutUrl' => $prefilledUrl, 'gateway' => 'lemonsqueezy']);
        exit;
    }
}

echo json_encode([
    'ok'          => true,
    'checkoutUrl' => '',
    'mode'        => 'inline_card_checkout'
]);
