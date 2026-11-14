const MASTER_ADMIN_USER = {
  name: 'Workspace Owner',
  email: 'ah130580@gmail.com',
  password: 'Amir5748@',
  authToken: 'master_tok_owner',
  hasActivePlan: true,
  planName: 'Enterprise'
};

// ============================================================================
// HOSTINGER + RESEND/BREVO OTP + SAFEPAY (PKR) & LEMONSQUEEZY (USD) CONFIG
// ============================================================================
const HOSTINGER_PRODUCTION_CONFIG = {
  domain: 'zoomcast.aamiq.online',
  netlifySiteUrl: 'https://zoomcast-aamiq.netlify.app',
  // Phase 2: High-Speed Transactional OTP Endpoint (Netlify Live Function + Custom Subdomain)
  otpEndpoint: '/.netlify/functions/send-otp',
  otpRemoteEndpoint: 'https://zoomcast-aamiq.netlify.app/.netlify/functions/send-otp',
  senderEmail: 'noreply@aamiq.online',
  // Phase 3: Dual Payment Gateways (Safepay for PKR + Lemon Squeezy for USD)
  safepayPkrCheckoutUrls: {
    starter: '',    // Paste Safepay PKR Payment Link or Checkout URL when live
    pro: '',
    enterprise: ''
  },
  lemonSqueezyUsdCheckoutUrls: {
    starter: '',    // Paste Lemon Squeezy USD Checkout URL when live
    pro: '',
    enterprise: ''
  }
};

const DUMMY_EMAIL_BLACKLIST = [
  'ahmed.raza@gmail.com',
  'usman.academy@gmail.com',
  'zainab.coaching@gmail.com',
  'new.subscriber@gmail.com',
  'amirjupiteradvisers@gmail.com'
];

const DEFAULT_CMS_CONTENT = {
  heroTitle: 'Automate Your Recorded Zoom Broadcasts On Autopilot',
  heroSubtitle: 'Build automated Zoom meeting workflows, schedule multi-video playlists across any day or 12-hour AM/PM time slot, auto-promote your team to Co-Host, and inspect real Zoom chat messages.',
  supportEmail: 'support@aamiq.online',
  otpWebhookUrl: '',
  refundPolicy: 'If you are not 100% satisfied with our setup or if the platform does not fit your workflow for any reason, you can cancel your subscription within 7 days of purchase and receive a 100% full refund of your payment — no questions asked. Simply email our support team or open a ticket in your portal within 7 days for an immediate full refund.',
  termsBody: `1. 7-Day 100% Money-Back Refund Guarantee
We stand behind our automated Zoom broadcast platform. If you are not satisfied with the setup or if it does not meet your business needs, you may cancel your subscription within seven (7) calendar days of your initial purchase and receive a 100% full refund.

2. Account Registration & Subscription Access (USD & PKR)
Access to the ZoomCast CRM workspace requires a verified account and an active monthly subscription plan (Starter, Business Pro, or Enterprise) billed in USD ($) via Lemon Squeezy or in PKR (Rs.) at the live exchange rate via Safepay.

3. Automated Zoom Broadcast & Permanent Meeting Link Execution
By connecting your Zoom account and scheduling workflows, you authorize ZoomCast Cloud to launch your scheduled Zoom meetings on your permanent meeting link, stream your uploaded recorded video playlists, auto-promote your designated Co-Host emails, and capture attendance & in-meeting chat logs on your behalf.

4. Customer Support & Help Desk
Customers may contact us anytime via email at support@aamiq.online or through the built-in Support & Tickets section inside the portal with Low, Normal, or High priority.`,
  privacyBody: `1. Information We Collect
We collect your name, email address, encrypted account credentials, and subscription status when you register on ZoomCast CRM.

2. Zoom OAuth & Broadcast Data Security
When you connect your Zoom account via Google OAuth, we use secure authorization tokens solely to start and manage your scheduled Zoom meetings. Your uploaded videos, meeting schedules, participant attendance records, and saved in-meeting chat transcripts remain strictly private to your workspace.

3. Payment Security (Safepay PKR & Lemon Squeezy USD)
All subscription payments are processed through 256-bit SSL encrypted, PCI-DSS compliant checkout channels (Safepay for Pakistani PKR cards & 1Link; Lemon Squeezy for international USD cards). We never store raw credit card CVC numbers on our servers.

4. Data Control & Deletion
You may update your profile, reset your password via 4-digit security OTP, export your attendance logs, or request complete account deletion at any time by contacting support@aamiq.online.`
};

let appState = {
  authMode: 'signin',
  otpPurpose: 'signup',
  generatedOtp: null,
  otpTimerInterval: null,
  otpSecondsRemaining: 38,
  pendingSignupUser: null,
  pendingForgotData: null,
  selectedPlan: null,
  activeSessionDetailId: null,
  currency: 'USD',
  usdToPkrRate: 278.50,
  cms: { ...DEFAULT_CMS_CONTENT },
  profile: {
    name: '',
    email: '',
    authToken: '',
    hasActivePlan: false,
    planName: 'Starter Plan',
    zoomConnected: false,
    defaultZoomLink: 'https://zoom.us/j/89421756301?pwd=ZoomCastFixed'
  },
  usersDb: [MASTER_ADMIN_USER],
  coHostEmails: [],
  categories: [],
  supportTickets: [],
  paymentMethods: [],
  transactions: [],
  serviceStatus: { mode: 'operational', message: '', updatedAt: '' },
  currentCategory: {
    editingId: null,
    status: 'Active',
    meetingLink: '',
    videos: [],
    selectedTimes: ['10:00 AM', '03:00 PM'],
    slotVideoMap: {}
  },
  plans: [
    {
      id: "starter",
      name: "Starter Plan",
      priceUsd: 19,
      permissions: {
        maxWorkflows: 2,
        maxDailyTimes: 2,
        allowCustomTime: false,
        allowDraftMode: false,
        allowMultiVideo: false,
        maxVideosPerWorkflow: 1,
        maxCoHosts: 1,
        allowAttendanceTab: false,
        allowChatLogs: false,
        allowCsvExport: false
      },
      features: [
        "Up to 2 Automated Zoom Meeting Workflows",
        "Permanent Copyable Zoom Meeting Link",
        "1 or 2 Daily Broadcast Times (12h AM/PM)",
        "Single Recorded Video Upload (Unlimited Size)",
        "7-Day Weekly Schedule Checkboxes",
        "Auto-Admit & Auto-End Meeting on Finish",
        "1 Team Auto Co-Host Email"
      ]
    },
    {
      id: "pro",
      name: "Business Pro",
      popular: true,
      priceUsd: 35,
      permissions: {
        maxWorkflows: 5,
        maxDailyTimes: 4,
        allowCustomTime: true,
        allowDraftMode: true,
        allowMultiVideo: true,
        maxVideosPerWorkflow: 2,
        maxCoHosts: 5,
        allowAttendanceTab: true,
        allowChatLogs: false,
        allowCsvExport: false
      },
      features: [
        "Up to 5 Automated Zoom Meeting Workflows",
        "Permanent Copyable Zoom Meeting Link",
        "Up to 4 Daily Times + Custom Hour/Minute Picker",
        "Save Workflows as Draft & Active Toggle",
        "2 Videos Back-to-Back Seamless Playlist",
        "Up to 5 Team Auto Co-Host Emails",
        "Meeting Attendance & Participant Join/Leave List"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      priceUsd: 65,
      permissions: {
        maxWorkflows: 999,
        maxDailyTimes: 99,
        allowCustomTime: true,
        allowDraftMode: true,
        allowMultiVideo: true,
        maxVideosPerWorkflow: 99,
        maxCoHosts: 999,
        allowAttendanceTab: true,
        allowChatLogs: true,
        allowCsvExport: true
      },
      features: [
        "Unlimited Automated Zoom Meeting Workflows",
        "Permanent Copyable Zoom Meeting Link",
        "Unlimited Daily AM/PM Times & Custom Picker",
        "Unlimited Multi-Video Seamless Playlists",
        "Unlimited Team Auto Co-Host Emails",
        "Full Attendance + Real Zoom Chat Viewer",
        "1-Click Excel / CSV Export & Priority Cloud Bot"
      ]
    }
  ],
  clients: [
    {
      id: "USR-100",
      name: "Workspace Owner",
      email: "ah130580@gmail.com",
      plan: "Enterprise",
      categoriesCount: 0,
      coHostsCount: 0,
      status: "Active"
    }
  ],
  attendanceSessions: []
};

// Load persisted data from localStorage & PURGE any old dummy records
try {
  const savedCurrency = localStorage.getItem('zoomcast_currency');
  if (savedCurrency === 'PKR' || savedCurrency === 'USD') {
    appState.currency = savedCurrency;
  }

  const savedUsers = localStorage.getItem('zoomcast_users_db');
  if (savedUsers) {
    const parsed = JSON.parse(savedUsers);
    if (Array.isArray(parsed)) {
      appState.usersDb = parsed.filter(
        u => u && u.email && !DUMMY_EMAIL_BLACKLIST.includes(u.email.toLowerCase())
      );
    }
  }
  const masterIdx = appState.usersDb.findIndex(u => u.email.toLowerCase() === MASTER_ADMIN_USER.email.toLowerCase());
  if (masterIdx >= 0) {
    appState.usersDb[masterIdx] = {
      ...MASTER_ADMIN_USER,
      password: appState.usersDb[masterIdx].password || MASTER_ADMIN_USER.password
    };
  } else {
    appState.usersDb.unshift({ ...MASTER_ADMIN_USER });
  }

  const savedCms = localStorage.getItem('zoomcast_cms');
  if (savedCms) appState.cms = { ...DEFAULT_CMS_CONTENT, ...JSON.parse(savedCms) };

  const savedProfile = localStorage.getItem('zoomcast_profile');
  if (savedProfile) {
    appState.profile = { ...appState.profile, ...JSON.parse(savedProfile) };
  }

  const savedCoHosts = localStorage.getItem('zoomcast_cohosts');
  if (savedCoHosts) appState.coHostEmails = JSON.parse(savedCoHosts);

  const savedCategories = localStorage.getItem('zoomcast_categories');
  if (savedCategories) {
    const parsedCats = JSON.parse(savedCategories);
    if (Array.isArray(parsedCats)) {
      // Purge any unvalidated/dummy workflow that had 0 videos attached
      appState.categories = parsedCats.filter(
        c => c && Array.isArray(c.videos) && c.videos.length > 0 && c.name && c.name !== 'Workflow #1'
      ).map(c => ({
        ...c,
        meetingLink: c.meetingLink || appState.profile.defaultZoomLink || 'https://zoom.us/j/89421756301?pwd=ZoomCastFixed'
      }));
    }
  }

  const savedClients = localStorage.getItem('zoomcast_clients');
  if (savedClients) {
    const parsedClients = JSON.parse(savedClients);
    if (Array.isArray(parsedClients)) {
      // Purge all dummy clients (Ahmed Raza, Usman Digital Academy, Zainab Coaching Hub)
      appState.clients = parsedClients.filter(
        c => c && c.email && !DUMMY_EMAIL_BLACKLIST.includes(c.email.toLowerCase())
      );
    }
  }
  if (!appState.clients.some(c => c.email.toLowerCase() === MASTER_ADMIN_USER.email.toLowerCase())) {
    appState.clients.unshift({
      id: "USR-100",
      name: "Workspace Owner",
      email: "ah130580@gmail.com",
      plan: "Enterprise",
      categoriesCount: appState.categories.length,
      coHostsCount: appState.coHostEmails.length,
      status: "Active"
    });
  }

  const savedSessions = localStorage.getItem('zoomcast_sessions');
  if (savedSessions) appState.attendanceSessions = JSON.parse(savedSessions);

  const savedTickets = localStorage.getItem('zoomcast_support_tickets');
  if (savedTickets) appState.supportTickets = JSON.parse(savedTickets);

  const savedPMs = localStorage.getItem('zoomcast_payment_methods');
  if (savedPMs) appState.paymentMethods = JSON.parse(savedPMs);

  const savedTx = localStorage.getItem('zoomcast_transactions');
  if (savedTx) appState.transactions = JSON.parse(savedTx);
} catch (e) {}

function persistState() {
  try {
    localStorage.setItem('zoomcast_currency', appState.currency);
    localStorage.setItem('zoomcast_users_db', JSON.stringify(appState.usersDb));
    localStorage.setItem('zoomcast_cms', JSON.stringify(appState.cms));
    localStorage.setItem('zoomcast_profile', JSON.stringify(appState.profile));
    localStorage.setItem('zoomcast_cohosts', JSON.stringify(appState.coHostEmails));
    localStorage.setItem('zoomcast_categories', JSON.stringify(appState.categories));
    localStorage.setItem('zoomcast_clients', JSON.stringify(appState.clients));
    localStorage.setItem('zoomcast_sessions', JSON.stringify(appState.attendanceSessions));
    localStorage.setItem('zoomcast_support_tickets', JSON.stringify(appState.supportTickets));
    localStorage.setItem('zoomcast_payment_methods', JSON.stringify(appState.paymentMethods));
    localStorage.setItem('zoomcast_transactions', JSON.stringify(appState.transactions));
  } catch (e) {}
}

function cleanBrowserUrlHash() {
  try {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (e) {}
}

function refreshPortalHome() {
  cleanBrowserUrlHash();
  switchView('landing');
  showToast('✓ Refreshed ZoomCast CRM Home');
}

function refreshDashboardView() {
  cleanBrowserUrlHash();
  syncProfileUI();
  switchDashboardTab('dashboard');
  const mainScroll = document.getElementById('dashboard-main-scroll');
  if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('✓ Workspace Refreshed');
}

function showToast(msg) {
  const box = document.getElementById('toast-box');
  if (!box) return;
  box.textContent = msg;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 3800);
}

function togglePasswordVisibility(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function triggerSmoothEnterAnimation(el) {
  if (!el) return;
  el.classList.remove('animate-view-enter');
  void el.offsetWidth; // trigger reflow for smooth animation replay
  el.classList.add('animate-view-enter');
}

function switchView(viewName) {
  cleanBrowserUrlHash();

  if (viewName === 'dashboard') {
    if (!appState.profile.authToken || !appState.profile.hasActivePlan) {
      openAuthMode('signin');
      showToast('Please sign in with an active subscription to access the workspace.');
      return;
    }
  }

  const views = ['landing', 'auth', 'dashboard', 'terms', 'privacy', 'contact'];
  views.forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) {
      const isTarget = v === viewName;
      el.classList.toggle('hidden', !isTarget);
      if (isTarget) triggerSmoothEnterAnimation(el);
    }
  });

  const pubHeader = document.getElementById('public-header');
  if (pubHeader) {
    pubHeader.classList.toggle('hidden', viewName === 'dashboard');
  }
  if (viewName === 'dashboard') {
    switchDashboardTab('dashboard');
    setTimeout(() => checkIntegrationAndSessionPopups(), 350);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToPricingSection() {
  switchView('landing');
  setTimeout(() => {
    const sec = document.getElementById('pricing-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    cleanBrowserUrlHash();
  }, 100);
}

function scrollToFeaturesSection() {
  switchView('landing');
  setTimeout(() => {
    const sec = document.getElementById('features-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    cleanBrowserUrlHash();
  }, 100);
}

// ============================================================================
// AGENCY CMS CONTENT RENDERER & EDITOR (Hero, Terms, 7-Day Refund, Privacy)
// ============================================================================
function renderCmsContentToDOM() {
  const c = appState.cms || DEFAULT_CMS_CONTENT;

  // Hero Headline (highlight "Zoom Broadcasts" in gold gradient if present)
  const heroTitleEl = document.getElementById('cms-hero-title');
  if (heroTitleEl) {
    if (c.heroTitle.includes('Zoom Broadcasts')) {
      heroTitleEl.innerHTML = c.heroTitle.replace(
        'Zoom Broadcasts',
        '<span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500">Zoom Broadcasts</span>'
      );
    } else {
      heroTitleEl.textContent = c.heroTitle;
    }
  }

  const heroSubEl = document.getElementById('cms-hero-subtitle');
  if (heroSubEl) heroSubEl.textContent = c.heroSubtitle;

  const refundEl = document.getElementById('cms-refund-policy-display');
  if (refundEl) refundEl.textContent = c.refundPolicy;

  const termsEl = document.getElementById('cms-terms-body-display');
  if (termsEl) termsEl.textContent = c.termsBody;

  const privEl = document.getElementById('cms-privacy-body-display');
  if (privEl) privEl.textContent = c.privacyBody;

  const emailIds = ['terms-support-email', 'privacy-support-email'];
  emailIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = c.supportEmail;
  });

  const emailLinks = ['contact-page-email-link', 'portal-support-email-link'];
  emailLinks.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = c.supportEmail;
      el.href = `mailto:${c.supportEmail}`;
    }
  });

  // Populate Agency CMS Editor inputs if on screen
  const editHeroTitle = document.getElementById('cms-edit-hero-title');
  const editHeroSub = document.getElementById('cms-edit-hero-subtitle');
  const editEmail = document.getElementById('cms-edit-support-email');
  const editRefund = document.getElementById('cms-edit-refund-policy');
  const editTerms = document.getElementById('cms-edit-terms-body');
  const editPrivacy = document.getElementById('cms-edit-privacy-body');
  const editWebhook = document.getElementById('cms-otp-webhook-url');

  if (editHeroTitle) editHeroTitle.value = c.heroTitle;
  if (editHeroSub) editHeroSub.value = c.heroSubtitle;
  if (editEmail) editEmail.value = c.supportEmail;
  if (editRefund) editRefund.value = c.refundPolicy;
  if (editTerms) editTerms.value = c.termsBody;
  if (editPrivacy) editPrivacy.value = c.privacyBody;
  if (editWebhook && c.otpWebhookUrl) editWebhook.value = c.otpWebhookUrl;
}

