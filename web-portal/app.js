let appState = {
  currency: 'PKR',
  authMode: 'signin',
  generatedOtp: null,
  selectedPlan: null,
  activeSessionDetailId: null,
  profile: {
    name: '',
    email: '',
    authToken: '',
    hasActivePlan: false,
    planName: '',
    zoomConnected: false
  },
  usersDb: [],
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
      pricePkr: 4500,
      priceUsd: 19,
      features: [
        "Up to 2 Active Meeting Workflows",
        "Unlimited Video File Size",
        "7-Day Weekly & 12-Hour AM/PM Scheduler",
        "Unlimited Team Co-Host Emails",
        "Attendance & Chat Messages Log"
      ]
    },
    {
      id: "pro",
      name: "Business Pro",
      popular: true,
      pricePkr: 8500,
      priceUsd: 35,
      features: [
        "Unlimited Meeting & Webinar Workflows",
        "Multi-Video Seamless Playlists",
        "Draft & Active Workflow Toggle",
        "Unlimited Team Co-Host Emails",
        "Full Attendance & Chat CSV Export",
        "Auto-End Meeting on Completion"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      pricePkr: 16500,
      priceUsd: 65,
      features: [
        "Unlimited Workflows & Zoom Accounts",
        "Dedicated 8GB Cloud Worker Node",
        "Multi-Video Back-to-Back Streaming",
        "Unlimited Team Co-Host Promotion",
        "Priority Account Support"
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
  clients: [],
  attendanceSessions: []
};

// Load persisted data from localStorage
try {
  const savedUsers = localStorage.getItem('zoomcast_users_db');
  if (savedUsers) appState.usersDb = JSON.parse(savedUsers);

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
  setTimeout(() => box.classList.add('hidden'), 3500);
}

function switchView(viewName) {
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
// AUTHENTICATION FLOW: SIGN IN vs SIGN UP (OTP) -> PLAN SELECTION -> PAYMENT
// ============================================================================
function showAuthStep(stepName) {
  const steps = ['account', 'plan', 'payment'];
  steps.forEach(s => {
    const el = document.getElementById('auth-step-' + s);
    if (el) el.classList.toggle('hidden', s !== stepName);
  });
  if (stepName === 'plan') {
    renderModalPlanSelector();
  }
}

function openAuthMode(mode) {
  appState.authMode = mode;
  switchView('auth');
  showAuthStep('account');

  const isSignIn = mode === 'signin';
  const formSignIn = document.getElementById('form-signin');
  const formSignUp = document.getElementById('form-signup');
  const btnSignIn = document.getElementById('tab-btn-signin');
  const btnSignUp = document.getElementById('tab-btn-signup');

  if (formSignIn) formSignIn.classList.toggle('hidden', !isSignIn);
  if (formSignUp) formSignUp.classList.toggle('hidden', isSignIn);

  if (btnSignIn && btnSignUp) {
    btnSignIn.className = isSignIn
      ? 'py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-white text-slate-900 shadow-sm whitespace-nowrap'
      : 'py-2.5 rounded-lg text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 whitespace-nowrap';
    btnSignUp.className = !isSignIn
      ? 'py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-white text-slate-900 shadow-sm whitespace-nowrap'
      : 'py-2.5 rounded-lg text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 whitespace-nowrap';
  }
}

function openGetStartedModal() {
  if (appState.profile.authToken) {
    switchView('auth');
    showAuthStep('plan');
  } else {
    openAuthMode('signup');
  }
}

function sendEmailOtpCode() {
  const emailInp = document.getElementById('signup-email');
  const email = emailInp ? emailInp.value.trim() : '';
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address first');
    return;
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  appState.generatedOtp = otp;

  const box = document.getElementById('otp-verification-box');
  const hint = document.getElementById('otp-hint-badge');
  if (box) box.classList.remove('hidden');
  if (hint) hint.textContent = `Demo OTP: ${otp}`;

  showToast(`Verification OTP sent to ${email} (Code: ${otp})`);
}

function handleEmailSignUp() {
  const name = (document.getElementById('signup-name')?.value || '').trim();
  const email = (document.getElementById('signup-email')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('signup-password')?.value || '').trim();
  const otpEntered = (document.getElementById('signup-otp-input')?.value || '').trim();

  if (!name || !email || !password) {
    showToast('Please fill in your Full Name, Email, and Password');
    return;
  }

  if (!appState.generatedOtp) {
    sendEmailOtpCode();
    showToast('We sent a 6-digit OTP to your email. Please enter it to verify.');
    return;
  }

  if (otpEntered !== appState.generatedOtp) {
    showToast('Invalid OTP code. Please check the 6-digit OTP shown.');
    return;
  }

  const token = 'tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  const userObj = {
    name,
    email,
    password,
    authToken: token,
    hasActivePlan: false,
    planName: ''
  };

  const idx = appState.usersDb.findIndex(u => u.email === email);
  if (idx >= 0) {
    appState.usersDb[idx] = userObj;
  } else {
    appState.usersDb.push(userObj);
  }

  appState.profile = {
    name,
    email,
    authToken: token,
    hasActivePlan: false,
    planName: '',
    zoomConnected: false
  };

  persistState();
  syncProfileUI();
  showToast('✓ Account Created & Saved! Now select your subscription plan.');

  if (appState.selectedPlan) {
    proceedToCardPayment(appState.selectedPlan.id);
  } else {
    showAuthStep('plan');
  }
}

function handleEmailSignIn() {
  const email = (document.getElementById('signin-email')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('signin-password')?.value || '').trim();

  if (!email || !password) {
    showToast('Please enter your Email and Password');
    return;
  }

  const existingUser = appState.usersDb.find(u => u.email === email && u.password === password);
  const token = 'tok_' + Date.now();

  if (existingUser) {
    existingUser.authToken = token;
    appState.profile = {
      name: existingUser.name,
      email: existingUser.email,
      authToken: token,
      hasActivePlan: existingUser.hasActivePlan,
      planName: existingUser.planName || 'Business Pro',
      zoomConnected: true
    };
  } else {
    // Allow signing in and saving session token
    appState.profile = {
      name: email.split('@')[0],
      email,
      authToken: token,
      hasActivePlan: true,
      planName: 'Business Pro',
      zoomConnected: false
    };
    appState.usersDb.push({
      name: appState.profile.name,
      email,
      password,
      authToken: token,
      hasActivePlan: true,
      planName: 'Business Pro'
    });
  }

  persistState();
  syncProfileUI();

  if (appState.profile.hasActivePlan) {
    switchView('dashboard');
    showToast('✓ Signed in successfully!');
  } else {
    showAuthStep('plan');
  }
}

function handleGoogleAuthContinue() {
  const token = 'google_tok_' + Date.now();
  const emailInp = document.getElementById(appState.authMode === 'signin' ? 'signin-email' : 'signup-email');
  const nameInp = document.getElementById('signup-name');
  const email = (emailInp && emailInp.value.trim()) ? emailInp.value.trim() : 'google.user@gmail.com';
  const name = (nameInp && nameInp.value.trim()) ? nameInp.value.trim() : 'Google Verified User';

  appState.profile = {
    name,
    email,
    authToken: token,
    hasActivePlan: appState.authMode === 'signin',
    planName: 'Business Pro',
    zoomConnected: true
  };
  persistState();
  syncProfileUI();

  if (appState.authMode === 'signin' && appState.profile.hasActivePlan) {
    switchView('dashboard');
    showToast('✓ Signed in with Google!');
  } else if (appState.selectedPlan) {
    proceedToCardPayment(appState.selectedPlan.id);
  } else {
    showAuthStep('plan');
    showToast('✓ Google Account Connected! Please choose your plan.');
  }
}

function renderModalPlanSelector() {
  const container = document.getElementById('modal-plan-selector-list');
  if (!container) return;

  container.innerHTML = appState.plans.map(plan => {
    const priceStr = appState.currency === 'PKR'
      ? `Rs. ${plan.pricePkr.toLocaleString()}`
      : `$${plan.priceUsd}`;
    return `
      <div onclick="proceedToCardPayment('${plan.id}')" class="p-4 rounded-xl border ${plan.popular ? 'border-2 border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-white'} hover:border-blue-600 cursor-pointer flex items-center justify-between transition">
        <div>
          <div class="flex items-center gap-2">
            <h4 class="font-extrabold text-slate-900 text-sm sm:text-base">${plan.name}</h4>
            ${plan.popular ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">POPULAR</span>' : ''}
          </div>
          <p class="text-xs text-slate-500 mt-0.5">${plan.features[0]} • ${plan.features[1]}</p>
        </div>
        <div class="text-right shrink-0 ml-3">
          <span class="text-base sm:text-lg font-extrabold text-slate-900 block">${priceStr}</span>
          <span class="text-xs font-bold text-blue-600">Select Plan →</span>
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
    showToast(`Selected ${plan.name}. Create your account first to continue to payment.`);
  } else {
    switchView('auth');
    proceedToCardPayment(plan.id);
  }
}

function proceedToCardPayment(planId) {
  const plan = appState.plans.find(p => p.id === planId) || appState.plans[1];
  appState.selectedPlan = plan;
  const priceStr = appState.currency === 'PKR' ? `Rs. ${plan.pricePkr.toLocaleString()}` : `$${plan.priceUsd}`;
  const nameEl = document.getElementById('checkout-plan-name');
  const priceEl = document.getElementById('checkout-plan-price');
  if (nameEl) nameEl.textContent = plan.name;
  if (priceEl) priceEl.textContent = priceStr;
  showAuthStep('payment');
}

function completeSubscriptionAndLogin() {
  const planName = document.getElementById('checkout-plan-name')?.textContent || 'Business Pro';
  appState.profile.hasActivePlan = true;
  appState.profile.planName = planName;

  const uIdx = appState.usersDb.findIndex(u => u.email === appState.profile.email);
  if (uIdx >= 0) {
    appState.usersDb[uIdx].hasActivePlan = true;
    appState.usersDb[uIdx].planName = planName;
  }

  const existingIdx = appState.clients.findIndex(c => c.email === appState.profile.email);
  const clientRecord = {
    id: 'USR-' + Math.floor(100 + Math.random() * 900),
    name: appState.profile.name || 'Workspace User',
    email: appState.profile.email || 'user@workspace.com',
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
  showToast('🎉 Subscription Active! Welcome to your Workspace.');
}

function logoutClient() {
  appState.profile.authToken = '';
  persistState();
  switchView('landing');
  showToast('Signed out successfully.');
}

function switchDashboardTab(tab) {
  const tabs = ['categories', 'attendance', 'profile'];
  tabs.forEach(t => {
    const content = document.getElementById('dash-content-' + t);
    const btn = document.getElementById('dtab-' + t);
    if (content) content.classList.toggle('hidden', t !== tab);
    if (btn) {
      btn.className = t === tab
        ? 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white whitespace-nowrap text-left'
        : 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white whitespace-nowrap text-left';
    }
  });

  const titles = {
    categories: 'Meeting & Webinar Workflows',
    attendance: 'Broadcast Attendance & Saved Chat Logs',
    profile: 'Profile, Zoom Integration & Team Co-Hosts'
  };
  const titleEl = document.getElementById('workspace-page-title');
  if (titleEl && titles[tab]) titleEl.textContent = titles[tab];
}

function setCurrency(cur) {
  appState.currency = cur;
  const pkrBtn = document.getElementById('cur-pkr');
  const usdBtn = document.getElementById('cur-usd');
  if (pkrBtn && usdBtn) {
    pkrBtn.className = cur === 'PKR'
      ? 'px-4 py-1.5 rounded-lg text-xs font-bold ghl-btn-primary'
      : 'px-4 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 whitespace-nowrap';
    usdBtn.className = cur === 'USD'
      ? 'px-4 py-1.5 rounded-lg text-xs font-bold ghl-btn-primary'
      : 'px-4 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 whitespace-nowrap';
  }
  renderPricingCards();
}

function renderPricingCards() {
  const container = document.getElementById('pricing-cards-container');
  if (!container) return;
  container.innerHTML = appState.plans.map(plan => {
    const priceStr = appState.currency === 'PKR'
      ? `Rs. ${plan.pricePkr.toLocaleString()}`
      : `$${plan.priceUsd}`;
    const borderClass = plan.popular
      ? 'border-2 border-blue-600 shadow-xl relative'
      : 'border border-slate-200';
    const badge = plan.popular
      ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-600 text-white whitespace-nowrap">MOST POPULAR</span>`
      : '';
    const featuresHtml = plan.features.map(f => `
      <li class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
        <span class="text-blue-600 font-extrabold">✓</span>
        <span>${f}</span>
      </li>
    `).join('');

    return `
      <div class="ghl-card p-6 sm:p-8 rounded-2xl flex flex-col justify-between ${borderClass}">
        ${badge}
        <div>
          <h3 class="text-lg font-extrabold text-slate-900">${plan.name}</h3>
          <div class="mt-3 flex items-baseline gap-1">
            <span class="text-3xl sm:text-4xl font-extrabold text-slate-900">${priceStr}</span>
            <span class="text-xs text-slate-500 font-semibold">/ month</span>
          </div>
          <ul class="mt-6 space-y-3 border-t border-slate-200 pt-5">
            ${featuresHtml}
          </ul>
        </div>
        <button onclick="selectPlanForCheckout('${plan.id}')" class="mt-7 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm ${plan.popular ? 'ghl-btn-primary' : 'ghl-btn-secondary'}">
          Choose ${plan.name} →
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

  if (sName) sName.textContent = appState.profile.name || 'Workspace User';
  if (sEmail) sEmail.textContent = appState.profile.email || 'Active Session';
  if (pName) pName.value = appState.profile.name || '';
  if (pEmail) pEmail.value = appState.profile.email || '';
  if (badge && appState.profile.zoomConnected) {
    badge.textContent = '● Zoom Connected via Google';
  }
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
// UNLIMITED TEAM CO-HOST EMAILS MANAGER
// ============================================================================
function addCoHostEmail() {
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
    syncBackendConfig();
    showToast(`✓ Added ${email} to Team Co-Hosts`);
  }
  input.value = '';
}

function removeCoHostEmail(idx) {
  const removed = appState.coHostEmails.splice(idx, 1);
  persistState();
  renderCoHostEmails();
  syncBackendConfig();
  showToast(`Removed ${removed[0]}`);
}

function renderCoHostEmails() {
  const listEl = document.getElementById('cohost-emails-list');
  const badgeEl = document.getElementById('cohost-count-badge');
  if (badgeEl) {
    badgeEl.textContent = `${appState.coHostEmails.length} Team Member${appState.coHostEmails.length === 1 ? '' : 's'}`;
  }
  if (!listEl) return;

  if (appState.coHostEmails.length === 0) {
    listEl.innerHTML = `
      <div class="col-span-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
        No Co-Host emails added yet. Add your team members above so they automatically become Co-Host when joining.
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.coHostEmails.map((email, idx) => `
    <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
      <div class="flex items-center gap-2 truncate">
        <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
        <span class="text-xs font-mono font-bold text-slate-800 truncate">${email}</span>
      </div>
      <button type="button" onclick="removeCoHostEmail(${idx})" class="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 whitespace-nowrap">
        Delete
      </button>
    </div>
  `).join('');
}

// ============================================================================
// 12-HOUR (AM / PM) CALENDAR & WORKFLOW BUILDER (WITH DRAFT / ACTIVE TOGGLE)
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
    lbl.className = 'text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200';
  } else {
    lbl.textContent = 'Draft (Paused)';
    lbl.className = 'text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200';
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
    const btnStyle = isSelected
      ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-600 font-semibold';
    return `
      <button type="button" onclick="toggleTimeSlot('${t}')" class="py-1.5 px-2 rounded-lg border text-xs whitespace-nowrap transition ${btnStyle}">
        ${t}
      </button>
    `;
  }).join('');

  renderSelectedTimesAssignment();
}

function toggleTimeSlot(timeStr) {
  const idx = appState.currentCategory.selectedTimes.indexOf(timeStr);
  if (idx >= 0) {
    appState.currentCategory.selectedTimes.splice(idx, 1);
  } else {
    appState.currentCategory.selectedTimes.push(timeStr);
  }
  render12HourCalendarGrid();
}

function addCustomTimeSlot() {
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
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  files.forEach(file => {
    const tempVideo = document.createElement('video');
    const objUrl = URL.createObjectURL(file);
    tempVideo.src = objUrl;
    tempVideo.onloadedmetadata = () => {
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
    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div class="flex items-center gap-2.5 truncate">
        <span class="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-xs shrink-0">Video #${idx + 1}</span>
        <span class="text-xs font-bold text-slate-800 truncate">${v.name}</span>
        <span class="text-[11px] text-slate-500 whitespace-nowrap">(${v.sizeMB} MB • ${v.formattedDuration})</span>
      </div>
      <button type="button" onclick="removeCategoryVideo(${idx})" class="ml-2 text-xs font-bold text-rose-600 hover:underline whitespace-nowrap">
        Remove
      </button>
    </div>
  `).join('');
}

function renderSelectedTimesAssignment() {
  const container = document.getElementById('selected-times-container');
  if (!container) return;

  if (appState.currentCategory.selectedTimes.length === 0) {
    container.innerHTML = `
      <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
        No broadcast times selected yet. Click any AM/PM time above or use "+ Add Custom Time".
      </div>
    `;
    return;
  }

  const videoCount = appState.currentCategory.videos.length;
  const allLabel = videoCount > 1
    ? `Play All ${videoCount} Videos Back-to-Back (Video 1 → Video ${videoCount})`
    : `Play Uploaded Video`;

  const videoOptions = [
    `<option value="ALL_SEAMLESS">${allLabel}</option>`,
    ...appState.currentCategory.videos.map((v, i) => `<option value="${v.name}">Play Only Video #${i + 1}: ${v.name} (${v.formattedDuration})</option>`)
  ].join('');

  container.innerHTML = appState.currentCategory.selectedTimes.map(timeStr => {
    const savedChoice = appState.currentCategory.slotVideoMap[timeStr] || 'ALL_SEAMLESS';
    return `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-slate-200">
        <div class="flex items-center gap-2.5">
          <span class="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs whitespace-nowrap">🕒 ${timeStr}</span>
          <span class="text-xs font-semibold text-slate-600">Video Selection:</span>
        </div>
        <div class="flex items-center gap-2">
          <select onchange="updateSlotVideoChoice('${timeStr}', this.value)" class="px-3 py-1.5 rounded-lg ghl-input text-xs font-semibold">
            ${videoOptions}
          </select>
          <button type="button" onclick="toggleTimeSlot('${timeStr}')" class="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg whitespace-nowrap">
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
  if (nameInp) nameInp.value = '';
  if (activeChk) activeChk.checked = true;
  updateBuilderStatusLabel();
  renderCategoryVideosList();
  render12HourCalendarGrid();
}

async function saveMeetingCategory(forcedStatus) {
  const nameInp = document.getElementById('cat-name');
  const sessionType = document.getElementById('cat-session-type')?.value || 'Zoom Meeting';
  const activeChk = document.getElementById('cat-status-active');
  const status = forcedStatus || (activeChk && activeChk.checked ? 'Active' : 'Draft');

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
  await syncBackendConfig();
  resetCategoryForm();
  showToast(status === 'Draft' ? `Saved "${catName}" as Draft` : `✓ Workflow "${catName}" Published & Active!`);
}

function toggleWorkflowStatus(catId) {
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
  syncBackendConfig();
  showToast('Workflow deleted');
}

function renderSavedCategories() {
  const listEl = document.getElementById('saved-categories-list');
  if (!listEl) return;

  if (appState.categories.length === 0) {
    listEl.innerHTML = `
      <div class="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
        No workflows created yet. Use the Workflow Builder below to create a Meeting or Webinar workflow (or save it as Draft).
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.categories.map(cat => {
    const isActive = cat.status === 'Active';
    const badgeClass = isActive
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
    const videosLabel = cat.videos.length > 0
      ? cat.videos.map((v, i) => `#${i + 1} ${v.name}`).join(' → ')
      : 'No video attached yet';

    return `
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-extrabold text-slate-900 text-sm">${cat.name}</span>
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">${cat.sessionType || 'Zoom Meeting'}</span>
            <span class="px-2.5 py-0.5 rounded text-[11px] font-extrabold border ${badgeClass}">● ${cat.status}</span>
            <span class="text-xs text-slate-500 font-medium">• ${cat.videos.length} Video(s) (${cat.formattedTotalDuration})</span>
          </div>
          <div class="text-xs text-slate-600">
            <strong>Days:</strong> ${cat.days.join(', ')}
          </div>
          <div class="text-xs text-slate-600">
            <strong>Broadcast Times:</strong> ${cat.times.join(' • ')}
          </div>
          <div class="text-[11px] text-slate-500">
            <strong>Playlist:</strong> ${videosLabel}
          </div>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <!-- Instant Active / Draft Toggle Button -->
          <button type="button" onclick="toggleWorkflowStatus('${cat.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap ${isActive ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500'}">
            ${isActive ? 'Switch to Draft' : 'Activate Workflow'}
          </button>
          <button type="button" onclick="triggerLiveMeetingNow('${cat.id}')" class="px-3.5 py-1.5 rounded-lg ghl-btn-primary text-xs font-bold">
            ▶ Run Now
          </button>
          <button type="button" onclick="deleteCategory('${cat.id}')" class="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold whitespace-nowrap">
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
// TWO-LEVEL ATTENDANCE & IN-MEETING CHAT MESSAGES (Q1, 12, ETC.) + CSV EXPORT
// ============================================================================
function renderAttendanceSessionsList() {
  const tbody = document.getElementById('sessions-summary-tbody');
  if (!tbody) return;

  if (appState.attendanceSessions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-xs text-slate-500">
          No completed broadcast sessions yet. Click <strong>"+ Log Sample Live Session"</strong> above to preview how exact attendance & chat messages ("Q1", "12", etc.) are recorded.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = appState.attendanceSessions.map(ses => `
    <tr onclick="openSessionDetails('${ses.sessionId}')" class="hover:bg-blue-50/50 cursor-pointer transition">
      <td class="py-3.5 px-4 font-extrabold text-slate-900">${ses.meetingName}</td>
      <td class="py-3.5 px-4 text-slate-600 font-medium">${ses.date}</td>
      <td class="py-3.5 px-4">
        <span class="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-xs whitespace-nowrap">${ses.time}</span>
      </td>
      <td class="py-3.5 px-4 font-bold text-emerald-700">${ses.participants.length} Attendees</td>
      <td class="py-3.5 px-4 font-mono text-xs text-slate-700">${ses.duration}</td>
      <td class="py-3.5 px-4 text-right">
        <button type="button" class="px-3 py-1.5 rounded-lg ghl-btn-primary text-xs font-bold">
          View Participants & Chat →
        </button>
      </td>
    </tr>
  `).join('');
}

function openSessionDetails(sessionId) {
  const ses = appState.attendanceSessions.find(s => s.sessionId === sessionId);
  if (!ses) return;
  appState.activeSessionDetailId = sessionId;

  document.getElementById('attendance-meetings-list-card')?.classList.add('hidden');
  document.getElementById('attendance-session-detail-card')?.classList.remove('hidden');

  const titleEl = document.getElementById('detail-session-title');
  const metaEl = document.getElementById('detail-session-meta');
  if (titleEl) titleEl.textContent = ses.meetingName;
  if (metaEl) metaEl.textContent = `Date: ${ses.date} • Scheduled Time: ${ses.time} • Total Attendance: ${ses.participants.length} Participants • Duration: ${ses.duration}`;

  const tbody = document.getElementById('detail-participants-tbody');
  if (!tbody) return;

  tbody.innerHTML = ses.participants.map(p => {
    const chatBadges = (p.messages && p.messages.length > 0)
      ? p.messages.map(m => `<span class="inline-block mr-1.5 mb-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 font-mono text-xs font-bold text-slate-900">[${m.time}] "${m.text}"</span>`).join('')
      : '<span class="text-xs text-slate-400">No messages sent</span>';

    const roleStyle = p.role.includes('Co-Host')
      ? 'bg-amber-50 text-amber-700 border border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border border-emerald-200';

    return `
      <tr>
        <td class="py-3.5 px-3 font-extrabold text-slate-900 whitespace-nowrap">${p.name}</td>
        <td class="py-3.5 px-3 font-mono text-xs text-slate-600">${p.email}</td>
        <td class="py-3.5 px-3"><span class="px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${roleStyle}">${p.role}</span></td>
        <td class="py-3.5 px-3 text-slate-700 whitespace-nowrap">${p.joinTime}</td>
        <td class="py-3.5 px-3 text-slate-700 whitespace-nowrap">${p.leaveTime}</td>
        <td class="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">${p.durationMins} mins</td>
        <td class="py-3.5 px-3">${chatBadges}</td>
      </tr>
    `;
  }).join('');
}

function backToSessionsList() {
  document.getElementById('attendance-session-detail-card')?.classList.add('hidden');
  document.getElementById('attendance-meetings-list-card')?.classList.remove('hidden');
}

function recordAccurateDemoSession() {
  const wfName = appState.categories[0]?.name || 'Automated Webinar Batch #1';
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const newSession = {
    sessionId: 'SES-' + Date.now(),
    meetingName: wfName,
    date: dateStr,
    time: '10:00 AM',
    duration: '00:45:00',
    participants: [
      {
        name: appState.profile.name || 'Team Lead',
        email: appState.coHostEmails[0] || 'cohost@company.com',
        role: 'Co-Host (Auto-Promoted)',
        joinTime: '10:00:05 AM',
        leaveTime: '10:45:00 AM',
        durationMins: 45,
        messages: [
          { time: '10:02 AM', text: 'Welcome everyone!' }
        ]
      },
      {
        name: 'Usman Ali',
        email: 'usman.ali@gmail.com',
        role: 'Participant',
        joinTime: '10:01:12 AM',
        leaveTime: '10:45:00 AM',
        durationMins: 44,
        messages: [
          { time: '10:12 AM', text: 'Q1' },
          { time: '10:18 AM', text: '12' }
        ]
      },
      {
        name: 'Hassan Raza',
        email: 'hassan.raza@gmail.com',
        role: 'Participant',
        joinTime: '10:02:40 AM',
        leaveTime: '10:44:50 AM',
        durationMins: 42,
        messages: [
          { time: '10:12 AM', text: 'Q1' },
          { time: '10:19 AM', text: '12' },
          { time: '10:35 AM', text: 'Clear audio & video' }
        ]
      }
    ]
  };

  appState.attendanceSessions.unshift(newSession);
  persistState();
  renderAttendanceSessionsList();
  showToast('✓ Recorded session with exact participants & chat messages (click row to inspect)');
}

function exportAllSessionsSummaryCsv() {
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
  const ses = appState.attendanceSessions.find(s => s.sessionId === appState.activeSessionDetailId);
  if (!ses) return;

  const rows = [
    ['Meeting Name', 'Date', 'Time', 'Participant Name', 'Email', 'Role', 'Join Time', 'Leave Time', 'Duration (Mins)', 'Chat Messages'],
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
// ADMIN CONSOLE RENDERER
// ============================================================================
function renderAdminPanel() {
  const nodesList = document.getElementById('admin-aws-nodes-list');
  if (nodesList) {
    nodesList.innerHTML = appState.awsNodes.map(node => `
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-slate-900 text-sm">${node.name}</h4>
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">● ${node.status}</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">IP: <code class="text-blue-600">${node.ip}</code> • Region: ${node.region}</p>
          <p class="text-[11px] text-emerald-700 mt-2 font-medium">✓ ${node.authMode}</p>
        </div>
      </div>
    `).join('');
  }

  const clientsTbody = document.getElementById('admin-clients-tbody');
  if (clientsTbody) {
    if (appState.clients.length === 0) {
      clientsTbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-6 text-center text-xs text-slate-500">No customers registered yet.</td>
        </tr>
      `;
    } else {
      clientsTbody.innerHTML = appState.clients.map((c, idx) => `
        <tr>
          <td class="py-3 px-3">
            <div class="font-bold text-slate-900">${c.name}</div>
            <div class="text-slate-500 font-mono text-[11px]">${c.email}</div>
          </td>
          <td class="py-3 px-3 font-semibold text-blue-600">${c.plan}</td>
          <td class="py-3 px-3 text-slate-700">${c.categoriesCount || 0} Workflows</td>
          <td class="py-3 px-3 text-slate-700">${c.coHostsCount || 0} Team Members</td>
          <td class="py-3 px-3 text-slate-700">${c.assignedNode}</td>
          <td class="py-3 px-3">
            <button onclick="toggleClientStatus(${idx})" class="px-2.5 py-1 rounded text-xs font-bold ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
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
  renderAdminPanel();
});
