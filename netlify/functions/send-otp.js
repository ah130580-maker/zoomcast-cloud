/**
 * ZoomCast by Aamiq — Netlify Serverless Function for Resend High-Speed OTP & Transactional Emails
 * Route: /.netlify/functions/send-otp (also mapped from /api/send-otp and /api/send-otp.php)
 * Environment Variables to add in Netlify -> Site Configuration -> Environment Variables:
 *   RESEND_API_KEY    = re_YOUR_RESEND_API_KEY
 *   RESEND_FROM_EMAIL = ZoomCast by Aamiq <noreply@aamiq.online>
 */
const crypto = require('crypto');

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON body' })
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY || '';
  const resendFrom = process.env.RESEND_FROM_EMAIL || 'ZoomCast by Aamiq <noreply@aamiq.online>';

  if (!resendApiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: false,
        error: 'RESEND_API_KEY environment variable is not set in Netlify Site Settings'
      })
    };
  }

  const type = String(payload.type || 'otp').trim();
  const email = String(payload.email || '').trim();
  const otp = String(payload.otp || '').trim();
  const purpose = String(payload.purpose || 'verification').trim();

  if (!email || !email.includes('@')) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: 'Invalid email address' })
    };
  }

  let toList = [email];
  let subject = '';
  let htmlBody = '';

  if (type === 'receipt') {
    const planName = payload.planName || 'Business Pro';
    const amountStr = payload.amountFormatted || '$35.00';
    const gateway = payload.gateway || 'Safepay / Lemon Squeezy';
    const txnId = payload.txnId || ('TXN-' + Date.now());
    const userName = payload.userName || 'Subscriber';

    subject = `ZoomCast by Aamiq — Payment Receipt & Active Subscription (${planName})`;
    htmlBody = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0e0d0a;color:#f8fafc;border-radius:16px;border:1px solid rgba(245,183,0,0.35);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <img src="https://aamiq.online/aamiq-logo.png" alt="Aamiq" style="height:40px;width:auto;object-fit:contain;" />
          <span style="font-size:18px;font-weight:800;color:#ffffff;">ZoomCast <span style="color:#f5b700;">by Aamiq</span></span>
        </div>
        <h2 style="color:#10b981;font-size:20px;margin:0 0 8px 0;">✓ Payment Confirmed & Workspace Activated</h2>
        <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 18px 0;">
          Hi <strong>${userName}</strong>, thank you for subscribing to <strong>ZoomCast by Aamiq</strong>! Your subscription is now active.
        </p>
        <div style="background:#181611;border:1px solid rgba(245,183,0,0.35);border-radius:12px;padding:16px;margin:18px 0;font-size:13px;line-height:1.8;color:#e2e8f0;">
          <div><strong>Plan:</strong> <span style="color:#f5b700;">${planName}</span></div>
          <div><strong>Amount Paid:</strong> <span style="color:#10b981;font-weight:700;">${amountStr}</span></div>
          <div><strong>Payment Gateway:</strong> ${gateway}</div>
          <div><strong>Transaction ID:</strong> <code>${txnId}</code></div>
          <div><strong>Refund Guarantee:</strong> 7-Day 100% Money-Back Guarantee</div>
        </div>
      </div>
    `;
  } else if (type === 'ticket') {
    const ticketId = payload.ticketId || 'TCK-1000';
    const clientName = payload.clientName || 'Client';
    const priority = payload.priority || 'Normal';
    const tckSubj = payload.ticketSubject || 'Support Request';
    const tckMsg = String(payload.message || '').replace(/\n/g, '<br/>');

    toList = ['amirjupiteradvisers@gmail.com', email];
    subject = `[${priority} Priority #${ticketId}] ${tckSubj} — ZoomCast by Aamiq`;
    htmlBody = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0e0d0a;color:#f8fafc;border-radius:16px;border:1px solid rgba(245,183,0,0.35);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <img src="https://aamiq.online/aamiq-logo.png" alt="Aamiq" style="height:40px;width:auto;object-fit:contain;" />
          <span style="font-size:18px;font-weight:800;color:#ffffff;">ZoomCast <span style="color:#f5b700;">by Aamiq Support</span></span>
        </div>
        <h2 style="color:#f5b700;font-size:18px;margin:0 0 8px 0;">Ticket #${ticketId} (${priority} Priority)</h2>
        <p style="color:#cbd5e1;font-size:13px;margin:0 0 12px 0;">
          <strong>From:</strong> ${clientName} (${email})<br/>
          <strong>Subject:</strong> ${tckSubj}
        </p>
        <div style="background:#181611;border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:16px;margin:16px 0;font-size:13px;color:#f8fafc;line-height:1.6;">
          ${tckMsg}
        </div>
      </div>
    `;
  } else {
    const purposeLabel = purpose === 'forgot' ? 'Password Reset Request' : 'Account Verification';
    subject = payload.subject || `ZoomCast by Aamiq — Your 4-Digit Security OTP Code (${otp})`;
    htmlBody = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px;background:#0e0d0a;color:#f8fafc;border-radius:16px;border:1px solid rgba(245,183,0,0.35);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <img src="https://aamiq.online/aamiq-logo.png" alt="Aamiq" style="height:40px;width:auto;object-fit:contain;" />
          <span style="font-size:18px;font-weight:800;color:#ffffff;">ZoomCast <span style="color:#f5b700;">by Aamiq</span></span>
        </div>
        <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px 0;">${purposeLabel}</h2>
        <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
          Use the 4-digit security code below to verify your email address on ZoomCast by Aamiq:
        </p>
        <div style="background:#181611;border:1px solid #f5b700;border-radius:12px;padding:18px;text-align:center;margin:20px 0;">
          <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#f5b700;">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:0;">
          This security code expires in 10 minutes.
        </p>
      </div>
    `;
  }

  const idempotencyKey = crypto
    .createHash('sha256')
    .update(`${type}:${email.toLowerCase()}:${otp}:${Math.floor(Date.now() / 60000)}`)
    .digest('hex');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        from: resendFrom,
        to: Array.from(new Set(toList)),
        subject,
        html: htmlBody
      })
    });

    const data = await res.json();
    if (res.ok && data.id) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true, sentEmail: true, id: data.id, provider: 'resend-netlify' })
      };
    }

    return {
      statusCode: res.status || 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, sentEmail: false, error: data.message || 'Resend API error' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, sentEmail: false, error: err.message })
    };
  }
};