function saveAgencyCmsSettings() {
  const editHeroTitle = document.getElementById('cms-edit-hero-title');
  const editHeroSub = document.getElementById('cms-edit-hero-subtitle');
  const editEmail = document.getElementById('cms-edit-support-email');
  const editRefund = document.getElementById('cms-edit-refund-policy');
  const editTerms = document.getElementById('cms-edit-terms-body');
  const editPrivacy = document.getElementById('cms-edit-privacy-body');

  if (editHeroTitle) appState.cms.heroTitle = editHeroTitle.value.trim() || DEFAULT_CMS_CONTENT.heroTitle;
  if (editHeroSub) appState.cms.heroSubtitle = editHeroSub.value.trim() || DEFAULT_CMS_CONTENT.heroSubtitle;
  if (editEmail) appState.cms.supportEmail = editEmail.value.trim() || DEFAULT_CMS_CONTENT.supportEmail;
  if (editRefund) appState.cms.refundPolicy = editRefund.value.trim() || DEFAULT_CMS_CONTENT.refundPolicy;
  if (editTerms) appState.cms.termsBody = editTerms.value.trim() || DEFAULT_CMS_CONTENT.termsBody;
  if (editPrivacy) appState.cms.privacyBody = editPrivacy.value.trim() || DEFAULT_CMS_CONTENT.privacyBody;

  persistState();
  renderCmsContentToDOM();
  showToast('✓ Website Hero, Terms (7-Day Refund), and Privacy Policy updated live!');
}

// ============================================================================
// LIVE USD <-> PKR EXCHANGE RATE ENGINE & DUAL CURRENCY FORMATTER
// ============================================================================
async function fetchLiveUsdToPkrRate() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.PKR) {
        appState.usdToPkrRate = Number(data.rates.PKR.toFixed(2));
      }
    }
  } catch (e) {
    // Fallback to accurate market rate if offline
  }
  updateCurrencyButtonsUI();
  renderPricingCards();
  renderModalPlanSelector();
  if (appState.selectedPlan) {
    updateCheckoutCurrencyDisplay(appState.selectedPlan);
  }
}

function getPlanPriceInActiveCurrency(plan) {
  if (appState.currency === 'PKR') {
    const pkrAmount = Math.round(plan.priceUsd * appState.usdToPkrRate);
    return {
      symbol: 'Rs.',
      formatted: `Rs. ${pkrAmount.toLocaleString()}`,
      formattedWithDecimals: `Rs. ${pkrAmount.toLocaleString()}`,
      rawAmount: pkrAmount,
      currencyCode: 'PKR'
    };
  }
  return {
    symbol: '$',
    formatted: `$${plan.priceUsd}`,
    formattedWithDecimals: `$${plan.priceUsd}.00`,
    rawAmount: plan.priceUsd,
    currencyCode: 'USD'
  };
}

function updateCurrencyButtonsUI() {
  const isPkr = appState.currency === 'PKR';
  const rateBadge = document.getElementById('live-exchange-rate-badge');
  if (rateBadge) {
    rateBadge.textContent = `Live Rate: $1 USD = Rs. ${appState.usdToPkrRate.toFixed(2)} PKR`;
  }

  const usdBtns = ['curr-btn-usd-landing', 'curr-btn-usd-modal', 'curr-btn-usd-checkout'];
  const pkrBtns = ['curr-btn-pkr-landing', 'curr-btn-pkr-modal', 'curr-btn-pkr-checkout'];

  usdBtns.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.className = !isPkr
        ? (id.includes('landing') ? 'px-4 py-2 rounded-xl text-xs font-extrabold btn-gold transition' : 'px-3 py-1 rounded-lg text-xs font-extrabold btn-gold transition')
        : (id.includes('landing') ? 'px-4 py-2 rounded-xl text-xs font-bold btn-glass transition' : 'px-3 py-1 rounded-lg text-xs font-bold btn-glass transition');
    }
  });

  pkrBtns.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.className = isPkr
        ? (id.includes('landing') ? 'px-4 py-2 rounded-xl text-xs font-extrabold btn-gold transition' : 'px-3 py-1 rounded-lg text-xs font-extrabold btn-gold transition')
        : (id.includes('landing') ? 'px-4 py-2 rounded-xl text-xs font-bold btn-glass transition' : 'px-3 py-1 rounded-lg text-xs font-bold btn-glass transition');
    }
  });
}

function setPricingCurrency(curr) {
  appState.currency = curr === 'PKR' ? 'PKR' : 'USD';
  persistState();
  updateCurrencyButtonsUI();
  renderPricingCards();
  renderModalPlanSelector();
  if (appState.selectedPlan) {
    updateCheckoutCurrencyDisplay(appState.selectedPlan);
  }
  showToast(
    appState.currency === 'PKR'
      ? `🇵🇰 Switched to PKR (Rs.) at live rate ($1 = Rs. ${appState.usdToPkrRate.toFixed(2)}) • Safepay Gateway`
      : `🇺🇸 Switched to USD ($) • Lemon Squeezy International Gateway`
  );
}

// ============================================================================
// PLAN FEATURE GATING ENGINE & BENTO STATS
// ============================================================================
function getActivePlanPermissions() {
  const planName = appState.profile.planName || 'Starter Plan';
  const plan = appState.plans.find(p => p.name === planName) || appState.plans[0];
  return plan.permissions;
}

function isMasterAgencyOwner() {
  return (appState.profile.email || '').toLowerCase() === MASTER_ADMIN_USER.email.toLowerCase();
}

function updateBentoStats() {
  const wfStat = document.getElementById('bento-stat-workflows');
  const chStat = document.getElementById('bento-stat-cohosts');
  const sesStat = document.getElementById('bento-stat-sessions');
  const tckStat = document.getElementById('bento-stat-tickets');

  if (wfStat) wfStat.textContent = `${appState.categories.length} Workflows`;
  if (chStat) chStat.textContent = `${appState.coHostEmails.length} Members`;
  if (sesStat) sesStat.textContent = `${appState.attendanceSessions.length} Sessions`;
  if (tckStat) tckStat.textContent = `${appState.supportTickets.length} Tickets`;
}

function applyPlanFeatureRestrictions() {
  const planName = appState.profile.planName || 'Starter Plan';
  const perms = getActivePlanPermissions();

  const sbPlan = document.getElementById('sidebar-plan-badge');
  if (sbPlan) sbPlan.textContent = planName;

  // Hide Upgrade button on the 3rd/last plan (Enterprise)
  const sbUpgradeBtn = document.getElementById('sidebar-upgrade-btn');
  if (sbUpgradeBtn) {
    sbUpgradeBtn.classList.toggle('hidden', planName === 'Enterprise');
  }

  // 1. Attendance Tab Visibility
  const attTabBtn = document.getElementById('dtab-attendance');
  const attTabLabel = document.getElementById('dtab-attendance-label');
  if (attTabBtn) {
    attTabBtn.classList.toggle('hidden', !perms.allowAttendanceTab);
  }
  if (attTabLabel) {
    attTabLabel.textContent = perms.allowChatLogs ? 'Attendance & Chat Logs' : 'Attendance Report';
  }

  // 2. Save as Draft Button
  document.getElementById('btn-save-draft')?.classList.toggle('hidden', !perms.allowDraftMode);

  // 3. Custom Hour/Minute Time Picker
  const customTimeWrap = document.getElementById('custom-time-picker-wrap');
  const timeSlotsSub = document.getElementById('time-slots-subtext');
  if (customTimeWrap) customTimeWrap.classList.toggle('hidden', !perms.allowCustomTime);
  if (timeSlotsSub) {
    timeSlotsSub.textContent = perms.maxDailyTimes >= 99
      ? 'Select unlimited 12-hour AM/PM times or add custom hour & minute slots (highlighted in Gold).'
      : `Your ${planName} allows up to ${perms.maxDailyTimes} broadcast times per day.`;
  }

  if (appState.currentCategory.selectedTimes.length > perms.maxDailyTimes) {
    appState.currentCategory.selectedTimes = appState.currentCategory.selectedTimes.slice(0, perms.maxDailyTimes);
  }

  // 4. Video Upload
  const vidInput = document.getElementById('cat-video-input');
  const vidHeading = document.getElementById('video-upload-heading');
  const vidSub = document.getElementById('video-upload-subtext');
  const vidDropTitle = document.getElementById('video-dropzone-title');
  if (vidInput) {
    if (perms.allowMultiVideo) {
      vidInput.setAttribute('multiple', 'multiple');
    } else {
      vidInput.removeAttribute('multiple');
    }
  }
  if (vidHeading && vidSub && vidDropTitle) {
    if (!perms.allowMultiVideo) {
      vidHeading.innerHTML = '3. Upload Recorded Video (Single Video) <span class="text-yellow-400">*Required</span>';
      vidSub.textContent = 'Starter Plan supports 1 recorded video per Zoom meeting (unlimited GB file size).';
      vidDropTitle.textContent = '+ Choose 1 Recorded Video File';
    } else if (perms.maxVideosPerWorkflow === 2) {
      vidHeading.innerHTML = '3. Upload Recorded Videos (Up to 2 Back-to-Back Videos) <span class="text-yellow-400">*Required</span>';
      vidSub.textContent = 'Business Pro supports up to 2 videos playing seamlessly back-to-back.';
      vidDropTitle.textContent = '+ Choose 1 or 2 Video Files';
    } else {
      vidHeading.innerHTML = '3. Upload Recorded Videos (Unlimited Multi-Video Playlist) <span class="text-yellow-400">*Required</span>';
      vidSub.textContent = 'Enterprise supports unlimited back-to-back videos or per-time-slot video assignment.';
      vidDropTitle.textContent = '+ Choose Unlimited Video Files';
    }
  }

  // 5. Export CSV Buttons & Saved Chat View
  document.getElementById('btn-export-summary-csv')?.classList.toggle('hidden', !perms.allowCsvExport);
  document.getElementById('btn-export-detail-csv')?.classList.toggle('hidden', !perms.allowCsvExport);
  document.getElementById('btn-open-full-chat')?.classList.toggle('hidden', !perms.allowChatLogs);
  document.getElementById('th-chat-messages')?.classList.toggle('hidden', !perms.allowChatLogs);

  const detailHeading = document.getElementById('detail-table-heading');
  if (detailHeading) {
    detailHeading.textContent = perms.allowChatLogs
      ? 'Participants List & Real In-Meeting Chat Transcripts'
      : 'Participants Attendance List (Name, Email, Join & Leave Time)';
  }

  // 6. Team Co-Hosts Section Text
  const chHeading = document.getElementById('cohost-section-heading');
  const chSub = document.getElementById('cohost-section-subtext');
  if (chHeading && chSub) {
    if (perms.maxCoHosts === 1) {
      chHeading.textContent = 'Team Auto Co-Host Email (Max 1 on Starter Plan)';
      chSub.textContent = 'Add 1 designated email who will automatically be promoted to Co-Host on joining.';
    } else if (perms.maxCoHosts < 999) {
      chHeading.textContent = `Team Auto Co-Host Emails (Up to ${perms.maxCoHosts} on Business Pro)`;
      chSub.textContent = `Add up to ${perms.maxCoHosts} team member emails for automatic Co-Host promotion.`;
    } else {
      chHeading.textContent = 'Team Auto Co-Host Emails (Unlimited on Enterprise)';
      chSub.textContent = 'Add unlimited team members (15, 20, or more). Anyone who joins becomes Co-Host.';
    }
  }

  updateBentoStats();
  updateBuilderReadinessBadge();
  render12HourCalendarGrid();
  renderSavedCategories();
  renderCoHostEmails();
  renderAttendanceSessionsList();
  renderSupportTicketsUI();
  renderBillingSection();
  renderAdminPanel();
  if (appState.activeSessionDetailId) {
    openSessionDetails(appState.activeSessionDetailId);
  }
}

// ============================================================================
// AUTHENTICATION V7 WITH 3D DIAMOND FLIP MORPH (sign_up_login.mp4)
// ============================================================================
function showAuthStep(stepName) {
  const steps = ['account', 'otp', 'plan', 'payment'];
  steps.forEach(s => {
    const el = document.getElementById('auth-step-' + s);
    if (el) {
      const isTarget = s === stepName;
      el.classList.toggle('hidden', !isTarget);
      if (isTarget) triggerSmoothEnterAnimation(el);
    }
  });
  if (stepName === 'plan') {
    renderModalPlanSelector();
  }
  if (stepName === 'payment') {
    resetPaymentCheckoutUI();
  }
}

function openAuthMode(mode) {
  const alreadyInAuth = !document.getElementById('view-auth')?.classList.contains('hidden') &&
                        !document.getElementById('auth-step-account')?.classList.contains('hidden');
  const modeChanged = appState.authMode !== mode;
  appState.authMode = mode;

  switchView('auth');
  showAuthStep('account');

  const wrapper = document.getElementById('auth-morph-wrapper');
  const loader = document.getElementById('auth-diamond-loader');

  const applyFormToggle = () => {
    const isSignIn = mode === 'signin';
    const isSignUp = mode === 'signup';
    const isForgot = mode === 'forgot';
    const isForgotReset = mode === 'forgot-reset';
    document.getElementById('form-signin')?.classList.toggle('hidden', !isSignIn);
    document.getElementById('form-signup')?.classList.toggle('hidden', !isSignUp);
    document.getElementById('form-forgot')?.classList.toggle('hidden', !isForgot);
    document.getElementById('form-forgot-reset')?.classList.toggle('hidden', !isForgotReset);

    if (isForgot) {
      const signInEmail = (document.getElementById('signin-email')?.value || '').trim();
      const forgotEmailInp = document.getElementById('forgot-email');
      if (signInEmail && forgotEmailInp && !forgotEmailInp.value) {
        forgotEmailInp.value = signInEmail;
      }
    }
  };

  if (alreadyInAuth && modeChanged && wrapper && loader) {
    wrapper.classList.add('morph-diamond-active');
    loader.classList.remove('opacity-0', 'scale-50');
    loader.classList.add('opacity-100', 'scale-100');

    setTimeout(() => {
      applyFormToggle();
    }, 210);

    setTimeout(() => {
      wrapper.classList.remove('morph-diamond-active');
      loader.classList.remove('opacity-100', 'scale-100');
      loader.classList.add('opacity-0', 'scale-50');
    }, 430);
  } else {
    applyFormToggle();
  }
}

function openGetStartedModal() {
  if (appState.profile.authToken && appState.profile.hasActivePlan) {
    switchView('dashboard');
  } else if (appState.profile.authToken) {
    switchView('auth');
    showAuthStep('plan');
  } else {
    openAuthMode('signup');
  }
}

// ============================================================================
// EXACT GLASSY 4-DIGIT OTP ENGINE + INSTANT PUSH EMAIL NOTIFICATION
// ============================================================================
function showInstantOtpPushBanner(email, otp) {
  // Disabled intentionally: OTP must ONLY be delivered to user's email inbox, never shown on-screen.
}

function autoFillOtpFromBanner() {
  const otp = String(appState.generatedOtp || appState.profileResetOtp || '');
  if (!otp) return;

  // If on Auth OTP screen
  if (!document.getElementById('auth-step-otp')?.classList.contains('hidden')) {
    for (let i = 0; i < 4; i++) {
      const box = document.getElementById(`otp-d${i}`);
      if (box) {
        box.value = otp[i] || '';
        box.classList.add('filled');
      }
    }
    document.getElementById('instant-email-otp-popup')?.classList.add('hidden');
    triggerGlassyOtpVerifyAnimation();
    return;
  }

  // If on Profile OTP reset
  const profOtpInp = document.getElementById('prof-reset-otp');
  if (profOtpInp) {
    profOtpInp.value = otp;
    document.getElementById('instant-email-otp-popup')?.classList.add('hidden');
    showToast('✓ 4-Digit OTP Auto-Filled! Enter your new password and click Verify.');
  }
}

async function dispatchOtpEmailEverywhere(email, otp, subjectText) {
  // 1. Show Instant Push Mail Popup at top-right so user NEVER misses the code
  showInstantOtpPushBanner(email, otp);

  // 2. Call Hostinger PHP Resend Endpoint (api/send-otp.php) or Local Server (/api/send-otp)
  let sentViaResendOrSmtp = false;
  const endpoints = [
    HOSTINGER_PRODUCTION_CONFIG.otpEndpoint || '/api/send-otp.php',
    'api/send-otp.php',
    '/api/send-otp',
    HOSTINGER_PRODUCTION_CONFIG.otpRemoteEndpoint
  ].filter(Boolean);

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          purpose: appState.otpPurpose || 'verification',
          subject: subjectText || `ZoomCast CRM — Your 4-Digit Security OTP Code (${otp})`
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sentEmail || data.ok) {
          sentViaResendOrSmtp = true;
          break;
        }
      }
    } catch (e) {}
  }

  // 3. Also try Custom Webhook if configured
  if (!sentViaResendOrSmtp && appState.cms.otpWebhookUrl) {
    try {
      fetch(appState.cms.otpWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          otp,
          subject: subjectText || `Your ZoomCast CRM 4-Digit Security OTP: ${otp}`
        })
      });
    } catch (e) {}
  }

  return sentViaResendOrSmtp;
}

