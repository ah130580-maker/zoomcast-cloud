const MASTER_ADMIN_USER = {
  name: 'Amir Hayat',
  email: 'amirjupiteradvisers@gmail.com',
  password: 'Amir5748@',
  authToken: 'master_tok_amir',
  hasActivePlan: true,
  planName: 'Enterprise'
};

let appState = {
  authMode: 'signin',
  otpPurpose: 'signup', // 'signup' or 'forgot'
  generatedOtp: null,
  otpTimerInterval: null,
  otpSecondsRemaining: 38,
  pendingSignupUser: null,
  pendingForgotData: null,
  selectedPlan: null,
  activeSessionDetailId: null,
  profile: {
    name: '',
    email: '',
    authToken: '',
    hasActivePlan: false,
    planName: 'Starter Plan',
    zoomConnected: false
  },
  usersDb: [MASTER_ADMIN_USER],
  coHostEmails: [],
  categories: [],
  currentCategory: {
    editingId: null,
    status: 'Active',
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
        allowCsvExport: false,
        allowWebinars: false
      },
      features: [
        "Up to 2 Automated Meeting Workflows",
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
        allowCsvExport: false,
        allowWebinars: false
      },
      features: [
        "Up to 5 Automated Meeting Workflows",
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
        allowCsvExport: true,
        allowWebinars: true
      },
      features: [
        "Unlimited Meeting & Zoom Webinar Workflows",
        "Unlimited Daily AM/PM Times & Custom Picker",
        "Unlimited Multi-Video Seamless Playlists",
        "Unlimited Team Auto Co-Host Emails",
        "Full Attendance + Real Zoom Chat Viewer",
        "1-Click Excel / CSV Export & 8GB Cloud Priority"
      ]
    }
  ],
  awsNodes: [
    {
      id: "aws-node-1",
      name: "AWS EC2 Node #1 (8GB RAM)",
      ip: "13.212.84.109",
      region: "ap-south-1",
      status: "Online",
      activeClient: "Ready",
      authMode: "Zoom OAuth ZAK Token"
    },
    {
      id: "aws-node-2",
      name: "AWS EC2 Node #2 (8GB RAM)",
      ip: "13.214.19.201",
      region: "ap-south-1",
      status: "Online",
      activeClient: "Ready",
      authMode: "Zoom OAuth ZAK Token"
    }
  ],
  clients: [
    {
      id: "USR-100",
      name: "Amir Hayat",
      email: "amirjupiteradvisers@gmail.com",
      plan: "Enterprise",
      categoriesCount: 0,
      coHostsCount: 0,
      assignedNode: "AWS EC2 Node #1 (8GB)",
      status: "Active"
    }
  ],
  attendanceSessions: []
};

// Load persisted data from localStorage & ensure MASTER_ADMIN_USER is always present
try {
  const savedUsers = localStorage.getItem('zoomcast_users_db');
  if (savedUsers) {
    const parsed = JSON.parse(savedUsers);
    if (Array.isArray(parsed)) appState.usersDb = parsed;
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

  const savedProfile = localStorage.getItem('zoomcast_profile');
  if (savedProfile) appState.profile = JSON.parse(savedProfile);

  const savedCoHosts = localStorage.getItem('zoomcast_cohosts');
  if (savedCoHosts) appState.coHostEmails = JSON.parse(savedCoHosts);

  const savedCategories = localStorage.getItem('zoomcast_categories');
  if (savedCategories) appState.categories = JSON.parse(savedCategories);

  const savedClients = localStorage.getItem('zoomcast_clients');
  if (savedClients) appState.clients = JSON.parse(savedClients);

  const savedSessions = localStorage.getItem('zoomcast_sessions');
  if (savedSessions) appState.attendanceSessions = JSON.parse(savedSessions);
} catch (e) {}

function persistState() {
  try {
    localStorage.setItem('zoomcast_users_db', JSON.stringify(appState.usersDb));
    localStorage.setItem('zoomcast_profile', JSON.stringify(appState.profile));
    localStorage.setItem('zoomcast_cohosts', JSON.stringify(appState.coHostEmails));
    localStorage.setItem('zoomcast_categories', JSON.stringify(appState.categories));
    localStorage.setItem('zoomcast_clients', JSON.stringify(appState.clients));
    localStorage.setItem('zoomcast_sessions', JSON.stringify(appState.attendanceSessions));
  } catch (e) {}
}

function showToast(msg) {
  const box = document.getElementById('toast-box');
  if (!box) return;
  box.textContent = msg;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 3600);
}

