<?php
/**
 * ZoomCast by Aamiq — Dual Payment Gateway Configuration (Safepay PKR + Lemon Squeezy USD)
 * Copy or rename this file to payment-config.php inside Hostinger: public_html/api/payment-config.php
 */
return [
    // =========================================================================
    // 1. SAFEPAY PAKISTAN (PKR — Visa, Mastercard, PayPak, 1Link)
    // Dashboard: https://getsafepay.com/dashboard
    // =========================================================================
    'safepay' => [
        'environment' => 'production', // 'sandbox' or 'production'
        'api_key'     => '',           // Paste Safepay Secret Key (sec_...)
        'v1_secret'   => '',           // Paste Safepay Webhook/V1 Secret
        // Or paste direct Safepay Quick Payment Links per plan:
        'payment_links' => [
            'starter'    => '',
            'pro'        => '',
            'enterprise' => ''
        ]
    ],

    // =========================================================================
    // 2. LEMON SQUEEZY (USD — International Cards, Wise, Revolut, Apple Pay)
    // Dashboard: https://app.lemonsqueezy.com/products
    // =========================================================================
    'lemonsqueezy' => [
        'api_key'  => '', // Optional Lemon Squeezy API Key
        'store_id' => '', // Optional Lemon Squeezy Store ID
        // Paste your 3 Lemon Squeezy Hosted Checkout Links:
        'checkout_urls' => [
            'starter'    => '', // $19/month Checkout URL
            'pro'        => '', // $35/month Checkout URL
            'enterprise' => ''  // $65/month Checkout URL
        ]
    ],

    // Return URL after payment completion
    'return_url' => 'https://aamiq.online/'
];