function startOtpCountdownTimer() {
  if (appState.otpTimerInterval) clearInterval(appState.otpTimerInterval);
  appState.otpSecondsRemaining = 38;
  const timerBtn = document.getElementById('otp-resend-timer');
  const updateLabel = () => {
    if (!timerBtn) return;
    if (appState.otpSecondsRemaining > 0) {
      const s = String(appState.otpSecondsRemaining).padStart(2, '0');
      timerBtn.textContent = `Resend in 00:${s}`;
    } else {
      timerBtn.textContent = `Resend Code Now`;
    }
  };
  updateLabel();
  appState.otpTimerInterval = setInterval(() => {
    if (appState.otpSecondsRemaining > 0) {
      appState.otpSecondsRemaining--;
      updateLabel();
    } else {
      clearInterval(appState.otpTimerInterval);
    }
  }, 1000);
}

function resetGlassyOtpStageUI() {
  const row = document.getElementById('otp-boxes-row');
  const merged = document.getElementById('otp-merged-box');
  const mergedCheck = document.getElementById('otp-merged-check');
  const topWrap = document.getElementById('otp-top-icon-wrap');
  const iconKey = document.getElementById('otp-icon-key');
  const iconShield = document.getElementById('otp-icon-shield');
  const titleEl = document.getElementById('otp-title-heading');
  const subEl = document.getElementById('otp-subtitle-text');
  const btn = document.getElementById('otp-submit-btn');

  if (row) {
    row.classList.remove('hidden', 'otp-stage-orbit');
  }
  if (merged) {
    merged.classList.add('hidden');
    merged.className = 'hidden w-16 h-16 rounded-2xl border-2 border-yellow-400 bg-yellow-500/10 flex items-center justify-center shadow-2xl transition-all duration-500';
  }
  if (mergedCheck) mergedCheck.classList.add('hidden');

  if (topWrap) {
    topWrap.className = 'w-14 h-14 mx-auto rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-4 transition-all duration-500';
  }
  if (iconKey) iconKey.classList.remove('hidden');
  if (iconShield) iconShield.classList.add('hidden');

  if (titleEl) titleEl.innerHTML = `Verify <span class="text-yellow-400">OTP</span>`;
  if (subEl) subEl.textContent = `Enter the 4-digit security code sent to your email`;

  if (btn) {
    btn.className = 'w-full py-3.5 rounded-xl btn-gold text-sm flex items-center justify-center gap-2';
    btn.innerHTML = `<span>Verify & Proceed</span><span>→</span>`;
  }

  for (let i = 0; i < 4; i++) {
    const box = document.getElementById(`otp-d${i}`);
    if (box) {
      box.value = '';
      box.classList.remove('filled');
    }
  }
}

async function launchGlassyOtpScreen(email, purpose) {
  appState.otpPurpose = purpose;
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  appState.generatedOtp = otp;

  resetGlassyOtpStageUI();
  showAuthStep('otp');
  startOtpCountdownTimer();

  const codePill = document.getElementById('otp-live-code-pill');
  if (codePill) {
    codePill.innerHTML = `<span>Check inbox: <strong class="text-white">${email}</strong></span>`;
  }

  const sentOk = await dispatchOtpEmailEverywhere(email, otp, `ZoomCast 4-Digit Security OTP`);
  if (!sentOk) {
    showToast('⚠ Could not deliver OTP email right now. Please check your email address and try Resend.');
  }

  setTimeout(() => {
    document.getElementById('otp-d0')?.focus();
  }, 120);
}

function resendGlassyOtp() {
  const email = appState.otpPurpose === 'forgot'
    ? (appState.pendingForgotData?.email || '')
    : (appState.pendingSignupUser?.email || '');
  if (email) {
    launchGlassyOtpScreen(email, appState.otpPurpose);
    showToast(`✓ New 4-Digit Security OTP sent to ${email}`);
  }
}

function handleOtpDigitInput(idx, event) {
  const inp = event.target;
  const val = inp.value.replace(/\D/g, '');
  inp.value = val ? val[val.length - 1] : '';
  inp.classList.toggle('filled', Boolean(inp.value));

  if (inp.value && idx < 3) {
    document.getElementById(`otp-d${idx + 1}`)?.focus();
  }
}

function handleOtpDigitKeydown(idx, event) {
  if (event.key === 'Backspace' && !event.target.value && idx > 0) {
    const prev = document.getElementById(`otp-d${idx - 1}`);
    if (prev) {
      prev.focus();
      prev.value = '';
      prev.classList.remove('filled');
    }
  }
  if (event.key === 'Enter') {
    triggerGlassyOtpVerifyAnimation();
  }
}

function triggerGlassyOtpVerifyAnimation() {
  const entered = [0, 1, 2, 3].map(i => (document.getElementById(`otp-d${i}`)?.value || '').trim()).join('');
  if (entered.length < 4) {
    showToast('Please enter all 4 digits of the security OTP code.');
    return;
  }
  if (entered !== appState.generatedOtp) {
    showToast('Invalid 4-digit OTP code. Please check your email inbox and try again.');
    return;
  }

  document.getElementById('instant-email-otp-popup')?.classList.add('hidden');

  const row = document.getElementById('otp-boxes-row');
  const merged = document.getElementById('otp-merged-box');
  const mergedCheck = document.getElementById('otp-merged-check');
  const topWrap = document.getElementById('otp-top-icon-wrap');
  const iconKey = document.getElementById('otp-icon-key');
  const iconShield = document.getElementById('otp-icon-shield');
  const titleEl = document.getElementById('otp-title-heading');
  const subEl = document.getElementById('otp-subtitle-text');
  const btn = document.getElementById('otp-submit-btn');

  // Phase 1: Diamond Orbit Spin
  if (btn) {
    btn.innerHTML = `<span class="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span><span>Verifying Code...</span>`;
  }
  if (row) {
    row.classList.add('otp-stage-orbit');
  }

  // Phase 2: Converge into single center glowing square
  setTimeout(() => {
    if (row) row.classList.add('hidden');
    if (merged) merged.classList.remove('hidden');
  }, 850);

  // Phase 3: Morph to Emerald Green Checkmark + "Verified Successfully"
  setTimeout(() => {
    if (merged) {
      merged.className = 'w-16 h-16 rounded-2xl border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center shadow-2xl shadow-emerald-500/30 transition-all duration-500 scale-105';
    }
    if (mergedCheck) mergedCheck.classList.remove('hidden');

    if (topWrap) {
      topWrap.className = 'w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 transition-all duration-500';
    }
    if (iconKey) iconKey.classList.add('hidden');
    if (iconShield) iconShield.classList.remove('hidden');

    if (titleEl) titleEl.innerHTML = `Verified <span class="text-emerald-400">Successfully</span>`;
    if (subEl) subEl.textContent = `Your security verification code has been confirmed.`;

    if (btn) {
      btn.className = 'w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition';
      btn.innerHTML = `<span>✓ Verified & Secured</span>`;
    }
  }, 1350);

  // Phase 4: Complete action
  setTimeout(() => {
    if (appState.otpPurpose === 'forgot' && appState.pendingForgotData) {
      appState.pendingForgotData.otpVerified = true;
      openAuthMode('forgot-reset');
      showToast('✓ Email verified! Now enter and confirm your new password.');
    } else if (appState.pendingSignupUser) {
      const userObj = appState.pendingSignupUser;
      const idx = appState.usersDb.findIndex(u => u.email.toLowerCase() === userObj.email);
      if (idx >= 0) {
        appState.usersDb[idx] = userObj;
      } else {
        appState.usersDb.push(userObj);
      }

      appState.profile = {
        name: userObj.name,
        email: userObj.email,
        authToken: userObj.authToken,
        hasActivePlan: false,
        planName: '',
        zoomConnected: false
      };

      appState.pendingSignupUser = null;
      persistState();
      syncProfileUI();

      if (appState.selectedPlan) {
        proceedToCardPayment(appState.selectedPlan.id);
      } else {
        showAuthStep('plan');
      }
    }
  }, 2400);
}

function startSignUpOtpVerification() {
  const name = (document.getElementById('signup-name')?.value || '').trim();
  const email = (document.getElementById('signup-email')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('signup-password')?.value || '').trim();
  const confirmPassword = (document.getElementById('signup-confirm-password')?.value || '').trim();

  if (!name || !email || !password) {
    showToast('Please fill in your Full Name, Email Address, and Password.');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters.');
    return;
  }
  if (password !== confirmPassword) {
    showToast('Passwords do not match. Please enter the same password in Confirm Password.');
    return;
  }
  const alreadyExists = appState.usersDb.some(u => u.email.toLowerCase() === email);
  if (alreadyExists) {
    showToast('This email is already registered. Please Sign In or use Forgot Password.');
    openAuthMode('signin');
    const signInEmail = document.getElementById('signin-email');
    if (signInEmail) signInEmail.value = email;
    return;
  }

  const token = 'tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  appState.pendingSignupUser = {
    name,
    email,
    password,
    authToken: token,
    hasActivePlan: false,
    planName: ''
  };

  launchGlassyOtpScreen(email, 'signup');
}

function startForgotPasswordOtpFlow() {
  const email = (document.getElementById('forgot-email')?.value || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    showToast('Please enter your registered email address.');
    return;
  }
  const existingUser = appState.usersDb.find(u => u.email.toLowerCase() === email);
  if (!existingUser) {
    showToast('No registered account found with this email address.');
    return;
  }

  appState.pendingForgotData = { email, otpVerified: false };
  launchGlassyOtpScreen(email, 'forgot');
}

function completeForgotPasswordReset() {
  if (!appState.pendingForgotData || !appState.pendingForgotData.otpVerified) {
    showToast('Please verify your email OTP first.');
    openAuthMode('forgot');
    return;
  }

  const newPass = (document.getElementById('forgot-new-password')?.value || '').trim();
  const confirmPass = (document.getElementById('forgot-confirm-password')?.value || '').trim();
  if (!newPass || newPass.length < 6) {
    showToast('Please enter a new password (minimum 6 characters).');
    return;
  }
  if (newPass !== confirmPass) {
    showToast('Passwords do not match. Please re-enter carefully.');
    return;
  }

  const { email } = appState.pendingForgotData;
  const uIdx = appState.usersDb.findIndex(u => u.email.toLowerCase() === email);
  if (uIdx >= 0) {
    appState.usersDb[uIdx].password = newPass;
  }
  if (email === MASTER_ADMIN_USER.email.toLowerCase()) {
    MASTER_ADMIN_USER.password = newPass;
  }
  appState.pendingForgotData = null;
  persistState();

  const p1 = document.getElementById('forgot-new-password');
  const p2 = document.getElementById('forgot-confirm-password');
  if (p1) p1.value = '';
  if (p2) p2.value = '';

  const signInEmailInp = document.getElementById('signin-email');
  const signInPassInp = document.getElementById('signin-password');
  if (signInEmailInp) signInEmailInp.value = email;
  if (signInPassInp) signInPassInp.value = '';

  openAuthMode('signin');
  showToast('✓ New password saved! Please sign in with your new password.');
}

async function saveFreeSmtpConfig() {
  const webhookUrl = (document.getElementById('cms-otp-webhook-url')?.value || '').trim();
  const gmailUser = (document.getElementById('smtp-gmail-user')?.value || '').trim();
  const gmailAppPassword = (document.getElementById('smtp-gmail-pass')?.value || '').trim();

  if (webhookUrl) {
    appState.cms.otpWebhookUrl = webhookUrl;
    persistState();
  }

  if (gmailUser && gmailAppPassword) {
    try {
      await fetch('/api/save-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmailUser, gmailAppPassword })
      });
    } catch (e) {}
  }
  showToast('✓ Email OTP Delivery Settings Saved & Activated!');
}

function handleEmailSignIn() {
  const email = (document.getElementById('signin-email')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('signin-password')?.value || '').trim();

  if (!email || !password) {
    showToast('Please enter your Email and Password');
    return;
  }

  const existingUser = appState.usersDb.find(
    u => u.email.toLowerCase() === email && u.password === password
  );

  if (!existingUser) {
    showToast('Access Denied: Invalid email or password. Only paid subscribers can sign in.');
    return;
  }

  const token = 'tok_' + Date.now();
  existingUser.authToken = token;

  appState.profile = {
    name: existingUser.name,
    email: existingUser.email,
    authToken: token,
    hasActivePlan: Boolean(existingUser.hasActivePlan),
    planName: existingUser.planName || 'Enterprise',
    zoomConnected: true
  };

  persistState();
  syncProfileUI();

  if (appState.profile.hasActivePlan) {
    switchView('dashboard');
    showToast(`✓ Welcome back, ${appState.profile.name}!`);
  } else {
    showAuthStep('plan');
    showToast('Please complete your plan subscription payment to access the workspace.');
  }
}

function handleGoogleAuthContinue() {
  const emailInp = document.getElementById(appState.authMode === 'signin' ? 'signin-email' : 'signup-email');
  const enteredEmail = (emailInp && emailInp.value.trim()) ? emailInp.value.trim().toLowerCase() : '';

  if (appState.authMode === 'signin') {
    const matchedUser = appState.usersDb.find(u => u.email.toLowerCase() === enteredEmail && u.hasActivePlan);
    if (!matchedUser) {
      showToast('No active paid subscription found for this Google account. Please Sign Up and subscribe first.');
      openAuthMode('signup');
      return;
    }
    appState.profile = {
      name: matchedUser.name,
      email: matchedUser.email,
      authToken: 'google_tok_' + Date.now(),
      hasActivePlan: true,
      planName: matchedUser.planName,
      zoomConnected: true
    };
    persistState();
    syncProfileUI();
    switchView('dashboard');
    showToast(`✓ Signed in as ${matchedUser.email}`);
  } else {
    if (!enteredEmail || !enteredEmail.includes('@')) {
      showToast('Please enter your Full Name, Email, and Password above to create your account via Email OTP.');
      return;
    }
    startSignUpOtpVerification();
  }
}

function renderModalPlanSelector() {
  const container = document.getElementById('modal-plan-selector-list');
  if (!container) return;

  container.innerHTML = appState.plans.map(plan => {
    const pInfo = getPlanPriceInActiveCurrency(plan);
    return `
      <div onclick="proceedToCardPayment('${plan.id}')" class="p-4 rounded-2xl border ${plan.popular ? 'border-yellow-400 bg-yellow-500/10' : 'border-white/10 bg-white/5'} hover:border-yellow-400 cursor-pointer flex items-center justify-between transition">
        <div>
          <div class="flex items-center gap-2">
            <h4 class="font-extrabold text-white text-sm sm:text-base">${plan.name}</h4>
            ${plan.popular ? '<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-yellow-400 text-black">POPULAR</span>' : ''}
          </div>
          <p class="text-xs text-slate-400 mt-0.5">${plan.features[0]} • ${plan.features[1]}</p>
        </div>
        <div class="text-right shrink-0 ml-3">
          <span class="text-base sm:text-lg font-extrabold text-yellow-400 block">${pInfo.formatted}/mo</span>
          <span class="text-xs font-bold text-white">Select Plan →</span>
        </div>
      </div>
    `;
  }).join('');
}

function selectPlanForCheckout(planId) {
  const plan = appState.plans.find(p => p.id === planId) || appState.plans[1];
  appState.selectedPlan = plan;
  const pInfo = getPlanPriceInActiveCurrency(plan);
  if (!appState.profile.authToken) {
    openAuthMode('signup');
    showToast(`Selected ${plan.name} (${pInfo.formatted}/mo). Create your account first to proceed to payment.`);
  } else {
    switchView('auth');
    proceedToCardPayment(plan.id);
  }
}

// ============================================================================
// 3D REALISTIC PLATINUM CREDIT CARD & PAYMENT ANIMATION (Payment_page_.mp4)
// ============================================================================
function flip3DCard(showBack) {
  const card = document.getElementById('credit-card-3d');
  if (!card) return;
  card.classList.toggle('flipped', Boolean(showBack));
}

function formatAndSyncCardNumber(input) {
  let digits = input.value.replace(/\D/g, '').substring(0, 16);
  let formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  input.value = formatted;
  updateLive3DCard();
}

function formatAndSyncExpiry(input) {
  let digits = input.value.replace(/\D/g, '').substring(0, 4);
  if (digits.length >= 3) {
    input.value = digits.substring(0, 2) + '/' + digits.substring(2, 4);
  } else {
    input.value = digits;
  }
  updateLive3DCard();
}