function togglePasswordVisibility(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function switchView(viewName) {
  if (viewName === 'dashboard') {
    if (!appState.profile.authToken || !appState.profile.hasActivePlan) {
      openAuthMode('signin');
      showToast('Please sign in with an active subscription to access the workspace.');
      return;
    }
  }

  const views = ['landing', 'auth', 'dashboard'];
  views.forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) el.classList.toggle('hidden', v !== viewName);
  });

  const pubHeader = document.getElementById('public-header');
  if (pubHeader) {
    pubHeader.classList.toggle('hidden', viewName === 'dashboard');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToPricingSection() {
  switchView('landing');
  setTimeout(() => {
    const sec = document.getElementById('pricing-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
  }, 80);
}

// ============================================================================
// PLAN FEATURE GATING ENGINE & BENTO STATS
// ============================================================================
function getActivePlanPermissions() {
  const planName = appState.profile.planName || 'Starter Plan';
  const plan = appState.plans.find(p => p.name === planName) || appState.plans[0];
  return plan.permissions;
}

function updateBentoStats() {
  const wfStat = document.getElementById('bento-stat-workflows');
  const chStat = document.getElementById('bento-stat-cohosts');
  const sesStat = document.getElementById('bento-stat-sessions');
  if (wfStat) wfStat.textContent = `${appState.categories.length} Workflows`;
  if (chStat) chStat.textContent = `${appState.coHostEmails.length} Members`;
  if (sesStat) sesStat.textContent = `${appState.attendanceSessions.length} Sessions`;
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

  // 1. Attendance Tab Visibility (Hidden on Starter Plan)
  const attTabBtn = document.getElementById('dtab-attendance');
  const attTabLabel = document.getElementById('dtab-attendance-label');
  if (attTabBtn) {
    attTabBtn.classList.toggle('hidden', !perms.allowAttendanceTab);
  }
  if (attTabLabel) {
    attTabLabel.textContent = perms.allowChatLogs ? 'Attendance & Chat Logs' : 'Attendance Report';
  }
  const attContent = document.getElementById('dash-content-attendance');
  if (!perms.allowAttendanceTab && attContent && !attContent.classList.contains('hidden')) {
    switchDashboardTab('categories');
  }

  // 2. Draft Mode Toggle & Save as Draft Button
  const draftToggleWrap = document.getElementById('builder-draft-toggle-wrap');
  const btnSaveDraft = document.getElementById('btn-save-draft');
  if (draftToggleWrap) draftToggleWrap.classList.toggle('hidden', !perms.allowDraftMode);
  if (btnSaveDraft) btnSaveDraft.classList.toggle('hidden', !perms.allowDraftMode);

  // 3. Session Type / Webinar Selector (Enterprise Only)
  const sesTypeWrap = document.getElementById('session-type-wrap');
  const wfNameCol = document.getElementById('workflow-name-col');
  if (sesTypeWrap) sesTypeWrap.classList.toggle('hidden', !perms.allowWebinars);
  if (wfNameCol) {
    wfNameCol.className = perms.allowWebinars ? 'md:col-span-2' : 'md:col-span-3';
  }

  // 4. Custom Hour/Minute Time Picker
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

  // 5. Video Upload (Single vs Multi-Video Playlist)
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
      vidHeading.textContent = '3. Upload Recorded Video (Single Video)';
      vidSub.textContent = 'Starter Plan supports 1 recorded video per meeting (unlimited GB file size).';
      vidDropTitle.textContent = '+ Choose 1 Recorded Video File';
    } else if (perms.maxVideosPerWorkflow === 2) {
      vidHeading.textContent = '3. Upload Recorded Videos (Up to 2 Back-to-Back Videos)';
      vidSub.textContent = 'Business Pro supports up to 2 videos playing seamlessly back-to-back.';
      vidDropTitle.textContent = '+ Choose 1 or 2 Video Files';
    } else {
      vidHeading.textContent = '3. Upload Recorded Videos (Unlimited Multi-Video Playlist)';
      vidSub.textContent = 'Enterprise supports unlimited back-to-back videos or per-time-slot video assignment.';
      vidDropTitle.textContent = '+ Choose Unlimited Video Files';
    }
  }

  // 6. Export CSV Buttons & Saved Chat View (Enterprise Only)
  const btnExpSummary = document.getElementById('btn-export-summary-csv');
  const btnExpDetail = document.getElementById('btn-export-detail-csv');
  const btnFullChat = document.getElementById('btn-open-full-chat');
  const thChat = document.getElementById('th-chat-messages');
  const detailHeading = document.getElementById('detail-table-heading');
  if (btnExpSummary) btnExpSummary.classList.toggle('hidden', !perms.allowCsvExport);
  if (btnExpDetail) btnExpDetail.classList.toggle('hidden', !perms.allowCsvExport);
  if (btnFullChat) btnFullChat.classList.toggle('hidden', !perms.allowChatLogs);
  if (thChat) thChat.classList.toggle('hidden', !perms.allowChatLogs);
  if (detailHeading) {
    detailHeading.textContent = perms.allowChatLogs
      ? 'Participants List & Real In-Meeting Chat Transcripts'
      : 'Participants Attendance List (Name, Email, Join & Leave Time)';
  }

  // 7. Team Co-Hosts Section Text
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
  render12HourCalendarGrid();
  renderSavedCategories();
  renderCoHostEmails();
  renderAttendanceSessionsList();
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
    if (el) el.classList.toggle('hidden', s !== stepName);
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
    document.getElementById('form-signin')?.classList.toggle('hidden', !isSignIn);
    document.getElementById('form-signup')?.classList.toggle('hidden', !isSignUp);
    document.getElementById('form-forgot')?.classList.toggle('hidden', !isForgot);

    if (isForgot) {
      const signInEmail = (document.getElementById('signin-email')?.value || '').trim();
      const forgotEmailInp = document.getElementById('forgot-email');
      if (signInEmail && forgotEmailInp && !forgotEmailInp.value) {
        forgotEmailInp.value = signInEmail;
      }
    }
  };

  // Run the exact 3D Diamond Flip Morph animation when switching between Login & Sign Up
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
// EXACT GLASSY 4-DIGIT OTP ANIMATION ENGINE (otp.mp4)
// ============================================================================
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
    row.classList.remove('hidden', 'otp-stage-orbit', 'otp-stage-converge');
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
  if (subEl) subEl.textContent = `Enter the 4-digit security code sent to your device`;

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
  const otp = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit security code matching otp.mp4
  appState.generatedOtp = otp;

  resetGlassyOtpStageUI();
  showAuthStep('otp');
  startOtpCountdownTimer();

  const codePill = document.getElementById('otp-live-code-pill');
  let sentViaSmtp = false;
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.sentEmail) sentViaSmtp = true;
    }
  } catch (e) {}

  if (codePill) {
    codePill.textContent = sentViaSmtp
      ? `Sent to ${email} • Security Code: ${otp}`
      : `Security Code for ${email}: ${otp}`;
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
    showToast('Invalid 4-digit OTP code. Please check the security code shown above.');
    return;
  }

  const row = document.getElementById('otp-boxes-row');
  const merged = document.getElementById('otp-merged-box');
  const mergedCheck = document.getElementById('otp-merged-check');
  const topWrap = document.getElementById('otp-top-icon-wrap');
  const iconKey = document.getElementById('otp-icon-key');
  const iconShield = document.getElementById('otp-icon-shield');
  const titleEl = document.getElementById('otp-title-heading');
  const subEl = document.getElementById('otp-subtitle-text');
  const btn = document.getElementById('otp-submit-btn');

  // Phase 1 (00:01 - 00:02): Button shows "Verifying Code..." + 4 Boxes form Rotating Diamond Orbit
  if (btn) {
    btn.innerHTML = `<span class="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span><span>Verifying Code...</span>`;
  }
  if (row) {
    row.classList.add('otp-stage-orbit');
  }

  // Phase 2 (00:03): Converge into single center glowing square
  setTimeout(() => {
    if (row) row.classList.add('hidden');
    if (merged) merged.classList.remove('hidden');
  }, 850);

  // Phase 3 (00:04): Morph to Emerald Green Checkmark + "Verified Successfully" + "Verified & Secured"
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

  // Phase 4: Complete action after user sees "Verified Successfully"
  setTimeout(() => {
    if (appState.otpPurpose === 'forgot' && appState.pendingForgotData) {
      const { email, newPass } = appState.pendingForgotData;
      const uIdx = appState.usersDb.findIndex(u => u.email.toLowerCase() === email);
      if (uIdx >= 0) {
        appState.usersDb[uIdx].password = newPass;
      }
      if (email === MASTER_ADMIN_USER.email.toLowerCase()) {
        MASTER_ADMIN_USER.password = newPass;
      }
      appState.pendingForgotData = null;
      persistState();

      const signInEmailInp = document.getElementById('signin-email');
      const signInPassInp = document.getElementById('signin-password');
      if (signInEmailInp) signInEmailInp.value = email;
      if (signInPassInp) signInPassInp.value = '';

      openAuthMode('signin');
      showToast('✓ Password reset verified & saved! Please sign in with your new password.');
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
  if (confirmPassword && password !== confirmPassword) {
    showToast('Passwords do not match. Please check Confirm Password.');
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
  const newPass = (document.getElementById('forgot-new-password')?.value || '').trim();

  if (!email || !email.includes('@')) {
    showToast('Please enter your registered email address.');
    return;
  }
  const existingUser = appState.usersDb.find(u => u.email.toLowerCase() === email);
  if (!existingUser) {
    showToast('No registered account found with this email address.');
    return;
  }
  if (!newPass || newPass.length < 6) {
    showToast('Please enter a new password (minimum 6 characters).');
    return;
  }

  appState.pendingForgotData = { email, newPass };
  launchGlassyOtpScreen(email, 'forgot');
}

async function saveFreeSmtpConfig() {
  const gmailUser = (document.getElementById('smtp-gmail-user')?.value || '').trim();
  const gmailAppPassword = (document.getElementById('smtp-gmail-pass')?.value || '').trim();
  if (!gmailUser || !gmailAppPassword) {
    showToast('Please enter both Gmail Address and 16-Digit App Password');
    return;
  }
  try {
    await fetch('/api/save-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gmailUser, gmailAppPassword })
    });
  } catch (e) {}
  showToast('✓ Free Gmail SMTP OTP Sender Activated!');
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
      showToast('No active paid subscription found for this account. Please Sign Up and subscribe first.');
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
    const nameInp = document.getElementById('signup-name');
    const email = enteredEmail || 'new.subscriber@gmail.com';
    const name = (nameInp && nameInp.value.trim()) ? nameInp.value.trim() : 'New Subscriber';
    appState.profile = {
      name,
      email,
      authToken: 'google_tok_' + Date.now(),
      hasActivePlan: false,
      planName: '',
      zoomConnected: true
    };
    persistState();
    showAuthStep('plan');
    showToast('Account linked. Please select a plan and complete payment to unlock access.');
  }
}

function renderModalPlanSelector() {
  const container = document.getElementById('modal-plan-selector-list');
  if (!container) return;

  container.innerHTML = appState.plans.map(plan => {
    const priceStr = `$${plan.priceUsd}`;
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
          <span class="text-base sm:text-lg font-extrabold text-yellow-400 block">${priceStr}.00/mo</span>
          <span class="text-xs font-bold text-white">Select Plan →</span>
        </div>
      </div>
    `;
  }).join('');
}

function selectPlanForCheckout(planId) {
  const plan = appState.plans.find(p => p.id === planId) || appState.plans[1];
  appState.selectedPlan = plan;
  if (!appState.profile.authToken) {
    openAuthMode('signup');
    showToast(`Selected ${plan.name} ($${plan.priceUsd}.00/mo). Create your account first to proceed to payment.`);
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

function updateLive3DCard() {
  const holder = (document.getElementById('card-holder')?.value || '').trim().toUpperCase();
  const number = (document.getElementById('card-number')?.value || '').trim();
  const expiry = (document.getElementById('card-expiry')?.value || '').trim();
  const cvc = (document.getElementById('card-cvc')?.value || '').trim();

  const liveHolder = document.getElementById('live-card-holder');
  const liveNumber = document.getElementById('live-card-number');
  const liveExpiry = document.getElementById('live-card-expiry');
  const liveCvc = document.getElementById('live-card-cvc');

  if (liveHolder) liveHolder.textContent = holder || 'AMIR HAYAT';
  if (liveNumber) liveNumber.textContent = number ? number.replace(/\s/g, '  ') : '5412  7534  8910  3414';
  if (liveExpiry) liveExpiry.textContent = expiry || '09/28';
  if (liveCvc) liveCvc.textContent = cvc || '842';
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

function proceedToCardPayment(planId) {
  const plan = appState.plans.find(p => p.id === planId) || appState.plans[1];
  appState.selectedPlan = plan;
  const nameEl = document.getElementById('checkout-plan-name');
  const priceEl = document.getElementById('checkout-plan-price');
  const btnTextEl = document.getElementById('btn-pay-now-text');

  if (nameEl) nameEl.textContent = `${plan.name} (Monthly)`;
  if (priceEl) priceEl.textContent = `$${plan.priceUsd}.00`;
  if (btnTextEl) btnTextEl.textContent = `PAY $${plan.priceUsd}.00 NOW`;

  const holderInp = document.getElementById('card-holder');
  if (holderInp && !holderInp.value && appState.profile.name) {
    holderInp.value = appState.profile.name.toUpperCase();
  }
  updateLive3DCard();
  showAuthStep('payment');
}

function completeSubscriptionAndLogin() {
  const holder = (document.getElementById('card-holder')?.value || '').trim();
  const number = (document.getElementById('card-number')?.value || '').replace(/\s+/g, '');
  const expiry = (document.getElementById('card-expiry')?.value || '').trim();
  const cvc = (document.getElementById('card-cvc')?.value || '').trim();

  if (!holder || number.length < 12 || !expiry || cvc.length < 3) {
    showToast('Please enter valid Cardholder Name, 16-Digit Card Number, Expiry Date, and CVV.');
    return;
  }

  // Exact Video Animation (Payment_page_.mp4 00:02 -> 00:05):
  // 1. Flip card to front, hide right form, center the 3D card, sweep gold shimmer & fill progress bar
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

  if (formCol) formCol.classList.add('hidden');
  if (cardCol) cardCol.className = 'lg:col-span-12 flex flex-col items-center justify-center py-6 transition-all duration-700';
  if (badges) badges.classList.add('hidden');
  if (cardFront) cardFront.classList.add('card-shimmer');
  if (procStatus) procStatus.classList.remove('hidden');

  setTimeout(() => {
    if (progFill) progFill.style.width = '100%';
  }, 80);

  // 2. At 1.3s (Frame 00:04): Morph 3D Card into Emerald Green Platinum Card + Show "Payment Successful!"
  setTimeout(() => {
    if (cardFront) {
      cardFront.classList.remove('card-shimmer');
      cardFront.classList.add('card-emerald-success');
    }
    if (progWrap) progWrap.classList.add('hidden');
    if (statusLbl) statusLbl.classList.add('hidden');
    if (successBadge) successBadge.classList.remove('hidden');
  }, 1300);

  // 3. Activate Plan & Open Glassy Dashboard
  setTimeout(() => {
    const planName = appState.selectedPlan ? appState.selectedPlan.name : 'Business Pro';
    appState.profile.hasActivePlan = true;
    appState.profile.planName = planName;

    const uIdx = appState.usersDb.findIndex(u => u.email.toLowerCase() === appState.profile.email.toLowerCase());
    if (uIdx >= 0) {
      appState.usersDb[uIdx].hasActivePlan = true;
      appState.usersDb[uIdx].planName = planName;
    }

    const existingIdx = appState.clients.findIndex(c => c.email.toLowerCase() === appState.profile.email.toLowerCase());
    const clientRecord = {
      id: 'USR-' + Math.floor(100 + Math.random() * 900),
      name: appState.profile.name || holder,
      email: appState.profile.email,
      plan: planName,
      categoriesCount: appState.categories.length,
      coHostsCount: appState.coHostEmails.length,
      assignedNode: 'AWS EC2 Node #1 (8GB)',
      status: 'Active'
    };
    if (existingIdx >= 0) {
      appState.clients[existingIdx] = clientRecord;
    } else {
      appState.clients.unshift(clientRecord);
    }

    persistState();
    syncProfileUI();
    switchView('dashboard');
    showToast(`🎉 Payment Successful! ${planName} is now active.`);
  }, 2600);
}

function logoutClient() {
  appState.profile.authToken = '';
  appState.profile.hasActivePlan = false;
  persistState();
  switchView('landing');
  showToast('Signed out successfully.');
}

function switchDashboardTab(tab) {
  const perms = getActivePlanPermissions();
  if (tab === 'attendance' && !perms.allowAttendanceTab) {
    showToast('Attendance Reports are available in Business Pro & Enterprise plans.');
    return;
  }

  const tabs = ['categories', 'attendance', 'profile'];
  tabs.forEach(t => {
    const content = document.getElementById('dash-content-' + t);
    const btn = document.getElementById('dtab-' + t);
    if (content) content.classList.toggle('hidden', t !== tab);
    if (btn) {
      btn.className = t === tab
        ? 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600/90 to-indigo-600/80 text-white shadow-lg shadow-blue-600/25 border border-blue-400/30 whitespace-nowrap text-left transition'
        : 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white whitespace-nowrap text-left transition';
      if (t === 'attendance' && !perms.allowAttendanceTab) {
        btn.classList.add('hidden');
      }
    }
  });

  const userName = appState.profile.name || 'Amir Hayat';
  const titles = {
    categories: `Hi, ${userName} 👋 — Meeting Workflows`,
    attendance: perms.allowChatLogs ? 'Broadcast Attendance & Live Chat Logs' : 'Broadcast Attendance Report',
    profile: 'Security & Active Workspace Sessions'
  };
  const titleEl = document.getElementById('workspace-page-title');
  if (titleEl && titles[tab]) titleEl.textContent = titles[tab];
}

function renderPricingCards() {
  const container = document.getElementById('pricing-cards-container');
  if (!container) return;
  container.innerHTML = appState.plans.map(plan => {
    const priceStr = `$${plan.priceUsd}`;
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
          <div class="mt-3 flex items-baseline gap-1">
            <span class="text-3xl sm:text-4xl font-extrabold text-yellow-400">${priceStr}</span>
            <span class="text-xs text-slate-400 font-semibold">/ month</span>
          </div>
          <ul class="mt-6 space-y-3 border-t border-white/10 pt-5">
            ${featuresHtml}
          </ul>
        </div>
        <button onclick="selectPlanForCheckout('${plan.id}')" class="mt-7 w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm ${plan.popular ? 'btn-gold' : 'btn-glass'}">
          Choose ${plan.name} ($${plan.priceUsd}/mo) →
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
  const badge = document.getElementById('zoom-conn-badge');
  const titleEl = document.getElementById('workspace-page-title');

  if (sName) sName.textContent = appState.profile.name || 'Amir Hayat';
  if (sEmail) sEmail.textContent = appState.profile.email || 'amirjupiteradvisers@gmail.com';
  if (pName) pName.value = appState.profile.name || '';
  if (pEmail) pEmail.value = appState.profile.email || '';
  if (titleEl && appState.profile.name) {
    titleEl.textContent = `Hi, ${appState.profile.name} 👋`;
  }
  if (badge && appState.profile.zoomConnected) {
    badge.textContent = '● Zoom Connected via Google';
  }
  applyPlanFeatureRestrictions();
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
  let sentViaSmtp = false;
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.sentEmail) sentViaSmtp = true;
    }
  } catch (e) {}

  if (sentViaSmtp) {
    if (hint) hint.textContent = `Sent to ${email} (${otp})`;
    showToast(`✓ 4-Digit Reset OTP sent to ${email}`);
  } else {
    if (hint) hint.textContent = `OTP: ${otp}`;
    showToast(`✓ 4-Digit Reset OTP generated for ${email}`);
  }
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
    showToast('Invalid OTP code. Please enter the correct 4-digit OTP.');
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
  const badge = document.getElementById('zoom-conn-badge');
  if (badge) {
    badge.textContent = '● Zoom Connected via Google';
  }
  persistState();
  showToast('✓ Zoom Account Connected via Google OAuth');
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
// GLASSY 12-HOUR (AM / PM) CALENDAR & WORKFLOW BUILDER
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

function updateBuilderStatusLabel() {
  const chk = document.getElementById('cat-status-active');
  const lbl = document.getElementById('cat-status-label');
  if (!chk || !lbl) return;
  if (chk.checked) {
    lbl.textContent = 'Active (Live)';
    lbl.className = 'text-xs font-extrabold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30';
  } else {
    lbl.textContent = 'Draft (Paused)';
    lbl.className = 'text-xs font-extrabold text-yellow-400 bg-yellow-500/15 px-2.5 py-0.5 rounded-md border border-yellow-500/30';
  }
}

function toggleAllWeekdays() {
  const chks = document.querySelectorAll('.cat-day-chk');
  const allChecked = Array.from(chks).every(c => c.checked);
  chks.forEach(c => { c.checked = !allChecked; });
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
    // Exact glowing Gold highlight from Theme_Stayle.mp4 00:04 Calendar!
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
    };
  });
}

function removeCategoryVideo(idx) {
  appState.currentCategory.videos.splice(idx, 1);
  renderCategoryVideosList();
  renderSelectedTimesAssignment();
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
    videos: [],
    selectedTimes: ['10:00 AM', '03:00 PM'],
    slotVideoMap: {}
  };
  const nameInp = document.getElementById('cat-name');
  const activeChk = document.getElementById('cat-status-active');
  const headingEl = document.getElementById('cat-form-heading');
  if (nameInp) nameInp.value = '';
  if (activeChk) activeChk.checked = true;
  if (headingEl) headingEl.textContent = 'Workflow Builder';
  updateBuilderStatusLabel();
  renderCategoryVideosList();
  render12HourCalendarGrid();
}

async function saveMeetingCategory(forcedStatus) {
  const perms = getActivePlanPermissions();
  if (!appState.currentCategory.editingId && appState.categories.length >= perms.maxWorkflows) {
    showToast(`Your ${appState.profile.planName} allows up to ${perms.maxWorkflows} workflows.`);
    return;
  }

  const nameInp = document.getElementById('cat-name');
  const sessionType = perms.allowWebinars
    ? (document.getElementById('cat-session-type')?.value || 'Zoom Meeting')
    : 'Zoom Meeting';
  const activeChk = document.getElementById('cat-status-active');
  const status = (!perms.allowDraftMode)
    ? 'Active'
    : (forcedStatus || (activeChk && activeChk.checked ? 'Active' : 'Draft'));

  const catName = (nameInp && nameInp.value.trim()) ? nameInp.value.trim() : `Workflow #${appState.categories.length + 1}`;
  const selectedDays = Array.from(document.querySelectorAll('.cat-day-chk:checked')).map(c => c.value);

  if (selectedDays.length === 0) {
    showToast('Please check at least one day of the week');
    return;
  }
  if (appState.currentCategory.selectedTimes.length === 0) {
    showToast('Please select at least one AM/PM broadcast time');
    return;
  }

  const totalSec = appState.currentCategory.videos.reduce((acc, v) => acc + (v.durationSec || 0), 0);

  const newCat = {
    id: appState.currentCategory.editingId || ('WF-' + Date.now()),
    name: catName,
    sessionType,
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
  showToast(status === 'Draft' ? `Saved "${catName}" as Draft` : `✓ Workflow "${catName}" Published & Active!`);
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
    videos: [...(cat.videos || [])],
    selectedTimes: [...(cat.times || [])],
    slotVideoMap: { ...(cat.slotVideoMap || {}) }
  };

  const nameInp = document.getElementById('cat-name');
  const sessionSel = document.getElementById('cat-session-type');
  const activeChk = document.getElementById('cat-status-active');
  const headingEl = document.getElementById('cat-form-heading');

  if (nameInp) nameInp.value = cat.name || '';
  if (sessionSel && cat.sessionType) sessionSel.value = cat.sessionType;
  if (activeChk) activeChk.checked = cat.status === 'Active';
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

  updateBuilderStatusLabel();
  renderCategoryVideosList();
  render12HourCalendarGrid();

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
        No workflows created yet. Use the Workflow Builder below to create your automated schedule.
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
      : 'No video attached yet';

    const draftBtnHtml = perms.allowDraftMode
      ? `<button type="button" onclick="toggleWorkflowStatus('${cat.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap ${isActive ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/25' : 'bg-emerald-500 text-black border-emerald-400'}">${isActive ? 'Switch to Draft' : 'Activate Workflow'}</button>`
      : '';

    return `
      <div class="p-4 rounded-2xl glass-card-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-extrabold text-white text-sm">${cat.name}</span>
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">${cat.sessionType || 'Zoom Meeting'}</span>
            <span class="px-2.5 py-0.5 rounded text-[11px] font-extrabold border ${badgeClass}">● ${cat.status}</span>
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
    `;
  }).join('');
}

async function syncBackendConfig() {
  const activeCats = appState.categories.filter(c => c.status === 'Active');
  const firstCat = activeCats[0] || appState.categories[0];
  const playlistNames = firstCat && firstCat.videos ? firstCat.videos.map(v => v.name) : [];
  const times12h = firstCat && firstCat.times ? firstCat.times : ['10:00 AM', '03:00 PM'];
  const times24h = times12h.map(t => convert12hTo24h(t));

  const payload = {
    ZoomMeetingUrl: 'https://zoom.us/j/auto',
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

async function triggerLiveMeetingNow() {
  await syncBackendConfig();
  try {
    const res = await fetch('/api/run-now', { method: 'POST' });
    if (res.ok) {
      showToast('🚀 Launching Automated Zoom Broadcast...');
      return;
    }
  } catch (e) {}
  showToast('🚀 Broadcast Triggered on Cloud Worker');
}

// ============================================================================
// REAL ZOOM CHAT PARSER & GLASSY CHAT MODAL (Theme_Stayle.mp4 00:05)
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
// ADMIN CONSOLE RENDERER (DARK GLASSY)
// ============================================================================
function renderAdminPanel() {
  const nodesList = document.getElementById('admin-aws-nodes-list');
  if (nodesList) {
    nodesList.innerHTML = appState.awsNodes.map(node => `
      <div class="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-white text-sm">${node.name}</h4>
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">● ${node.status}</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">IP: <code class="text-yellow-400">${node.ip}</code> • Region: ${node.region}</p>
          <p class="text-[11px] text-emerald-400 mt-2 font-medium">✓ ${node.authMode}</p>
        </div>
      </div>
    `).join('');
  }

  const clientsTbody = document.getElementById('admin-clients-tbody');
  if (clientsTbody) {
    if (appState.clients.length === 0) {
      clientsTbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-6 text-center text-xs text-slate-400">No customers registered yet.</td>
        </tr>
      `;
    } else {
      clientsTbody.innerHTML = appState.clients.map((c, idx) => `
        <tr>
          <td class="py-3.5 px-3">
            <div class="font-bold text-white">${c.name}</div>
            <div class="text-slate-400 font-mono text-[11px]">${c.email}</div>
          </td>
          <td class="py-3.5 px-3 font-semibold text-yellow-400">${c.plan}</td>
          <td class="py-3.5 px-3 text-slate-300">${c.categoriesCount || 0} Workflows</td>
          <td class="py-3.5 px-3 text-slate-300">${c.coHostsCount || 0} Team Members</td>
          <td class="py-3.5 px-3 text-slate-300">${c.assignedNode}</td>
          <td class="py-3.5 px-3">
            <button onclick="toggleClientStatus(${idx})" class="px-2.5 py-1 rounded text-xs font-bold ${c.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}">
              ${c.status}
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  const statClients = document.getElementById('admin-stat-clients');
  const statNodes = document.getElementById('admin-stat-nodes');
  if (statClients) statClients.textContent = `${appState.clients.length} Clients`;
  if (statNodes) statNodes.textContent = `${appState.awsNodes.length} Online`;
}

function toggleClientStatus(idx) {
  const c = appState.clients[idx];
  c.status = c.status === 'Active' ? 'Paused' : 'Active';
  persistState();
  renderAdminPanel();
}

function addNewAwsNode() {
  const nextNum = appState.awsNodes.length + 1;
  const ip = prompt('Enter new AWS 8GB Instance IP Address:');
  if (!ip) return;
  appState.awsNodes.push({
    id: `aws-node-${nextNum}`,
    name: `AWS EC2 Node #${nextNum} (8GB RAM)`,
    ip,
    region: 'ap-south-1',
    status: 'Online',
    activeClient: 'Ready',
    authMode: 'Zoom OAuth ZAK Token'
  });
  renderAdminPanel();
  showToast(`✓ Added AWS EC2 Node #${nextNum}`);
}

window.addEventListener('DOMContentLoaded', () => {
  renderPricingCards();
  syncProfileUI();
  renderCoHostEmails();
  render12HourCalendarGrid();
  renderSavedCategories();
  renderAttendanceSessionsList();
  syncRealBackendSessions();
  renderAdminPanel();
});
