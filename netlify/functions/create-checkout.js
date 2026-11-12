/**
 * ZoomCast by Aamiq — Netlify Serverless Function for Dual Payment Checkout (Safepay PKR + Lemon Squeezy USD)
 * Route: /.netlify/functions/create-checkout (also mapped from /api/create-checkout and /api/create-checkout.php)
 */
exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {}

  const planId = String(payload.planId || 'pro').trim().toLowerCase();
  const currency = String(payload.currency || 'USD').trim().toUpperCase();
  const amount = Number(payload.amount || 35);
  const email = String(payload.email || '').trim();
  const name = String(payload.name || '').trim();

  const returnBase = (process.env.SITE_URL || 'https://aamiq.online').replace(/\/$/, '');
  const successUrl = `${returnBase}/?payment_status=success&plan=${encodeURIComponent(planId)}&currency=${encodeURIComponent(currency)}`;
  const cancelUrl = `${returnBase}/?payment_status=cancelled&plan=${encodeURIComponent(planId)}`;

  if (currency === 'PKR') {
    const linkMap = {
      starter: process.env.SAFEPAY_STARTER_LINK || '',
      pro: process.env.SAFEPAY_PRO_LINK || '',
      enterprise: process.env.SAFEPAY_ENTERPRISE_LINK || ''
    };
    if (linkMap[planId]) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true, checkoutUrl: linkMap[planId], gateway: 'safepay' })
      };
    }

    const spKey = process.env.SAFEPAY_API_KEY || '';
    const spEnv = process.env.SAFEPAY_ENV || 'production';
    if (spKey) {
      try {
        const baseUrl = spEnv === 'sandbox'
          ? 'https://sandbox.api.getsafepay.com'
          : 'https://api.getsafepay.com';
        const res = await fetch(`${baseUrl}/order/v1/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: spKey,
            amount: Math.round(amount),
            currency: 'PKR',
            environment: spEnv
          })
        });
        const data = await res.json();
        const token = data?.data?.token;
        if (res.ok && token) {
          const checkoutBase = spEnv === 'sandbox'
            ? 'https://sandbox.api.getsafepay.com/components'
            : 'https://getsafepay.com/checkout/pay';
          const redirectUrl = `${checkoutBase}?env=${encodeURIComponent(spEnv)}&beacon=${encodeURIComponent(token)}&source=custom&order_id=${encodeURIComponent('ZC-' + Date.now())}&redirect_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ ok: true, checkoutUrl: redirectUrl, gateway: 'safepay' })
          };
        }
      } catch (e) {}
    }
  } else {
    const lsMap = {
      starter: process.env.LEMONSQUEEZY_STARTER_URL || '',
      pro: process.env.LEMONSQUEEZY_PRO_URL || '',
      enterprise: process.env.LEMONSQUEEZY_ENTERPRISE_URL || ''
    };
    if (lsMap[planId]) {
      const sep = lsMap[planId].includes('?') ? '&' : '?';
      const url = `${lsMap[planId]}${sep}checkout[email]=${encodeURIComponent(email)}&checkout[name]=${encodeURIComponent(name)}`;
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true, checkoutUrl: url, gateway: 'lemonsqueezy' })
      };
    }
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ ok: true, checkoutUrl: '', mode: 'inline_card_checkout' })
  };
};