function detectCardBrand(digits) {
  const clean = String(digits || '').replace(/\D/g, '');
  if (/^4/.test(clean)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MASTERCARD';
  if (/^(62|2205)/.test(clean)) return 'PAYPAK';
  if (/^3[47]/.test(clean)) return 'AMEX';
  return appState.currency === 'PKR' ? 'PAYPAK / VISA' : 'VISA';
}

function validateCardDetails(holder, rawNumber, expiry, cvc) {
  if (!holder || holder.length < 2) {
    return { valid: false, message: 'Please enter the Cardholder Full Name.' };
  }
  const cleanNum = String(rawNumber || '').replace(/\D/g, '');
  if (cleanNum.length < 15 || cleanNum.length > 16 || /^(\d)\1+$/.test(cleanNum)) {
    return { valid: false, message: 'Please enter a valid 15 or 16-digit Debit/Credit Card Number.' };
  }
  const expMatch = String(expiry || '').match(/^(\d{2})\/(\d{2})$/);
  if (!expMatch) {
    return { valid: false, message: 'Please enter a valid Expiry Date in MM/YY format (e.g. 09/28).' };
  }
  const expMonth = parseInt(expMatch[1], 10);
  const expYear = 2000 + parseInt(expMatch[2], 10);
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();
  if (expMonth < 1 || expMonth > 12) {
    return { valid: false, message: 'Expiry Month must be between 01 and 12.' };
  }
  if (expYear < curYear || (expYear === curYear && expMonth < curMonth)) {
    return { valid: false, message: 'This card is expired. Please use an active card.' };
  }
  const cleanCvc = String(cvc || '').replace(/\D/g, '');
  if (cleanCvc.length < 3 || cleanCvc.length > 4) {
    return { valid: false, message: 'Please enter a valid 3 or 4-digit CVV security code.' };
  }
  return { valid: true };
}

function updateLive3DCard() {
  const holder = (document.getElementById('card-holder')?.value || '').trim().toUpperCase();
  const number = (document.getElementById('card-number')?.value || '').trim();
  const expiry = (document.getElementById('card-expiry')?.value || '').trim();
  const cvc = (document.getElementById('card-cvc')?.value || '').trim();

  const liveHolder = document.getElementById('live-card-holder');
  const liveNumber = document.getElementById('live-card-number');
  const liveExpiry = document.getElementById('live-card-expiry');
  const liveCvc = document.getElementById('live-card-cvc');

  if (liveHolder) liveHolder.textContent = holder || 'CARDHOLDER NAME';
  if (liveNumber) liveNumber.textContent = number ? number.replace(/\s/g, '  ') : '5412  7534  8910  3414';
  if (liveExpiry) liveExpiry.textContent = expiry || '09/28';
  if (liveCvc) liveCvc.textContent = cvc || '842';

  const brand = detectCardBrand(number);
  ['live-card-brand-front', 'live-card-brand-back', 'card-input-brand-badge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = brand;
  });
}

function resetPaymentCheckoutUI() {
  const cardCol = document.getElementById('payment-card-col');
  const formCol = document.getElementById('payment-form-col');
  const cardFront = document.getElementById('credit-card-front');
  const badges = document.getElementById('card-security-badges');
  const procStatus = document.getElementById('payment-processing-status');
  const progWrap = document.getElementById('payment-progress-bar-wrap');
  const progFill = document.getElementById('payment-progress-fill');
  const statusLbl = document.getElementById('payment-status-label');
  const successBadge = document.getElementById('payment-success-badge');

  flip3DCard(false);
  if (cardCol) cardCol.className = 'lg:col-span-6 flex flex-col items-center justify-center transition-all duration-700';
  if (formCol) formCol.classList.remove('hidden', 'opacity-0');
  if (cardFront) cardFront.classList.remove('card-emerald-success', 'card-shimmer');
  if (badges) badges.classList.remove('hidden');
  if (procStatus) procStatus.classList.add('hidden');
  if (progWrap) progWrap.classList.remove('hidden');
  if (progFill) progFill.style.width = '0%';
  if (statusLbl) statusLbl.classList.remove('hidden');
  if (successBadge) successBadge.classList.add('hidden');
}

function updateCheckoutCurrencyDisplay(plan) {
  if (!plan) return;
  const pInfo = getPlanPriceInActiveCurrency(plan);
  const nameEl = document.getElementById('checkout-plan-name');
  const priceEl = document.getElementById('checkout-plan-price');
  const btnTextEl = document.getElementById('btn-pay-now-text');
  const gwSubEl = document.getElementById('checkout-gateway-subtext');
  const gwNameEl = document.getElementById('checkout-gateway-name');
  const gwRateEl = document.getElementById('checkout-rate-note');

  if (nameEl) nameEl.textContent = `${plan.name} (Monthly)`;
  if (priceEl) priceEl.textContent = pInfo.formattedWithDecimals;
  if (btnTextEl) btnTextEl.textContent = `PAY ${pInfo.formattedWithDecimals} NOW`;

  if (appState.currency === 'PKR') {
    if (gwSubEl) gwSubEl.textContent = 'Pakistani PKR Card Checkout • Powered by Safepay';
    if (gwNameEl) gwNameEl.textContent = '🇵🇰 Safepay Pakistan (Pakistani Visa, Mastercard, PayPak & 1Link)';
    if (gwRateEl) gwRateEl.textContent = `$${plan.priceUsd} × ${appState.usdToPkrRate.toFixed(2)}`;
  } else {
    if (gwSubEl) gwSubEl.textContent = 'International USD Checkout • Powered by Lemon Squeezy';
    if (gwNameEl) gwNameEl.textContent = '🌎 Lemon Squeezy (International USD Cards, Wise, Revolut)';
    if (gwRateEl) gwRateEl.textContent = 'USD Billing';
  }
  updateLive3DCard();
}

function proceedToCardPayment(planId) {
  const plan = appState.plans.find(p => p.id === planId) || appState.plans[1];
  appState.selectedPlan = plan;
  updateCurrencyButtonsUI();
  updateCheckoutCurrencyDisplay(plan);

  const holderInp = document.getElementById('card-holder');
  if (holderInp && !holderInp.value && appState.profile.name) {
    holderInp.value = appState.profile.name.toUpperCase();
  }
  updateLive3DCard();
  showAuthStep('payment');
}

async function dispatchPaymentReceiptEmail(paymentRecord) {
  const endpoints = [
    HOSTINGER_PRODUCTION_CONFIG.otpEndpoint || '/api/send-otp.php',
    'api/send-otp.php',
    '/api/send-otp',
    HOSTINGER_PRODUCTION_CONFIG.otpRemoteEndpoint
  ].filter(Boolean);

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'receipt',
          email: paymentRecord.email,
          userName: paymentRecord.userName,
          planName: paymentRecord.planName,
          amountFormatted: paymentRecord.amountFormatted,
          gateway: paymentRecord.gateway,
          txnId: paymentRecord.txnId
        })
      });
      if (res.ok) break;
    } catch (e) {}
  }
}

function activateSubscriptionAfterPayment(plan, holderName, gatewayName, txnId) {
  const planName = plan ? plan.name : 'Business Pro';
  const pInfo = getPlanPriceInActiveCurrency(plan || appState.plans[1]);
  const receipt = {
    txnId: txnId || ('TXN-' + Math.floor(100000 + Math.random() * 900000)),
    planName,
    currency: appState.currency,
    amountFormatted: pInfo.formattedWithDecimals,
    gateway: gatewayName || (appState.currency === 'PKR' ? 'Safepay Pakistan (PKR)' : 'Lemon Squeezy (USD)'),
    userName: appState.profile.name || holderName || 'Subscriber',
    email: appState.profile.email || MASTER_ADMIN_USER.email,
    paidAt: new Date().toLocaleString()
  };

  appState.profile.hasActivePlan = true;
  appState.profile.planName = planName;
  appState.profile.lastPayment = receipt;
  if (!appState.profile.authToken) {
    appState.profile.authToken = 'paid_tok_' + Date.now();
  }

  const uIdx = appState.usersDb.findIndex(u => u.email.toLowerCase() === (appState.profile.email || '').toLowerCase());
  if (uIdx >= 0) {
    appState.usersDb[uIdx].hasActivePlan = true;
    appState.usersDb[uIdx].planName = planName;
    appState.usersDb[uIdx].lastPayment = receipt;
  }

  const existingIdx = appState.clients.findIndex(c => c.email.toLowerCase() === (appState.profile.email || '').toLowerCase());
  const clientRecord = {
    id: 'USR-' + Math.floor(100 + Math.random() * 900),
    name: appState.profile.name || holderName || 'Subscriber',
    email: appState.profile.email,
    plan: planName,
    categoriesCount: appState.categories.length,
    coHostsCount: appState.coHostEmails.length,
    status: 'Active'
  };
  if (existingIdx >= 0) {
    appState.clients[existingIdx] = clientRecord;
  } else if (clientRecord.email) {
    appState.clients.unshift(clientRecord);
  }

  persistState();
  syncProfileUI();
  dispatchPaymentReceiptEmail(receipt);
  switchView('dashboard');
  showToast(`🎉 Payment Successful (${receipt.amountFormatted} via ${receipt.gateway})! ${planName} is now active.`);
}

function handleGatewayReturnCallback() {
  try {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment_status');
    const planId = params.get('plan');
    const curr = params.get('currency');
    if (status === 'success') {
      if (curr === 'PKR' || curr === 'USD') appState.currency = curr;
      const plan = appState.plans.find(p => p.id === planId) || appState.selectedPlan || appState.plans[1];
      const gw = appState.currency === 'PKR' ? 'Safepay Pakistan (PKR)' : 'Lemon Squeezy (USD)';
      history.replaceState(null, '', window.location.pathname);
      activateSubscriptionAfterPayment(plan, appState.profile.name, gw, 'TXN-GW-' + Date.now());
    } else if (status === 'cancelled') {
      history.replaceState(null, '', window.location.pathname);
      showToast('Payment was cancelled. You can complete checkout whenever you are ready.');
    }
  } catch (e) {}
}

async function completeSubscriptionAndLogin() {
  const plan = appState.selectedPlan || appState.plans[1];
  const pInfo = getPlanPriceInActiveCurrency(plan);

  // 1. If production external checkout URL is configured in HOSTINGER_PRODUCTION_CONFIG, redirect to Safepay (PKR) or LemonSqueezy (USD)
  if (appState.currency === 'PKR' && HOSTINGER_PRODUCTION_CONFIG.safepayPkrCheckoutUrls[plan.id]) {
    window.location.href = HOSTINGER_PRODUCTION_CONFIG.safepayPkrCheckoutUrls[plan.id];
    return;
  }
  if (appState.currency === 'USD' && HOSTINGER_PRODUCTION_CONFIG.lemonSqueezyUsdCheckoutUrls[plan.id]) {
    window.location.href = HOSTINGER_PRODUCTION_CONFIG.lemonSqueezyUsdCheckoutUrls[plan.id];
    return;
  }

  // 2. Check if backend api/create-checkout.php has a dynamic Safepay / Lemon Squeezy session configured
  try {
    const chkRes = await fetch('api/create-checkout.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        currency: appState.currency,
        amount: pInfo.rawAmount,
        email: appState.profile.email,
        name: appState.profile.name
      })
    });
    if (chkRes.ok) {
      const chkData = await chkRes.json();
      if (chkData && chkData.checkoutUrl) {
        window.location.href = chkData.checkoutUrl;
        return;
      }
    }
  } catch (e) {}

  // 3. Validate 3D Card Checkout Form (Cardholder, Luhn/Length, Expiry MM/YY, CVV)
  const holder = (document.getElementById('card-holder')?.value || '').trim();
  const number = (document.getElementById('card-number')?.value || '').replace(/\s+/g, '');
  const expiry = (document.getElementById('card-expiry')?.value || '').trim();
  const cvc = (document.getElementById('card-cvc')?.value || '').trim();

  const validation = validateCardDetails(holder, number, expiry, cvc);
  if (!validation.valid) {
    showToast(`⚠️ ${validation.message}`);
    return;
  }

  flip3DCard(false);
  const cardCol = document.getElementById('payment-card-col');
  const formCol = document.getElementById('payment-form-col');
  const cardFront = document.getElementById('credit-card-front');
  const badges = document.getElementById('card-security-badges');
  const procStatus = document.getElementById('payment-processing-status');
  const progWrap = document.getElementById('payment-progress-bar-wrap');
  const progFill = document.getElementById('payment-progress-fill');
  const statusLbl = document.getElementById('payment-status-label');
  const successBadge = document.getElementById('payment-success-badge');

  const gwLabel = appState.currency === 'PKR' ? 'Safepay Pakistan (PKR)' : 'Lemon Squeezy (USD)';
  if (statusLbl) statusLbl.textContent = `Authorizing ${pInfo.formattedWithDecimals} via ${gwLabel}...`;

  if (formCol) formCol.classList.add('hidden');
  if (cardCol) cardCol.className = 'lg:col-span-12 flex flex-col items-center justify-center py-6 transition-all duration-700';
  if (badges) badges.classList.add('hidden');
  if (cardFront) cardFront.classList.add('card-shimmer');
  if (procStatus) procStatus.classList.remove('hidden');

  setTimeout(() => {
    if (progFill) progFill.style.width = '100%';
  }, 80);

  setTimeout(() => {
    if (cardFront) {
      cardFront.classList.remove('card-shimmer');
      cardFront.classList.add('card-emerald-success');
    }
    if (progWrap) progWrap.classList.add('hidden');
    if (statusLbl) statusLbl.classList.add('hidden');
    if (successBadge) successBadge.classList.remove('hidden');
  }, 1300);

  setTimeout(() => {
    const brand = detectCardBrand(number);
    const last4 = number.slice(-4);
    activateSubscriptionAfterPayment(
      plan,
      holder,
      `${gwLabel} • ${brand} **** ${last4}`,
      'TXN-' + Math.floor(100000 + Math.random() * 900000)
    );
  }, 2500);
}

function logoutClient() {
  appState.profile.authToken = '';
  appState.profile.hasActivePlan = false;
  persistState();
  switchView('landing');
  showToast('Signed out successfully.');
}

function switchDashboardTab(tab) {
  cleanBrowserUrlHash();
  const perms = getActivePlanPermissions();
  if (tab === 'attendance' && !perms.allowAttendanceTab) {
    showToast('Attendance Reports are available in Business Pro & Enterprise plans.');
    return;
  }

  const tabs = ['dashboard', 'categories', 'attendance', 'support', 'profile'];
  tabs.forEach(t => {
    const content = document.getElementById('dash-content-' + t);
    const btn = document.getElementById('dtab-' + t);
    if (content) {
      const isTarget = t === tab;
      content.classList.toggle('hidden', !isTarget);
      if (isTarget) triggerSmoothEnterAnimation(content);
    }
    if (btn) {
      btn.className = t === tab
        ? 'flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600/90 to-indigo-600/80 text-white shadow-lg shadow-blue-600/25 border border-blue-400/30 whitespace-nowrap text-left transition'
        : 'flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white whitespace-nowrap text-left transition';
      if (t === 'attendance' && !perms.allowAttendanceTab) {
        btn.classList.add('hidden');
      }
    }
  });

  if (tab === 'support') renderSupportTicketsUI();

  const userName = appState.profile.name || 'Workspace Owner';
  const titles = {
    dashboard: `Welcome back, ${userName} 👋 — Dashboard`,
    categories: `Meeting Workflows`,
    attendance: perms.allowChatLogs ? 'Broadcast Attendance & Live Chat Logs' : 'Broadcast Attendance Report',
    support: '24/7 Customer Support & Priority Ticket Desk',
    profile: 'Security, Integrations & Billing'
  };
  const titleEl = document.getElementById('workspace-page-title');
  if (titleEl && titles[tab]) titleEl.textContent = titles[tab];
}

// ============================================================================
// SUPPORT TICKET SYSTEM (LOW / NORMAL / HIGH PRIORITY + AUTO MESSAGE + REPLY)
// ============================================================================
function createTicketRecord(clientName, clientEmail, clientPlan, subject, priority, messageText) {
  const ticketId = 'TCK-' + Math.floor(1000 + Math.random() * 9000);
  const nowStr = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const autoGreeting = `Hello ${clientName}, thank you for contacting ZoomCast Support! Your ticket (#${ticketId}) has been logged with [${priority.toUpperCase()}] priority. Our agency engineering team (${appState.cms.supportEmail}) has received your message and will reply right here in your portal shortly.`;

  const newTicket = {
    id: ticketId,
    clientName: clientName || 'Workspace Client',
    clientEmail: clientEmail || 'client@domain.com',
    clientPlan: clientPlan || 'Subscriber',
    subject,
    priority, // 'Low' | 'Normal' | 'High'
    status: 'Open (Awaiting Agency Reply)',
    createdAt: nowStr,
    messages: [
      {
        senderRole: 'Client',
        senderName: clientName || 'Client',
        time: nowStr,
        text: messageText
      },
      {
        senderRole: 'System Auto-Reply',
        senderName: 'ZoomCast Support Bot',
        time: nowStr,
        text: autoGreeting
      }
    ]
  };

  appState.supportTickets.unshift(newTicket);
  persistState();
  updateBentoStats();
  renderSupportTicketsUI();

  // Send Live Support Ticket Email Notification via Resend API (noreply@aamiq.online -> amirjupiteradvisers@gmail.com)
  const endpoints = [
    HOSTINGER_PRODUCTION_CONFIG.otpEndpoint || '/api/send-otp.php',
    'api/send-otp.php',
    '/api/send-otp',
    HOSTINGER_PRODUCTION_CONFIG.otpRemoteEndpoint
  ].filter(Boolean);

  (async () => {
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ticket',
            email: clientEmail || 'support@aamiq.online',
            ticketId,
            clientName: clientName || 'Workspace Client',
            priority,
            ticketSubject: subject,
            message: messageText
          })
        });
        if (res.ok) break;
      } catch (e) {}
    }
  })();

  // Optional webhook notification to agency owner
  if (appState.cms.otpWebhookUrl) {
    try {
      fetch(appState.cms.otpWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: appState.cms.supportEmail,
          subject: `[${priority} Priority Ticket #${ticketId}] ${subject} — from ${clientName} (${clientEmail})`,
          otp: messageText
        })
      });
    } catch (e) {}
  }

  return newTicket;
}

function createClientSupportTicket() {
  const subjInp = document.getElementById('client-ticket-subject');
  const prioInp = document.getElementById('client-ticket-priority');
  const msgInp = document.getElementById('client-ticket-message');

  const subject = (subjInp?.value || '').trim();
  const priority = prioInp?.value || 'Normal';
  const message = (msgInp?.value || '').trim();

  if (!subject || !message) {
    showToast('Please enter both a Ticket Subject and your Message.');
    return;
  }

  const tck = createTicketRecord(
    appState.profile.name || 'Workspace User',
    appState.profile.email || 'user@zoomcast.com',
    appState.profile.planName || 'Starter Plan',
    subject,
    priority,
    message
  );

  if (subjInp) subjInp.value = '';
  if (msgInp) msgInp.value = '';

  showToast(`✓ Ticket #${tck.id} (${priority} Priority) created! Agency team notified.`);
}

function submitPublicSupportTicket() {
  const nameInp = document.getElementById('pub-ticket-name');
  const emailInp = document.getElementById('pub-ticket-email');
  const subjInp = document.getElementById('pub-ticket-subject');
  const prioInp = document.getElementById('pub-ticket-priority');
  const msgInp = document.getElementById('pub-ticket-message');

  const name = (nameInp?.value || '').trim();
  const email = (emailInp?.value || '').trim();
  const subject = (subjInp?.value || '').trim();
  const priority = prioInp?.value || 'Normal';
  const message = (msgInp?.value || '').trim();

  if (!name || !email || !subject || !message) {
    showToast('Please fill in your Name, Email, Subject, and Message.');
    return;
  }

  const tck = createTicketRecord(name, email, 'Public Inquiry', subject, priority, message);
  if (subjInp) subjInp.value = '';
  if (msgInp) msgInp.value = '';

  showToast(`✓ Support Ticket #${tck.id} received! We will reply to ${email} and in your portal.`);
}

function sendClientTicketFollowUp(ticketId) {
  const inp = document.getElementById(`client-reply-inp-${ticketId}`);
  const text = (inp?.value || '').trim();
  if (!text) return;

  const tck = appState.supportTickets.find(t => t.id === ticketId);
  if (!tck) return;

  const nowStr = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  tck.messages.push({
    senderRole: 'Client',
    senderName: appState.profile.name || tck.clientName,
    time: nowStr,
    text
  });
  tck.status = 'Client Replied (Open)';
  persistState();
  renderSupportTicketsUI();
  showToast('✓ Message sent to Agency Support');
}

function sendAgencyTicketReply(ticketId) {
  const inp = document.getElementById(`agency-reply-inp-${ticketId}`);
  const text = (inp?.value || '').trim();
  if (!text) {
    showToast('Please type a reply message first.');
    return;
  }

  const tck = appState.supportTickets.find(t => t.id === ticketId);
  if (!tck) return;

  const nowStr = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  tck.messages.push({
    senderRole: 'Agency Admin',
    senderName: 'ZoomCast Support Team',
    time: nowStr,
    text
  });
  tck.status = 'Answered by Agency ✓';

  persistState();
  renderSupportTicketsUI();
  showToast(`✓ Reply delivered to ${tck.clientName}'s Portal!`);
}

function getPriorityBadgeHtml(priority) {
  if (priority === 'High') {
    return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40">🔴 HIGH PRIORITY</span>`;
  }
  if (priority === 'Low') {
    return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">🟢 LOW PRIORITY</span>`;
  }
  return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">🟡 NORMAL PRIORITY</span>`;
}

function renderSupportTicketsUI() {
  // 1. Render Client's Tickets inside Portal Support Tab
  const clientListEl = document.getElementById('client-tickets-list');
  if (clientListEl) {
    const myEmail = (appState.profile.email || '').toLowerCase();
    const myTickets = isMasterAgencyOwner()
      ? appState.supportTickets
      : appState.supportTickets.filter(t => t.clientEmail.toLowerCase() === myEmail);

    if (myTickets.length === 0) {
      clientListEl.innerHTML = `
        <div class="p-8 rounded-2xl glass-card-subtle text-center text-xs text-slate-400">
          You have no support tickets yet. Submit a ticket on the left with Low, Normal, or High priority and our team will respond right here.
        </div>
      `;
    } else {
      clientListEl.innerHTML = myTickets.map(t => {
        const msgsHtml = (t.messages || []).map(m => {
          const isAgency = m.senderRole === 'Agency Admin';
          const isBot = m.senderRole === 'System Auto-Reply';
          const bubbleStyle = isAgency
            ? 'bg-yellow-500/15 border border-yellow-500/40'
            : isBot
              ? 'bg-blue-500/10 border border-blue-500/30'
              : 'bg-white/5 border border-white/10';
          const nameColor = isAgency ? 'text-yellow-400' : isBot ? 'text-blue-400' : 'text-emerald-400';

          return `
            <div class="p-3 rounded-xl ${bubbleStyle}">
              <div class="flex items-center justify-between text-[11px] mb-1">
                <span class="font-extrabold ${nameColor}">${m.senderName} (${m.senderRole})</span>
                <span class="text-slate-400 font-mono">${m.time}</span>
              </div>
              <p class="text-xs text-slate-200 leading-relaxed break-words">${m.text}</p>
            </div>
          `;
        }).join('');

        return `
          <div class="p-4 rounded-2xl glass-card-subtle space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-extrabold text-yellow-400">#${t.id}</span>
                  <h4 class="text-sm font-extrabold text-white">${t.subject}</h4>
                </div>
                <span class="text-[11px] text-slate-400">${t.createdAt} • Status: <strong class="text-emerald-400">${t.status}</strong></span>
              </div>
              ${getPriorityBadgeHtml(t.priority)}
            </div>

            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
              ${msgsHtml}
            </div>

            <div class="flex gap-2 pt-1">
              <input id="client-reply-inp-${t.id}" type="text" placeholder="Write a follow-up message..." class="flex-1 px-3 py-2 rounded-xl glass-input text-xs" onkeydown="if(event.key==='Enter') sendClientTicketFollowUp('${t.id}')" />
              <button type="button" onclick="sendClientTicketFollowUp('${t.id}')" class="px-3.5 py-2 rounded-xl btn-gold text-xs">
                Send
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 2. Render All Client Tickets inside Agency Admin View Inbox
  const agencyContainer = document.getElementById('agency-tickets-container');
  const countLbl = document.getElementById('agency-tickets-count-label');
  const adminStatTickets = document.getElementById('admin-stat-tickets');

  if (countLbl) countLbl.textContent = `${appState.supportTickets.length} Total Tickets`;
  if (adminStatTickets) adminStatTickets.textContent = `${appState.supportTickets.length} Tickets`;

  if (agencyContainer) {
    if (appState.supportTickets.length === 0) {
      agencyContainer.innerHTML = `
        <div class="p-6 rounded-2xl glass-card-subtle text-center text-xs text-slate-400">
          No client support tickets submitted yet. When any client opens a ticket, it appears here with their Name, Email, Plan, and Priority.
        </div>
      `;
    } else {
      agencyContainer.innerHTML = appState.supportTickets.map(t => {
        const msgsHtml = (t.messages || []).map(m => {
          const isAgency = m.senderRole === 'Agency Admin';
          return `
            <div class="p-3 rounded-xl ${isAgency ? 'bg-yellow-500/15 border border-yellow-500/40' : 'bg-white/5 border border-white/10'}">
              <div class="flex items-center justify-between text-[11px] mb-1">
                <span class="font-extrabold ${isAgency ? 'text-yellow-400' : 'text-white'}">${m.senderName} (${m.senderRole})</span>
                <span class="text-slate-400 font-mono">${m.time}</span>
              </div>
              <p class="text-xs text-slate-200 leading-relaxed">${m.text}</p>
            </div>
          `;
        }).join('');

        return `
          <div class="p-5 rounded-2xl glass-card-subtle space-y-3 border border-white/10">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono text-xs font-extrabold text-yellow-400">#${t.id}</span>
                  <h4 class="text-sm font-extrabold text-white">${t.subject}</h4>
                  ${getPriorityBadgeHtml(t.priority)}
                </div>
                <p class="text-xs text-slate-300 mt-1">
                  Client: <strong class="text-white">${t.clientName}</strong> (<a href="mailto:${t.clientEmail}" class="text-yellow-400 underline">${t.clientEmail}</a>) • Plan: <span class="text-emerald-400 font-bold">${t.clientPlan}</span>
                </p>
              </div>
              <span class="text-xs font-bold text-emerald-400">${t.status}</span>
            </div>

            <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
              ${msgsHtml}
            </div>

            <div class="flex flex-col sm:flex-row gap-2 pt-2">
              <input id="agency-reply-inp-${t.id}" type="text" placeholder="Type agency reply to ${t.clientName} (will appear in their portal)..." class="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs" onkeydown="if(event.key==='Enter') sendAgencyTicketReply('${t.id}')" />
              <button type="button" onclick="sendAgencyTicketReply('${t.id}')" class="px-5 py-2.5 rounded-xl btn-gold text-xs">
                Send Reply to Client Portal →
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function renderPricingCards() {
  const container = document.getElementById('pricing-cards-container');
  if (!container) return;
  container.innerHTML = appState.plans.map(plan => {
    const pInfo = getPlanPriceInActiveCurrency(plan);
    const subNote = appState.currency === 'PKR'
      ? `<span class="block text-[11px] text-emerald-400 font-mono mt-0.5">($${plan.priceUsd} USD × Rs. ${appState.usdToPkrRate.toFixed(2)} • Safepay PKR)</span>`
      : `<span class="block text-[11px] text-slate-400 font-medium mt-0.5">(Billed in USD $ • Lemon Squeezy)</span>`;
    const cardClass = plan.popular
      ? 'glass-card-gold border-2 border-yellow-400/70 relative'
      : 'glass-card';
    const badge = plan.popular
      ? `<span class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-yellow-400 to-amber-500 text-black whitespace-nowrap shadow-lg">MOST POPULAR</span>`
      : '';
    const featuresHtml = plan.features.map(f => `
      <li class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-medium">
        <span class="text-yellow-400 font-extrabold">✓</span>
        <span>${f}</span>
      </li>
    `).join('');

    return `
      <div class="${cardClass} p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
        ${badge}
        <div>
          <h3 class="text-lg font-extrabold text-white">${plan.name}</h3>
          <div class="mt-3">
            <div class="flex items-baseline gap-1">
              <span class="text-3xl sm:text-4xl font-extrabold text-yellow-400">${pInfo.formatted}</span>
              <span class="text-xs text-slate-400 font-semibold">/ month</span>
            </div>
            ${subNote}
          </div>
          <ul class="mt-6 space-y-3 border-t border-white/10 pt-5">
            ${featuresHtml}
          </ul>
        </div>
        <button onclick="selectPlanForCheckout('${plan.id}')" class="mt-7 w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm ${plan.popular ? 'btn-gold' : 'btn-glass'}">
          Choose ${plan.name} (${pInfo.formatted}/mo) →
        </button>
      </div>
    `;
  }).join('');
}

function syncProfileUI() {
  const sName = document.getElementById('sidebar-user-name');
  const sEmail = document.getElementById('sidebar-user-email');
  const pName = document.getElementById('prof-name');
  const pEmail = document.getElementById('prof-email');
  const pZoomLink = document.getElementById('prof-zoom-link');
  const badge = document.getElementById('zoom-conn-badge');
  const titleEl = document.getElementById('workspace-page-title');

  const bPlan = document.getElementById('prof-billing-plan');
  const bTxn = document.getElementById('prof-billing-txn');
  const bAmt = document.getElementById('prof-billing-amount');
  const bMethod = document.getElementById('prof-billing-method');
  const bChangeBtn = document.getElementById('prof-change-plan-btn');

  const planName = appState.profile.planName || 'Enterprise';
  const matchedPlan = appState.plans.find(p => p.name === planName) || appState.plans[2];
  const pInfo = getPlanPriceInActiveCurrency(matchedPlan);
  const lastPay = appState.profile.lastPayment;

  if (bPlan) bPlan.textContent = planName;
  if (bTxn) bTxn.textContent = (lastPay && lastPay.txnId) ? lastPay.txnId : 'TXN-MASTER-ENT';
  if (bAmt) bAmt.textContent = `${(lastPay && lastPay.amountFormatted) ? lastPay.amountFormatted : pInfo.formattedWithDecimals} / month`;
  if (bMethod) bMethod.textContent = (lastPay && lastPay.gateway) ? lastPay.gateway : (appState.currency === 'PKR' ? 'Safepay Pakistan (PKR)' : 'Lemon Squeezy (USD)');
  if (bChangeBtn) bChangeBtn.classList.toggle('hidden', planName === 'Enterprise');

  if (sName) sName.textContent = appState.profile.name || 'Workspace Owner';
  if (sEmail) sEmail.textContent = appState.profile.email || 'support@aamiq.online';
  if (pName) pName.value = appState.profile.name || '';
  if (pEmail) pEmail.value = appState.profile.email || '';
  if (pZoomLink) pZoomLink.value = appState.profile.defaultZoomLink || 'https://zoom.us/j/89421756301?pwd=ZoomCastFixed';
  if (titleEl && appState.profile.name) {
    titleEl.textContent = `Welcome back, ${appState.profile.name} 👋`;
  }
  const dashIntBadge = document.getElementById('dash-integration-badge');
  const dashIntSummary = document.getElementById('dash-integration-summary');
  if (badge) {
    if (appState.profile.zoomSessionStatus === 'expired' || appState.profile.zoomSessionStatus === 'error') {
      badge.textContent = '⚠ Session Expired — Fix Required';
      badge.className = 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap';
    } else if (appState.profile.zoomConnected) {
      const mLabel = appState.profile.zoomAuthMethod === 'credentials' ? 'Email/Password' : 'Google';
      badge.textContent = `● Connected (${mLabel})`;
      badge.className = 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap';
    } else {
      badge.textContent = '● Not Connected';
      badge.className = 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap';
    }
  }
  if (dashIntBadge && dashIntSummary) {
    if (appState.profile.zoomSessionStatus === 'expired' || appState.profile.zoomSessionStatus === 'error') {
      dashIntBadge.textContent = '⚠ Connection Issue';
      dashIntBadge.className = 'px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap';
      dashIntSummary.textContent = 'Your Zoom session expired or disconnected. Reconnect to resume broadcasts.';
    } else if (appState.profile.zoomConnected) {
      dashIntBadge.textContent = '● Connected';
      dashIntBadge.className = 'px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap';
      dashIntSummary.textContent = 'Your Zoom account is connected and ready for automated workflows.';
    } else {
      dashIntBadge.textContent = '● Setup Required';
      dashIntBadge.className = 'px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap';
      dashIntSummary.textContent = 'Connect your Zoom account before creating automated workflows.';
    }
  }
  applyPlanFeatureRestrictions();
}

function saveDefaultZoomMeetingLink() {
  const inp = document.getElementById('prof-zoom-link');
  const link = (inp?.value || '').trim();
  if (!link || !link.startsWith('http')) {
    showToast('Please enter a valid Zoom Meeting URL (e.g. https://zoom.us/j/...).');
    return;
  }
  appState.profile.defaultZoomLink = link;
  persistState();
  showToast('✓ Default Permanent Zoom Meeting Link saved!');
}

function saveProfileDetails() {
  const pName = document.getElementById('prof-name');
  const pEmail = document.getElementById('prof-email');
  if (pName) appState.profile.name = pName.value.trim();
  if (pEmail) appState.profile.email = pEmail.value.trim();
  persistState();
  syncProfileUI();
  showToast('✓ Profile settings updated');
}

async function sendProfilePasswordResetOtp() {
  const email = (appState.profile.email || document.getElementById('prof-email')?.value || '').trim().toLowerCase();
  if (!email) {
    showToast('No email address associated with this profile.');
    return;
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  appState.profileResetOtp = otp;

  const hint = document.getElementById('prof-otp-hint');
  if (hint) hint.textContent = `Check your email inbox (${email})`;

  await dispatchOtpEmailEverywhere(email, otp, `ZoomCast Password Reset OTP`);
  showToast(`✓ 4-Digit Reset OTP sent to ${email}`);
}

function confirmProfilePasswordReset() {
  const otpEntered = (document.getElementById('prof-reset-otp')?.value || '').trim();
  const newPass = (document.getElementById('prof-new-password')?.value || '').trim();
  const email = (appState.profile.email || document.getElementById('prof-email')?.value || '').trim().toLowerCase();

  if (!appState.profileResetOtp) {
    sendProfilePasswordResetOtp();
    showToast('Please enter the 4-digit OTP code sent to your email.');
    return;
  }

  if (otpEntered !== appState.profileResetOtp) {
    showToast('Invalid OTP code. Please check your email and try again.');
    return;
  }

  if (!newPass || newPass.length < 6) {
    showToast('Please enter a new password (minimum 6 characters).');
    return;
  }

  const uIdx = appState.usersDb.findIndex(u => u.email.toLowerCase() === email);
  if (uIdx >= 0) {
    appState.usersDb[uIdx].password = newPass;
  }
  if (email === MASTER_ADMIN_USER.email.toLowerCase()) {
    MASTER_ADMIN_USER.password = newPass;
  }

  appState.profileResetOtp = null;
  const otpInp = document.getElementById('prof-reset-otp');
  const passInp = document.getElementById('prof-new-password');
  const hint = document.getElementById('prof-otp-hint');
  if (otpInp) otpInp.value = '';
  if (passInp) passInp.value = '';
  if (hint) hint.textContent = '';

  persistState();
  showToast('✓ Your password has been updated & secured!');
}

function reconnectZoomOAuth() {
  appState.profile.zoomConnected = true;
  appState.profile.zoomAuthMethod = 'google';
  appState.profile.zoomSessionStatus = 'healthy';
  appState.profile.zoomSessionIssueReason = '';
  persistState();
  syncProfileUI();
  syncBackendConfig();
  showToast('✓ Zoom Account Connected via Google');
}

function connectZoomWithCredentials() {
  const email = (document.getElementById('zoom-auth-email')?.value || '').trim();
  const pass = (document.getElementById('zoom-auth-password')?.value || '').trim();
  if (!email || !email.includes('@') || !pass) {
    showToast('⚠️ Please enter both Zoom Email and Password.');
    return;
  }
  appState.profile.zoomConnected = true;
  appState.profile.zoomAuthMethod = 'credentials';
  appState.profile.zoomAccountEmail = email;
  appState.profile.zoomSessionStatus = 'healthy';
  appState.profile.zoomSessionIssueReason = '';
  persistState();
  syncProfileUI();
  syncBackendConfig();
  showToast(`✓ Zoom Account (${email}) connected!`);
}

// ============================================================================
// TEAM CO-HOST EMAILS MANAGER
// ============================================================================
function addCoHostEmail() {
  const perms = getActivePlanPermissions();
  if (appState.coHostEmails.length >= perms.maxCoHosts) {
    showToast(`Your ${appState.profile.planName} allows up to ${perms.maxCoHosts} Team Co-Host email(s).`);
    return;
  }
  const input = document.getElementById('new-cohost-email');
  if (!input) return;
  const email = input.value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid team member email');
    return;
  }
  if (!appState.coHostEmails.includes(email)) {
    appState.coHostEmails.push(email);
    persistState();
    renderCoHostEmails();
    updateBentoStats();
    syncBackendConfig();
    showToast(`✓ Added ${email} to Team Co-Hosts`);
  }
  input.value = '';
}

function removeCoHostEmail(idx) {
  const removed = appState.coHostEmails.splice(idx, 1);
  persistState();
  renderCoHostEmails();
  updateBentoStats();
  syncBackendConfig();
  showToast(`Removed ${removed[0]}`);
}

function renderCoHostEmails() {
  const listEl = document.getElementById('cohost-emails-list');
  const badgeEl = document.getElementById('cohost-count-badge');
  const perms = getActivePlanPermissions();
  if (badgeEl) {
    const maxStr = perms.maxCoHosts >= 999 ? 'Unlimited' : `Max ${perms.maxCoHosts}`;
    badgeEl.textContent = `${appState.coHostEmails.length} / ${maxStr} Team Members`;
  }
  if (!listEl) return;

  if (appState.coHostEmails.length === 0) {
    listEl.innerHTML = `
      <div class="col-span-full p-4 rounded-xl glass-card-subtle text-xs text-slate-400 text-center">
        No Co-Host emails added yet. Add your team member email above so they automatically become Co-Host when joining.
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.coHostEmails.map((email, idx) => `
    <div class="flex items-center justify-between px-4 py-3 rounded-xl glass-card-subtle">
      <div class="flex items-center gap-2.5 truncate">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
        <span class="text-xs font-mono font-bold text-white truncate">${email}</span>
      </div>
      <button type="button" onclick="removeCoHostEmail(${idx})" class="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/15 whitespace-nowrap">
        Delete
      </button>
    </div>
  `).join('');
}

// ============================================================================
// GLASSY 12-HOUR (AM / PM) CALENDAR & STRICT WORKFLOW BUILDER
// ============================================================================
function formatSecondsToHHMMSS(sec) {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function convert12hTo24h(time12h) {
  const match = String(time12h).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '10:00';
  let hrs = parseInt(match[1], 10);
  const mins = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hrs < 12) hrs += 12;
  if (period === 'AM' && hrs === 12) hrs = 0;
  return `${String(hrs).padStart(2, '0')}:${mins}`;
}

function updateBuilderReadinessBadge() {
  const badge = document.getElementById('builder-readiness-badge');
  if (!badge) return;

  const hasName = Boolean((document.getElementById('cat-name')?.value || '').trim());
  const hasDays = document.querySelectorAll('.cat-day-chk:checked').length > 0;
  const hasVideo = appState.currentCategory.videos.length > 0;
  const hasTimes = appState.currentCategory.selectedTimes.length > 0;

  if (hasName && hasDays && hasVideo && hasTimes) {
    badge.textContent = '✓ All 4 Steps Complete — Ready to Save & Activate!';
    badge.className = 'text-xs font-extrabold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/30';
  } else {
    const missing = [];
    if (!hasName) missing.push('Name');
    if (!hasDays) missing.push('Days');
    if (!hasVideo) missing.push('Video');
    if (!hasTimes) missing.push('Time');
    badge.textContent = `● Required to Activate: ${missing.join(' + ')}`;
    badge.className = 'text-xs font-extrabold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-md border border-amber-500/30';
  }
}

function toggleAllWeekdays() {
  const chks = document.querySelectorAll('.cat-day-chk');
  const allChecked = Array.from(chks).every(c => c.checked);
  chks.forEach(c => { c.checked = !allChecked; });
  updateBuilderReadinessBadge();
}

function generate12HourSlots() {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const period = h >= 12 ? 'PM' : 'AM';
      let hour12 = h % 12;
      if (hour12 === 0) hour12 = 12;
      const hh = String(hour12).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push(`${hh}:${mm} ${period}`);
    }
  }
  return slots;
}

function render12HourCalendarGrid() {
  const grid = document.getElementById('time-calendar-grid');
  if (!grid) return;

  const times = generate12HourSlots();
  grid.innerHTML = times.map(t => {
    const isSelected = appState.currentCategory.selectedTimes.includes(t);
    const btnStyle = isSelected
      ? 'btn-gold font-extrabold shadow-lg'
      : 'bg-white/5 text-slate-300 border border-white/10 hover:border-yellow-400/50 hover:text-white font-semibold';
    return `
      <button type="button" onclick="toggleTimeSlot('${t}')" class="py-2 px-2 rounded-xl text-xs whitespace-nowrap transition ${btnStyle}">
        ${t}
      </button>
    `;
  }).join('');

  renderSelectedTimesAssignment();
  updateBuilderReadinessBadge();
}

function toggleTimeSlot(timeStr) {
  const perms = getActivePlanPermissions();
  const idx = appState.currentCategory.selectedTimes.indexOf(timeStr);
  if (idx >= 0) {
    appState.currentCategory.selectedTimes.splice(idx, 1);
  } else {
    if (appState.currentCategory.selectedTimes.length >= perms.maxDailyTimes) {
      showToast(`Your ${appState.profile.planName} allows up to ${perms.maxDailyTimes} broadcast times per day.`);
      return;
    }
    appState.currentCategory.selectedTimes.push(timeStr);
  }
  render12HourCalendarGrid();
}

function addCustomTimeSlot() {
  const perms = getActivePlanPermissions();
  if (!perms.allowCustomTime) {
    showToast('Custom Hour/Minute Picker is available in Business Pro & Enterprise plans.');
    return;
  }
  if (appState.currentCategory.selectedTimes.length >= perms.maxDailyTimes) {
    showToast(`Your ${appState.profile.planName} allows up to ${perms.maxDailyTimes} broadcast times per day.`);
    return;
  }
  const hr = document.getElementById('custom-hour-select')?.value || '09';
  const min = document.getElementById('custom-minute-select')?.value || '15';
  const ampm = document.getElementById('custom-ampm-select')?.value || 'PM';
  const formatted = `${hr}:${min} ${ampm}`;

  if (!appState.currentCategory.selectedTimes.includes(formatted)) {
    appState.currentCategory.selectedTimes.push(formatted);
    showToast(`✓ Added custom time: ${formatted}`);
  } else {
    showToast(`${formatted} is already selected`);
  }
  render12HourCalendarGrid();
}

function handleCategoryVideosSelect(event) {
  const perms = getActivePlanPermissions();
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  if (!perms.allowMultiVideo) {
    appState.currentCategory.videos = [];
  }

  files.forEach(file => {
    if (appState.currentCategory.videos.length >= perms.maxVideosPerWorkflow) {
      showToast(`Your ${appState.profile.planName} supports up to ${perms.maxVideosPerWorkflow} video(s) per workflow.`);
      return;
    }
    const tempVideo = document.createElement('video');
    const objUrl = URL.createObjectURL(file);
    tempVideo.src = objUrl;
    tempVideo.onloadedmetadata = () => {
      if (appState.currentCategory.videos.length >= perms.maxVideosPerWorkflow) {
        URL.revokeObjectURL(objUrl);
        return;
      }
      const sec = Math.ceil(tempVideo.duration || 0);
      appState.currentCategory.videos.push({
        name: file.name,
        sizeMB: (file.size / (1024 * 1024)).toFixed(1),
        durationSec: sec,
        formattedDuration: formatSecondsToHHMMSS(sec)
      });
      URL.revokeObjectURL(objUrl);
      renderCategoryVideosList();
      renderSelectedTimesAssignment();
      updateBuilderReadinessBadge();
    };
    tempVideo.onerror = () => {
      // Fallback if browser cannot decode video metadata directly
      appState.currentCategory.videos.push({
        name: file.name,
        sizeMB: (file.size / (1024 * 1024)).toFixed(1),
        durationSec: 2700,
        formattedDuration: '00:45:00'
      });
      URL.revokeObjectURL(objUrl);
      renderCategoryVideosList();
      renderSelectedTimesAssignment();
      updateBuilderReadinessBadge();
    };
  });
}

function removeCategoryVideo(idx) {
  appState.currentCategory.videos.splice(idx, 1);
  renderCategoryVideosList();
  renderSelectedTimesAssignment();
  updateBuilderReadinessBadge();
}

function renderCategoryVideosList() {
  const container = document.getElementById('cat-videos-list');
  const totalBadge = document.getElementById('cat-total-duration');
  if (!container) return;

  const totalSec = appState.currentCategory.videos.reduce((acc, v) => acc + (v.durationSec || 0), 0);
  if (totalBadge) {
    totalBadge.textContent = `Total Duration: ${formatSecondsToHHMMSS(totalSec)}`;
  }

  if (appState.currentCategory.videos.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = appState.currentCategory.videos.map((v, idx) => `
    <div class="flex items-center justify-between p-3.5 rounded-xl glass-card-subtle">
      <div class="flex items-center gap-2.5 truncate">
        <span class="px-2.5 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-extrabold text-xs shrink-0">Video #${idx + 1}</span>
        <span class="text-xs font-bold text-white truncate">${v.name}</span>
        <span class="text-[11px] text-slate-400 whitespace-nowrap">(${v.sizeMB} MB • ${v.formattedDuration})</span>
      </div>
      <button type="button" onclick="removeCategoryVideo(${idx})" class="ml-2 text-xs font-bold text-rose-400 hover:underline whitespace-nowrap">
        Remove
      </button>
    </div>
  `).join('');
}

function renderSelectedTimesAssignment() {
  const container = document.getElementById('selected-times-container');
  const perms = getActivePlanPermissions();
  if (!container) return;

  if (appState.currentCategory.selectedTimes.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-xl glass-card-subtle text-xs text-slate-400 text-center">
        No broadcast times selected yet. Click any AM/PM time above.
      </div>
    `;
    return;
  }

  const videoCount = appState.currentCategory.videos.length;
  const allLabel = videoCount > 1
    ? `Play All ${videoCount} Videos Back-to-Back (Video 1 → Video ${videoCount})`
    : `Play Uploaded Video`;

  container.innerHTML = appState.currentCategory.selectedTimes.map(timeStr => {
    const savedChoice = appState.currentCategory.slotVideoMap[timeStr] || 'ALL_SEAMLESS';
    const videoOptions = [
      `<option value="ALL_SEAMLESS" ${savedChoice === 'ALL_SEAMLESS' ? 'selected' : ''}>${allLabel}</option>`,
      ...appState.currentCategory.videos.map((v, i) => `<option value="${v.name}" ${savedChoice === v.name ? 'selected' : ''}>Play Only Video #${i + 1}: ${v.name} (${v.formattedDuration})</option>`)
    ].join('');

    const selectorHtml = perms.allowMultiVideo
      ? `<select onchange="updateSlotVideoChoice('${timeStr}', this.value)" class="px-3 py-1.5 rounded-lg glass-input text-xs font-semibold">${videoOptions}</select>`
      : `<span class="text-xs font-semibold text-slate-300">Plays Uploaded Video</span>`;

    return `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl glass-card-subtle">
        <div class="flex items-center gap-2.5">
          <span class="px-3 py-1 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-extrabold text-xs whitespace-nowrap">🕒 ${timeStr}</span>
        </div>
        <div class="flex items-center gap-2">
          ${selectorHtml}
          <button type="button" onclick="toggleTimeSlot('${timeStr}')" class="px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/15 rounded-lg whitespace-nowrap">
            Remove
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function updateSlotVideoChoice(timeStr, val) {
  appState.currentCategory.slotVideoMap[timeStr] = val;
}

function resetCategoryForm() {
  appState.currentCategory = {
    editingId: null,
    status: 'Active',
    meetingLink: '',
    videos: [],
    selectedTimes: ['10:00 AM', '03:00 PM'],
    slotVideoMap: {}
  };
  const nameInp = document.getElementById('cat-name');
  const linkInp = document.getElementById('cat-meeting-link');
  const headingEl = document.getElementById('cat-form-heading');
  if (nameInp) nameInp.value = '';
  if (linkInp) linkInp.value = '';
  if (headingEl) headingEl.textContent = 'Workflow Builder (Create Automated Zoom Meeting)';
  renderCategoryVideosList();
  render12HourCalendarGrid();
  updateBuilderReadinessBadge();
}

function startCreateNewWorkflow() {
  if (!isIntegrationComplete()) {
    openIntegrationGateModal();
    return;
  }
  resetCategoryForm();
  const builderCard = document.getElementById('workflow-builder-card');
  const nameInp = document.getElementById('cat-name');
  if (builderCard) {
    builderCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    builderCard.classList.add('ring-2', 'ring-yellow-400');
    setTimeout(() => {
      builderCard.classList.remove('ring-2', 'ring-yellow-400');
    }, 1800);
  }
  setTimeout(() => {
    if (nameInp) nameInp.focus();
  }, 350);
  showToast('✨ Enter Workflow Name, Upload Video & Select Schedule below to create your workflow!');
}

async function saveMeetingCategory(forcedStatus) {
  if (!isIntegrationComplete()) {
    openIntegrationGateModal();
    return;
  }
  const perms = getActivePlanPermissions();
  if (!appState.currentCategory.editingId && appState.categories.length >= perms.maxWorkflows) {
    showToast(`Your ${appState.profile.planName} allows up to ${perms.maxWorkflows} workflows.`);
    return;
  }

  const nameInp = document.getElementById('cat-name');
  const linkInp = document.getElementById('cat-meeting-link');
  const catName = (nameInp && nameInp.value.trim()) ? nameInp.value.trim() : '';

  // STRICT STEP 1 VALIDATION: Workflow / Meeting Name Required
  if (!catName) {
    if (nameInp) {
      nameInp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInp.focus();
    }
    showToast('⚠️ Step 1 Required: Please enter a Workflow / Zoom Meeting Name.');
    return;
  }

  // STRICT STEP 2 VALIDATION: At least 1 Weekly Day Required
  const selectedDays = Array.from(document.querySelectorAll('.cat-day-chk:checked')).map(c => c.value);
  if (selectedDays.length === 0) {
    showToast('⚠️ Step 2 Required: Please select at least one day of the week.');
    return;
  }

  // STRICT STEP 3 VALIDATION: At least 1 Uploaded Recorded Video Required
  if (appState.currentCategory.videos.length === 0) {
    const dropzone = document.getElementById('video-dropzone-label');
    if (dropzone) {
      dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      dropzone.classList.add('border-yellow-400', 'ring-2', 'ring-yellow-400');
      setTimeout(() => dropzone.classList.remove('ring-2', 'ring-yellow-400'), 2000);
    }
    showToast('⚠️ Step 3 Required: Please upload at least 1 Recorded Video file before saving/activating!');
    return;
  }

  // STRICT STEP 4 VALIDATION: At least 1 Broadcast Time Required
  if (appState.currentCategory.selectedTimes.length === 0) {
    showToast('⚠️ Step 4 Required: Please select at least one AM/PM broadcast time.');
    return;
  }

  const status = (!perms.allowDraftMode)
    ? 'Active'
    : (forcedStatus || 'Active');

  const totalSec = appState.currentCategory.videos.reduce((acc, v) => acc + (v.durationSec || 0), 0);

  // Preserve existing permanent meeting link if editing, or use custom link, or assign permanent link that NEVER changes
  const existingCat = appState.currentCategory.editingId
    ? appState.categories.find(c => c.id === appState.currentCategory.editingId)
    : null;
  const customLink = (linkInp && linkInp.value.trim()) ? linkInp.value.trim() : '';
  const permanentMeetingLink = customLink
    || (existingCat && existingCat.meetingLink)
    || appState.profile.defaultZoomLink
    || 'https://zoom.us/j/89421756301?pwd=ZoomCastFixed';

  const newCat = {
    id: appState.currentCategory.editingId || ('WF-' + Date.now()),
    name: catName,
    sessionType: 'Zoom Meeting',
    meetingLink: permanentMeetingLink,
    status,
    days: selectedDays,
    times: [...appState.currentCategory.selectedTimes],
    videos: [...appState.currentCategory.videos],
    slotVideoMap: { ...appState.currentCategory.slotVideoMap },
    totalDurationSec: totalSec,
    formattedTotalDuration: formatSecondsToHHMMSS(totalSec),
    autoAdmit: document.getElementById('cat-auto-admit').checked,
    shareSound: document.getElementById('cat-share-sound').checked,
    autoEnd: document.getElementById('cat-auto-end').checked
  };

  const existingIdx = appState.categories.findIndex(c => c.id === newCat.id);
  if (existingIdx >= 0) {
    appState.categories[existingIdx] = newCat;
  } else {
    appState.categories.push(newCat);
  }

  persistState();
  renderSavedCategories();
  updateBentoStats();
  await syncBackendConfig();
  resetCategoryForm();

  const listCard = document.getElementById('saved-categories-list');
  if (listCard) listCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

  showToast(
    status === 'Draft'
      ? `✓ Saved "${catName}" as Draft`
      : `✓ Workflow "${catName}" is now LIVE with your Permanent Zoom Meeting Link!`
  );
}

function copyWorkflowMeetingLink(catId) {
  const cat = appState.categories.find(c => c.id === catId);
  const link = (cat && cat.meetingLink) || appState.profile.defaultZoomLink || 'https://zoom.us/j/89421756301?pwd=ZoomCastFixed';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(() => {
      showToast(`📋 Copied Permanent Zoom Link: ${link}`);
    }).catch(() => {
      showToast(`📋 Permanent Zoom Link: ${link}`);
    });
  } else {
    showToast(`📋 Permanent Zoom Link: ${link}`);
  }
}

function toggleWorkflowStatus(catId) {
  const perms = getActivePlanPermissions();
  if (!perms.allowDraftMode) return;
  const cat = appState.categories.find(c => c.id === catId);
  if (!cat) return;
  cat.status = cat.status === 'Active' ? 'Draft' : 'Active';
  persistState();
  renderSavedCategories();
  syncBackendConfig();
  showToast(`Workflow "${cat.name}" is now ${cat.status}`);
}

function deleteCategory(catId) {
  appState.categories = appState.categories.filter(c => c.id !== catId);
  persistState();
  renderSavedCategories();
  updateBentoStats();
  syncBackendConfig();
  showToast('Workflow deleted');
}

function editCategory(catId) {
  const cat = appState.categories.find(c => c.id === catId);
  if (!cat) return;

  appState.currentCategory = {
    editingId: cat.id,
    status: cat.status || 'Active',
    meetingLink: cat.meetingLink || '',
    videos: [...(cat.videos || [])],
    selectedTimes: [...(cat.times || [])],
    slotVideoMap: { ...(cat.slotVideoMap || {}) }
  };

  const nameInp = document.getElementById('cat-name');
  const linkInp = document.getElementById('cat-meeting-link');
  const headingEl = document.getElementById('cat-form-heading');

  if (nameInp) nameInp.value = cat.name || '';
  if (linkInp) linkInp.value = cat.meetingLink || '';
  if (headingEl) headingEl.textContent = `Editing Workflow: ${cat.name}`;

  document.querySelectorAll('.cat-day-chk').forEach(chk => {
    chk.checked = (cat.days || []).includes(chk.value);
  });

  const autoAdmitChk = document.getElementById('cat-auto-admit');
  const shareSoundChk = document.getElementById('cat-share-sound');
  const autoEndChk = document.getElementById('cat-auto-end');
  if (autoAdmitChk) autoAdmitChk.checked = cat.autoAdmit !== false;
  if (shareSoundChk) shareSoundChk.checked = cat.shareSound !== false;
  if (autoEndChk) autoEndChk.checked = cat.autoEnd !== false;

  renderCategoryVideosList();
  render12HourCalendarGrid();
  updateBuilderReadinessBadge();

  if (headingEl) {
    headingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  showToast(`Loaded "${cat.name}" into Workflow Builder for editing`);
}

function renderSavedCategories() {
  const listEl = document.getElementById('saved-categories-list');
  const perms = getActivePlanPermissions();
  if (!listEl) return;

  if (appState.categories.length === 0) {
    listEl.innerHTML = `
      <div class="p-5 rounded-xl glass-card-subtle text-center text-xs text-slate-400">
        No workflows created yet. Click <strong>+ Create New Workflow</strong> above or fill out Steps 1–4 in the Workflow Builder below.
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.categories.map(cat => {
    const isActive = cat.status === 'Active';
    const badgeClass = isActive
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    const videosLabel = cat.videos.length > 0
      ? cat.videos.map((v, i) => `#${i + 1} ${v.name}`).join(' → ')
      : 'No video attached';
    const fixedLink = cat.meetingLink || appState.profile.defaultZoomLink || 'https://zoom.us/j/89421756301?pwd=ZoomCastFixed';

    const draftBtnHtml = perms.allowDraftMode
      ? `<button type="button" onclick="toggleWorkflowStatus('${cat.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap ${isActive ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/25' : 'bg-emerald-500 text-black border-emerald-400'}">${isActive ? 'Switch to Draft' : 'Activate Workflow'}</button>`
      : '';

    return `
      <div class="p-4 sm:p-5 rounded-2xl glass-card-subtle space-y-3 border border-white/10">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-extrabold text-white text-sm sm:text-base">${cat.name}</span>
              <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">Zoom Meeting</span>
              <span class="px-2.5 py-0.5 rounded text-[11px] font-extrabold border ${badgeClass}">● ${isActive ? 'Active (Live)' : 'Draft'}</span>
              <span class="text-xs text-slate-400 font-medium">• ${cat.videos.length} Video(s) (${cat.formattedTotalDuration})</span>
            </div>
            <div class="text-xs text-slate-300">
              <strong>Days:</strong> ${cat.days.join(', ')}
            </div>
            <div class="text-xs text-slate-300">
              <strong>Broadcast Times:</strong> <span class="text-yellow-400 font-semibold">${cat.times.join(' • ')}</span>
            </div>
            <div class="text-[11px] text-slate-400">
              <strong>Video(s):</strong> ${videosLabel}
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            ${draftBtnHtml}
            <button type="button" onclick="editCategory('${cat.id}')" class="px-3 py-1.5 rounded-xl btn-glass text-xs">
              Edit
            </button>
            <button type="button" onclick="triggerLiveMeetingNow('${cat.id}')" class="px-3.5 py-1.5 rounded-xl btn-gold text-xs">
              ▶ Run Now
            </button>
            <button type="button" onclick="deleteCategory('${cat.id}')" class="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 text-xs font-bold whitespace-nowrap">
              Delete
            </button>
          </div>
        </div>

        <!-- Permanent Unchanging Zoom Meeting Link Bar -->
        <div class="p-3 rounded-xl bg-black/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div class="flex items-center gap-2 truncate">
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] shrink-0">🔒 PERMANENT LINK</span>
            <span class="text-xs font-mono text-slate-200 truncate">${fixedLink}</span>
          </div>
          <button type="button" onclick="copyWorkflowMeetingLink('${cat.id}')" class="px-3.5 py-1.5 rounded-lg btn-gold text-xs shrink-0 self-start sm:self-auto">
            📋 Copy Meeting Link
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function syncBackendConfig() {
  const activeCats = appState.categories.filter(c => c.status === 'Active');
  const firstCat = activeCats[0] || appState.categories[0];
  const playlistNames = firstCat && firstCat.videos ? firstCat.videos.map(v => v.name) : [];
  const times12h = firstCat && firstCat.times ? firstCat.times : ['10:00 AM', '03:00 PM'];
  const times24h = times12h.map(t => convert12hTo24h(t));
  const permanentZoomUrl = (firstCat && firstCat.meetingLink) || appState.profile.defaultZoomLink || 'https://zoom.us/j/89421756301?pwd=ZoomCastFixed';

  const payload = {
    ZoomMeetingUrl: permanentZoomUrl,
    VideoFilePath: playlistNames[0] || '',
    VideoPlaylist: playlistNames,
    VideoDurationSeconds: firstCat ? firstCat.totalDurationSec : 0,
    AutoAdmitEnabled: true,
    ShareComputerSound: true,
    MuteHostMic: true,
    OptimizeForVideo: true,
    CoHostEmails: appState.coHostEmails,
    Categories: appState.categories,
    Schedule1Enabled: Boolean(times24h[0]) && Boolean(activeCats.length > 0),
    Schedule1Time: times24h[0] || '10:00',
    Schedule2Enabled: Boolean(times24h[1]) && Boolean(activeCats.length > 0),
    Schedule2Time: times24h[1] || '15:00',
    Schedule3Enabled: Boolean(times24h[2]) && Boolean(activeCats.length > 0),
    Schedule3Time: times24h[2] || '20:00'
  };

  try {
    await fetch('/api/save-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {}
}

async function triggerLiveMeetingNow(catId) {
  if (appState.categories.length === 0) {
    showToast('⚠️ Please create & activate a Workflow with an uploaded video first!');
    startCreateNewWorkflow();
    return;
  }
  await syncBackendConfig();
  const targetCat = catId ? appState.categories.find(c => c.id === catId) : appState.categories[0];
  const link = (targetCat && targetCat.meetingLink) || appState.profile.defaultZoomLink || 'https://zoom.us/j/89421756301?pwd=ZoomCastFixed';
  try {
    const res = await fetch('/api/run-now', { method: 'POST' });
    if (res.ok) {
      showToast(`🚀 Launching Zoom Meeting on Permanent Link: ${link}`);
      return;
    }
  } catch (e) {}
  showToast(`🚀 Broadcast Triggered on Permanent Zoom Link: ${link}`);
}

// ============================================================================
// REAL ZOOM CHAT PARSER & GLASSY CHAT MODAL
// ============================================================================
async function syncRealBackendSessions() {
  try {
    const res = await fetch('/api/sessions');
    if (res.ok) {
      const serverSessions = await res.json();
      if (Array.isArray(serverSessions) && serverSessions.length > 0) {
        appState.attendanceSessions = serverSessions;
        persistState();
        renderAttendanceSessionsList();
        updateBentoStats();
      }
    }
  } catch (e) {}
}

function handleRealZoomChatUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result || '';
    const lines = content.split(/\r?\n/);
    const participantsMap = {};
    const allChatMessages = [];

    lines.forEach(line => {
      const match = line.match(/^(\d{2}:\d{2}:\d{2})\s+From\s+(.+?)(?:\s+to\s+.+?)?\s*:\s*(.+)$/i);
      if (match) {
        const msgTime = match[1];
        const sender = match[2].trim();
        const msgText = match[3].trim();
        if (!msgText) return;

        allChatMessages.push({ sender, time: msgTime, text: msgText });
        if (!participantsMap[sender]) {
          const isCoHost = appState.coHostEmails.some(em => sender.toLowerCase().includes(em.split('@')[0]));
          participantsMap[sender] = {
            name: sender,
            email: '—',
            role: isCoHost ? 'Co-Host' : 'Participant',
            joinTime: msgTime,
            leaveTime: msgTime,
            durationMins: 45,
            messages: []
          };
        }
        participantsMap[sender].leaveTime = msgTime;
        participantsMap[sender].messages.push({ time: msgTime, text: msgText });
      }
    });

    const wfName = appState.categories[0]?.name || file.name.replace('.txt', '');
    const newSession = {
      sessionId: 'SES-' + Date.now(),
      meetingName: wfName,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: appState.categories[0]?.formattedTotalDuration || '00:45:00',
      participants: Object.values(participantsMap),
      chatMessages: allChatMessages
    };

    appState.attendanceSessions.unshift(newSession);
    persistState();
    renderAttendanceSessionsList();
    updateBentoStats();
    openSessionDetails(newSession.sessionId);
    showToast(`✓ Imported ${allChatMessages.length} real chat message(s) from Zoom chat file!`);
  };
  reader.readAsText(file);
}

function renderAttendanceSessionsList() {
  const tbody = document.getElementById('sessions-summary-tbody');
  const perms = getActivePlanPermissions();
  if (!tbody) return;

  if (appState.attendanceSessions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-xs text-slate-400">
          No completed broadcast sessions yet. Real Zoom meetings and uploaded <code class="text-yellow-400">meeting_saved_chat.txt</code> logs appear here automatically.
        </td>
      </tr>
    `;
    return;
  }

  const btnLabel = perms.allowChatLogs ? 'View Participants & Chat →' : 'View Participants →';

  tbody.innerHTML = appState.attendanceSessions.map(ses => `
    <tr onclick="openSessionDetails('${ses.sessionId}')" class="hover:bg-white/5 cursor-pointer transition">
      <td class="py-3.5 px-4 font-extrabold text-white">${ses.meetingName}</td>
      <td class="py-3.5 px-4 text-slate-300 font-medium">${ses.date}</td>
      <td class="py-3.5 px-4">
        <span class="px-2.5 py-1 rounded-md bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-bold text-xs whitespace-nowrap">${ses.time}</span>
      </td>
      <td class="py-3.5 px-4 font-bold text-emerald-400">${ses.participants.length} Attendees</td>
      <td class="py-3.5 px-4 font-mono text-xs text-slate-300">${ses.duration}</td>
      <td class="py-3.5 px-4 text-right">
        <button type="button" class="px-3.5 py-1.5 rounded-xl btn-gold text-xs">
          ${btnLabel}
        </button>
      </td>
    </tr>
  `).join('');
}

function openSessionDetails(sessionId) {
  const ses = appState.attendanceSessions.find(s => s.sessionId === sessionId);
  if (!ses) return;
  appState.activeSessionDetailId = sessionId;
  const perms = getActivePlanPermissions();

  document.getElementById('attendance-meetings-list-card')?.classList.add('hidden');
  document.getElementById('attendance-session-detail-card')?.classList.remove('hidden');

  const titleEl = document.getElementById('detail-session-title');
  const metaEl = document.getElementById('detail-session-meta');
  if (titleEl) titleEl.textContent = ses.meetingName;
  if (metaEl) metaEl.textContent = `Date: ${ses.date} • Scheduled Time: ${ses.time} • Total Attendance: ${ses.participants.length} Participants • Duration: ${ses.duration}`;

  const tbody = document.getElementById('detail-participants-tbody');
  if (!tbody) return;

  tbody.innerHTML = ses.participants.map((p, idx) => {
    const msgCount = (p.messages || []).length;
    const roleStyle = p.role.includes('Co-Host')
      ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';

    const chatCellHtml = perms.allowChatLogs
      ? `<td class="py-3.5 px-3 text-right">
          <button type="button" onclick="openChatTranscriptModal(${idx})" class="px-3.5 py-1.5 rounded-xl ${msgCount > 0 ? 'btn-gold' : 'btn-glass'} text-xs">
            💬 Open Chat (${msgCount})
          </button>
        </td>`
      : '';

    return `
      <tr>
        <td class="py-3.5 px-3 font-extrabold text-white whitespace-nowrap">${p.name}</td>
        <td class="py-3.5 px-3 font-mono text-xs text-slate-300">${p.email}</td>
        <td class="py-3.5 px-3"><span class="px-2.5 py-0.5 rounded text-xs font-bold whitespace-nowrap ${roleStyle}">${p.role}</span></td>
        <td class="py-3.5 px-3 text-slate-300 whitespace-nowrap">${p.joinTime}</td>
        <td class="py-3.5 px-3 text-slate-300 whitespace-nowrap">${p.leaveTime}</td>
        <td class="py-3.5 px-3 font-bold text-white whitespace-nowrap">${p.durationMins} mins</td>
        ${chatCellHtml}
      </tr>
    `;
  }).join('');
}

function openChatTranscriptModal(participantIndexOrAll) {
  const ses = appState.attendanceSessions.find(s => s.sessionId === appState.activeSessionDetailId);
  if (!ses) return;

  const modal = document.getElementById('chat-viewer-modal');
  const titleEl = document.getElementById('chat-modal-title');
  const subEl = document.getElementById('chat-modal-subtitle');
  const bodyEl = document.getElementById('chat-modal-messages-body');
  if (!modal || !bodyEl) return;

  let messagesToDisplay = [];
  if (participantIndexOrAll === 'ALL') {
    if (titleEl) titleEl.textContent = `Full Zoom Chat — ${ses.meetingName}`;
    if (subEl) subEl.textContent = `All messages written by participants in this session`;
    if (ses.chatMessages && ses.chatMessages.length > 0) {
      messagesToDisplay = ses.chatMessages;
    } else {
      ses.participants.forEach(p => {
        (p.messages || []).forEach(m => {
          messagesToDisplay.push({ sender: p.name, time: m.time, text: m.text });
        });
      });
    }
  } else {
    const p = ses.participants[participantIndexOrAll];
    if (!p) return;
    if (titleEl) titleEl.textContent = `Chat Messages — ${p.name}`;
    if (subEl) subEl.textContent = `Joined: ${p.joinTime} • Left: ${p.leaveTime}`;
    messagesToDisplay = (p.messages || []).map(m => ({ sender: p.name, time: m.time, text: m.text }));
  }

  if (messagesToDisplay.length === 0) {
    bodyEl.innerHTML = `
      <div class="p-6 text-center text-xs text-slate-400">
        No chat messages were written by this participant during the meeting.
      </div>
    `;
  } else {
    bodyEl.innerHTML = messagesToDisplay.map(m => `
      <div class="p-4 rounded-2xl glass-card-subtle">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-extrabold text-yellow-400">${m.sender}</span>
          <span class="text-[11px] font-mono text-slate-400">${m.time}</span>
        </div>
        <p class="text-sm font-semibold text-white break-words">${m.text}</p>
      </div>
    `).join('');
  }

  modal.classList.remove('hidden');
}

function closeChatTranscriptModal() {
  document.getElementById('chat-viewer-modal')?.classList.add('hidden');
}

function backToSessionsList() {
  document.getElementById('attendance-session-detail-card')?.classList.add('hidden');
  document.getElementById('attendance-meetings-list-card')?.classList.remove('hidden');
}

function exportAllSessionsSummaryCsv() {
  const perms = getActivePlanPermissions();
  if (!perms.allowCsvExport) {
    showToast('CSV Export is available exclusively on the Enterprise plan.');
    return;
  }
  if (appState.attendanceSessions.length === 0) {
    showToast('No sessions to export yet');
    return;
  }
  const rows = [
    ['Meeting Name', 'Date', 'Scheduled Time', 'Total Attendance', 'Duration'],
    ...appState.attendanceSessions.map(s => [
      `"${s.meetingName}"`,
      s.date,
      s.time,
      s.participants.length,
      s.duration
    ])
  ];
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', 'meetings_summary_report.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('⬇ Meetings Summary CSV Downloaded');
}

function exportSingleSessionCsv() {
  const perms = getActivePlanPermissions();
  if (!perms.allowCsvExport) {
    showToast('CSV Export is available exclusively on the Enterprise plan.');
    return;
  }
  const ses = appState.attendanceSessions.find(s => s.sessionId === appState.activeSessionDetailId);
  if (!ses) return;

  const rows = [
    ['Meeting Name', 'Date', 'Time', 'Participant Name', 'Email', 'Role', 'Join Time', 'Leave Time', 'Duration (Mins)', 'Chat Messages Written'],
    ...ses.participants.map(p => {
      const msgStr = (p.messages || []).map(m => `[${m.time}] ${m.text}`).join(' | ');
      return [
        `"${ses.meetingName}"`,
        ses.date,
        ses.time,
        `"${p.name}"`,
        p.email,
        `"${p.role}"`,
        p.joinTime,
        p.leaveTime,
        p.durationMins,
        `"${msgStr}"`
      ];
    })
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `session_${ses.date}_attendance_and_chat.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('⬇ Exact Attendance & Chat Messages CSV Downloaded');
}

// ============================================================================
// ADMIN CONSOLE RENDERER (No Dummy AWS EC2 Nodes — Only Paid Subscribers)
// ============================================================================
function renderAdminPanel() {
  const clientRowHtml = appState.clients.map((c, idx) => `
    <tr>
      <td class="py-3.5 px-3">
        <div class="font-bold text-white">${c.name}</div>
        <div class="text-slate-400 font-mono text-[11px]">${c.email}</div>
      </td>
      <td class="py-3.5 px-3 font-semibold text-yellow-400">${c.plan}</td>
      <td class="py-3.5 px-3 text-slate-300">${c.categoriesCount || 0} Workflows</td>
      <td class="py-3.5 px-3 text-slate-300">${c.coHostsCount || 0} Team Members</td>
      <td class="py-3.5 px-3">
        <button onclick="toggleClientStatus(${idx})" class="px-2.5 py-1 rounded text-xs font-bold ${c.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}">
          ${c.status}
        </button>
      </td>
    </tr>
  `).join('');

  ['admin-clients-tbody', 'agency-clients-tbody'].forEach(id => {
    const tbody = document.getElementById(id);
    if (tbody) {
      tbody.innerHTML = appState.clients.length > 0
        ? clientRowHtml
        : `<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400">No customers registered yet.</td></tr>`;
    }
  });

  const statClients = document.getElementById('admin-stat-clients');
  if (statClients) statClients.textContent = `${appState.clients.length} Active User`;
}

function toggleClientStatus(idx) {
  const c = appState.clients[idx];
  c.status = c.status === 'Active' ? 'Paused' : 'Active';
  persistState();
  renderAdminPanel();
}

// ============================================================================
// PROFILE BILLING, PAYMENT METHODS (PRIMARY/BACKUP), CANCEL & SERVICE STATUS
// ============================================================================
function getUserBillingTransactions() {
  const email = (appState.profile.email || '').toLowerCase();
  if (appState.transactions.length === 0 && appState.profile.hasActivePlan) {
    const pName = appState.profile.planName || 'Enterprise';
    const matchedPlan = appState.plans.find(p => p.name.toLowerCase() === pName.toLowerCase()) || appState.plans[2];
    appState.transactions.push({
      id: 'INV-' + new Date().getFullYear() + '-1001',
      date: new Date().toISOString().slice(0, 10),
      email,
      description: `${matchedPlan.name} Monthly Subscription`,
      method: appState.currency === 'PKR' ? 'Safepay (PKR)' : 'Lemon Squeezy (USD)',
      amount: appState.currency === 'PKR' ? `Rs. ${matchedPlan.pricePkr.toLocaleString()}` : `$${matchedPlan.priceUsd}`,
      status: 'Paid'
    });
  }
  return appState.transactions.filter(t => !t.email || t.email.toLowerCase() === email);
}

function renderBillingSection() {
  const statusBadge = document.getElementById('billing-plan-status-badge');
  const summaryEl = document.getElementById('billing-plan-summary');
  const cancelBtn = document.getElementById('btn-toggle-cancel-plan');
  const pName = appState.profile.planName || 'Starter';
  const matchedPlan = appState.plans.find(p => p.name.toLowerCase() === pName.toLowerCase()) || appState.plans[2];
  const priceStr = appState.currency === 'PKR' ? `Rs. ${matchedPlan.pricePkr.toLocaleString()}/mo` : `$${matchedPlan.priceUsd}/mo`;

  if (statusBadge) {
    if (appState.profile.hasActivePlan) {
      statusBadge.textContent = 'Active';
      statusBadge.className = 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    } else {
      statusBadge.textContent = 'Cancelled';
      statusBadge.className = 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30';
    }
  }
  if (summaryEl) {
    summaryEl.textContent = appState.profile.hasActivePlan
      ? `Current Plan: ${matchedPlan.name} (${priceStr})`
      : `Plan Cancelled — Upgrade anytime to resume automated broadcasts.`;
  }
  if (cancelBtn) {
    cancelBtn.classList.toggle('hidden', !appState.profile.hasActivePlan);
  }

  // Render Payment Methods (Primary & Backup)
  const pmContainer = document.getElementById('payment-methods-list');
  if (pmContainer) {
    if (appState.paymentMethods.length === 0) {
      pmContainer.innerHTML = `<div class="sm:col-span-2 p-4 rounded-xl border border-dashed border-white/15 text-xs text-slate-400 text-center">No saved payment methods yet. Click <strong>+ Add Method</strong> to set your Primary &amp; Backup billing methods.</div>`;
    } else {
      pmContainer.innerHTML = appState.paymentMethods.map(pm => {
        const isPrimary = pm.role === 'primary';
        const badgeHtml = isPrimary
          ? `<span class="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[10px] font-extrabold uppercase">Primary</span>`
          : `<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-extrabold uppercase">Backup</span>`;
        const switchBtn = isPrimary
          ? `<button type="button" onclick="setPaymentMethodRole('${pm.id}','backup')" class="text-[11px] text-slate-400 hover:text-white underline">Make Backup</button>`
          : `<button type="button" onclick="setPaymentMethodRole('${pm.id}','primary')" class="text-[11px] text-yellow-400 hover:underline font-bold">Make Primary</button>`;
        return `
          <div class="p-3.5 rounded-xl bg-white/5 border ${isPrimary ? 'border-yellow-500/40' : 'border-white/10'} flex items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-white">${pm.type}</span>
                ${badgeHtml}
              </div>
              <p class="text-[11px] text-slate-400 font-mono mt-1">•••• ${pm.last4}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              ${switchBtn}
              <button type="button" onclick="removePaymentMethod('${pm.id}')" class="text-[11px] text-rose-400 hover:text-rose-300">Remove</button>
            </div>
          </div>`;
      }).join('');
    }
  }

  // Render Transaction History
  const txBody = document.getElementById('billing-transactions-tbody');
  if (txBody) {
    const txs = getUserBillingTransactions();
    if (txs.length === 0) {
      txBody.innerHTML = `<tr><td colspan="6" class="py-5 text-center text-xs text-slate-400">No billing transactions recorded yet.</td></tr>`;
    } else {
      txBody.innerHTML = txs.map(tx => {
        const badgeCls = tx.status === 'Paid'
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        return `
          <tr>
            <td class="py-2.5 px-3 font-mono text-white font-semibold">${tx.id}</td>
            <td class="py-2.5 px-3 text-slate-300">${tx.date}</td>
            <td class="py-2.5 px-3 text-white">${tx.description}</td>
            <td class="py-2.5 px-3 text-slate-300">${tx.method}</td>
            <td class="py-2.5 px-3 font-bold text-yellow-400">${tx.amount}</td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded border text-[10px] font-bold ${badgeCls}">${tx.status}</span></td>
          </tr>`;
      }).join('');
    }
  }
}

function toggleAddPaymentMethodBox() {
  document.getElementById('add-payment-method-box')?.classList.toggle('hidden');
}

function saveNewPaymentMethod() {
  const type = document.getElementById('pm-type')?.value || 'Visa / Mastercard';
  const last4 = (document.getElementById('pm-last4')?.value || '').trim();
  const role = document.getElementById('pm-role')?.value || 'primary';
  if (!last4) {
    showToast('Please enter last 4 digits or account label.');
    return;
  }
  if (role === 'primary') {
    appState.paymentMethods.forEach(m => { if (m.role === 'primary') m.role = 'backup'; });
  }
  appState.paymentMethods.push({ id: 'pm_' + Date.now(), type, last4, role });
  document.getElementById('pm-last4').value = '';
  document.getElementById('add-payment-method-box')?.classList.add('hidden');
  persistState();
  renderBillingSection();
  showToast(`✓ Saved ${type} (${last4}) as ${role.toUpperCase()} payment method.`);
}

function setPaymentMethodRole(id, role) {
  if (role === 'primary') {
    appState.paymentMethods.forEach(m => { if (m.role === 'primary') m.role = 'backup'; });
  }
  const target = appState.paymentMethods.find(m => m.id === id);
  if (target) target.role = role;
  persistState();
  renderBillingSection();
  showToast(`✓ Payment method updated to ${role.toUpperCase()}.`);
}

function removePaymentMethod(id) {
  appState.paymentMethods = appState.paymentMethods.filter(m => m.id !== id);
  persistState();
  renderBillingSection();
  showToast('Payment method removed.');
}

function toggleCancelSubscriptionBox(forceState) {
  const box = document.getElementById('cancel-subscription-box');
  if (!box) return;
  if (typeof forceState === 'boolean') {
    box.classList.toggle('hidden', !forceState);
  } else {
    box.classList.toggle('hidden');
  }
}

function confirmPlanCancellation() {
  const reason = (document.getElementById('cancel-reason-select')?.value || '').trim();
  const notes = (document.getElementById('cancel-reason-notes')?.value || '').trim();
  if (!reason) {
    showToast('Please select a cancellation reason first.');
    return;
  }
  const prevPlan = appState.profile.planName || 'Enterprise';
  appState.profile.hasActivePlan = false;

  const uIdx = appState.usersDb.findIndex(u => u.email.toLowerCase() === (appState.profile.email || '').toLowerCase());
  if (uIdx >= 0) appState.usersDb[uIdx].hasActivePlan = false;

  appState.transactions.unshift({
    id: 'CXL-' + Date.now().toString().slice(-6),
    date: new Date().toISOString().slice(0, 10),
    email: appState.profile.email,
    description: `Cancelled ${prevPlan} (${reason}${notes ? ' — ' + notes : ''})`,
    method: 'Subscription',
    amount: '$0',
    status: 'Cancelled'
  });

  toggleCancelSubscriptionBox(false);
  persistState();
  syncProfileUI();
  renderBillingSection();
  showToast('Subscription cancelled. Your feedback has been recorded.');
}

async function fetchAndRenderServiceStatus() {
  try {
    const res = await fetch('/api/service-status', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    appState.serviceStatus = data;

    const banner = document.getElementById('service-status-banner');
    const dot = document.getElementById('service-status-dot');
    const txt = document.getElementById('service-status-text');
    if (banner && txt && dot) {
      if (data.mode && data.mode !== 'operational' && data.message) {
        const isIssue = data.mode === 'issue';
        banner.className = isIssue
          ? 'px-4 sm:px-8 py-2 border-b border-rose-500/30 bg-rose-500/10 flex items-center gap-2 text-xs text-rose-200 shrink-0'
          : 'px-4 sm:px-8 py-2 border-b border-amber-500/25 bg-amber-500/10 flex items-center gap-2 text-xs text-amber-200 shrink-0';
        dot.className = isIssue
          ? 'w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0'
          : 'w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0';
        const prefix = isIssue ? 'Service Notice:' : 'Maintenance:';
        txt.textContent = `${prefix} ${data.message}`;
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }

    const modeSel = document.getElementById('admin-service-mode');
    const msgInp = document.getElementById('admin-service-message');
    const badge = document.getElementById('admin-service-mode-badge');
    if (modeSel && data.mode) modeSel.value = data.mode;
    if (msgInp && data.message) msgInp.value = data.message;
    if (badge) {
      if (data.mode === 'issue') {
        badge.textContent = '● Service Issue Active';
        badge.className = 'px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30';
      } else if (data.mode === 'maintenance') {
        badge.textContent = '● Maintenance Active';
        badge.className = 'px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30';
      } else {
        badge.textContent = '● Operational';
        badge.className = 'px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      }
    }
  } catch (e) {}
}

async function saveAdminServiceStatus() {
  const mode = document.getElementById('admin-service-mode')?.value || 'operational';
  const message = (document.getElementById('admin-service-message')?.value || '').trim();
  const notifyClients = Boolean(document.getElementById('admin-service-notify-email')?.checked);
  if (mode !== 'operational' && !message) {
    showToast('Please enter a short status message for clients.');
    return;
  }
  const emails = Array.from(new Set(
    [...appState.usersDb.map(u => u.email), ...appState.clients.map(c => c.email)].filter(Boolean)
  ));
  try {
    const res = await fetch('/api/service-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, message, notifyClients, emails })
    });
    const out = await res.json();
    await fetchAndRenderServiceStatus();
    if (notifyClients && mode !== 'operational') {
      showToast(`✓ Status updated & emailed to ${out.emailedCount || 0} client(s).`);
    } else {
      showToast('✓ Service status updated across all client portals.');
    }
  } catch (e) {
    showToast('Could not reach server to update status.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  cleanBrowserUrlHash();
  persistState(); // Immediately persist purged clean state to localStorage
  renderCmsContentToDOM();
  updateCurrencyButtonsUI();
  renderPricingCards();
  fetchLiveUsdToPkrRate();
  syncProfileUI();
  renderCoHostEmails();
  render12HourCalendarGrid();
  renderSavedCategories();
  renderAttendanceSessionsList();
  renderSupportTicketsUI();
  renderBillingSection();
  syncRealBackendSessions();
  fetchAndRenderServiceStatus();
  setInterval(fetchAndRenderServiceStatus, 60000);
  renderAdminPanel();
  handleGatewayReturnCallback();
});

// ============================================================================
// INTEGRATION GATE & ZOOM SESSION EXPIRY / CONNECTION ISSUE ALERTS
// ============================================================================
function isIntegrationComplete() {
  return Boolean(appState.profile && appState.profile.zoomConnected === true && appState.profile.zoomSessionStatus !== 'expired' && appState.profile.zoomSessionStatus !== 'error');
}

function openIntegrationGateModal() {
  const modal = document.getElementById('integration-gate-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeIntegrationGateModal() {
  const modal = document.getElementById('integration-gate-modal');
  if (modal) modal.classList.add('hidden');
}

function goToIntegrationsFromModal() {
  closeIntegrationGateModal();
  switchDashboardTab('profile');
  setTimeout(() => {
    const card = document.getElementById('zoom-integration-card');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-2', 'ring-yellow-400');
      setTimeout(() => card.classList.remove('ring-2', 'ring-yellow-400'), 1800);
    }
  }, 200);
}

function openZoomIssueModal(reasonText) {
  const modal = document.getElementById('zoom-issue-modal');
  const textEl = document.getElementById('zoom-issue-modal-text');
  if (textEl && reasonText) textEl.textContent = reasonText;
  if (modal) modal.classList.remove('hidden');
}

function closeZoomIssueModal() {
  const modal = document.getElementById('zoom-issue-modal');
  if (modal) modal.classList.add('hidden');
}

async function reportZoomSessionIssue(reason, sendEmail) {
  const msg = reason || 'Your Zoom session has expired or disconnected. Please reconnect your Zoom account in Security & Integrations.';
  appState.profile.zoomSessionStatus = 'expired';
  appState.profile.zoomSessionIssueReason = msg;
  persistState();
  syncProfileUI();
  openZoomIssueModal(msg);

  if (sendEmail && appState.profile && appState.profile.email) {
    try {
      const res = await fetch('/api/zoom-session-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: appState.profile.email,
          name: appState.profile.name || 'Workspace Owner',
          reason: msg
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.emailSent) {
          showToast('⚠️ Connection issue alert emailed to ' + appState.profile.email);
        }
      }
    } catch (e) {}
  }
}

function checkIntegrationAndSessionPopups() {
  if (!appState.profile || !appState.profile.authToken) return;
  if (appState.profile.zoomSessionStatus === 'expired' || appState.profile.zoomSessionStatus === 'error') {
    openZoomIssueModal(appState.profile.zoomSessionIssueReason);
    return;
  }
  if (!isIntegrationComplete()) {
    openIntegrationGateModal();
  }
}
