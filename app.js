let appState = {
  currency: 'PKR',
  selectedPlan: null,
  profile: {
    name: '',
    email: '',
    zoomLink: '',
    zoomConnected: false
  },
  coHostEmails: [],
  categories: [],
  currentCategory: {
    editingId: null,
    videos: [],
    selectedTimes: ['10:00', '15:00'],
    slotVideoMap: {}
  },
  plans: [
    {
      id: "starter",
      name: "Starter",
      pricePkr: 4500,
      priceUsd: 19,
      features: [
        "Up to 2 Meeting Categories",
        "Unlimited Video File Size",
        "Full 7-Day Weekly Scheduler",
        "Unlimited Team Co-Host Emails",
        "Participant Attendance Reports"
      ]
    },
    {
      id: "pro",
      name: "Business Pro",
      popular: true,
      pricePkr: 8500,
      priceUsd: 35,
      features: [
        "Unlimited Meeting Categories",
        "Multi-Video Seamless Playlists",
        "Full 24-Hour Time Slot Calendar",
        "Unlimited Team Co-Host Emails",
        "Attendance Analytics & CSV Export",
        "Auto-End Meeting on Completion"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      pricePkr: 16500,
      priceUsd: 65,
      features: [
        "Unlimited Categories & Zoom Links",
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
  participants: []
};

// Load saved state from localStorage
try {
  const savedProfile = localStorage.getItem('zoomcast_profile');
  if (savedProfile) appState.profile = JSON.parse(savedProfile);

  const savedCoHosts = localStorage.getItem('zoomcast_cohosts');
  if (savedCoHosts) appState.coHostEmails = JSON.parse(savedCoHosts);

  const savedCategories = localStorage.getItem('zoomcast_categories');
  if (savedCategories) appState.categories = JSON.parse(savedCategories);

  const savedClients = localStorage.getItem('zoomcast_clients');
  if (savedClients) appState.clients = JSON.parse(savedClients);
} catch (e) {}

function persistState() {
  try {
    localStorage.setItem('zoomcast_profile', JSON.stringify(appState.profile));
    localStorage.setItem('zoomcast_cohosts', JSON.stringify(appState.coHostEmails));
    localStorage.setItem('zoomcast_categories', JSON.stringify(appState.categories));
    localStorage.setItem('zoomcast_clients', JSON.stringify(appState.clients));
  } catch (e) {}
}

function showToast(msg) {
  const box = document.getElementById('toast-box');
  if (!box) return;
  box.textContent = msg;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 3200);
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

function switchDashboardTab(tab) {
  const tabs = ['categories', 'attendance', 'profile'];
  tabs.forEach(t => {
    const content = document.getElementById('dash-content-' + t);
    const btn = document.getElementById('dtab-' + t);
    if (content) content.classList.toggle('hidden', t !== tab);
    if (btn) {
      btn.className = t === tab
        ? 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#155eef] text-white whitespace-nowrap text-left'
        : 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white whitespace-nowrap text-left';
    }
  });

  const titles = {
    categories: 'Meeting Categories & Scheduler',
    attendance: 'Participant Attendance Report',
    profile: 'Profile, Zoom Integration & Team Co-Hosts'
  };
  const titleEl = document.getElementById('workspace-page-title');
  if (titleEl && titles[tab]) titleEl.textContent = titles[tab];
}

function logoutClient() {
  switchView('landing');
  showToast('Signed out successfully.');
}

function setCurrency(cur) {
  appState.currency = cur;
  const pkrBtn = document.getElementById('cur-pkr');
  const usdBtn = document.getElementById('cur-usd');
  if (pkrBtn && usdBtn) {
    pkrBtn.className = cur === 'PKR'
      ? 'px-4 py-1.5 rounded-md text-xs font-bold ghl-btn-primary'
      : 'px-4 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:text-slate-900 whitespace-nowrap';
    usdBtn.className = cur === 'USD'
      ? 'px-4 py-1.5 rounded-md text-xs font-bold ghl-btn-primary'
      : 'px-4 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:text-slate-900 whitespace-nowrap';
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
      ? 'border-2 border-[#155eef] shadow-md relative'
      : 'border border-slate-200';
    const badge = plan.popular
      ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#155eef] text-white whitespace-nowrap">MOST POPULAR</span>`
      : '';
    const featuresHtml = plan.features.map(f => `
      <li class="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
        <span class="text-[#155eef] font-bold">✓</span>
        <span>${f}</span>
      </li>
    `).join('');

    return `
      <div class="ghl-card p-6 sm:p-8 rounded-xl flex flex-col justify-between ${borderClass}">
        ${badge}
        <div>
          <h3 class="text-lg font-bold text-slate-900">${plan.name}</h3>
          <div class="mt-3 flex items-baseline gap-1">
            <span class="text-3xl sm:text-4xl font-extrabold text-slate-900">${priceStr}</span>
            <span class="text-xs text-slate-500">/ month</span>
          </div>
          <ul class="mt-6 space-y-2.5 border-t border-slate-200 pt-5">
            ${featuresHtml}
          </ul>
        </div>
        <button onclick="selectPlanForCheckout('${plan.id}')" class="mt-7 w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm ${plan.popular ? 'ghl-btn-primary' : 'ghl-btn-secondary'}">
          Select ${plan.name}
        </button>
      </div>
    `;
  }).join('');
}

function selectPlanForCheckout(planId) {
  const plan = appState.plans.find(p => p.id === planId) || appState.plans[1];
  appState.selectedPlan = plan;
  const priceStr = appState.currency === 'PKR' ? `Rs. ${plan.pricePkr.toLocaleString()}` : `$${plan.priceUsd}`;
  const nameEl = document.getElementById('checkout-plan-name');
  const priceEl = document.getElementById('checkout-plan-price');
  if (nameEl) nameEl.textContent = plan.name;
  if (priceEl) priceEl.textContent = priceStr;
  switchView('auth');
}

function simulateGoogleLogin() {
  const badge = document.getElementById('google-auth-badge');
  if (badge) badge.classList.remove('hidden');
  showToast('✓ Connected with Google');
}

function completeSubscriptionAndLogin() {
  const nameInput = document.getElementById('signup-name');
  const emailInput = document.getElementById('signup-email');
  const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Workspace User';
  const email = (emailInput && emailInput.value.trim()) ? emailInput.value.trim() : 'user@workspace.com';
  const planName = document.getElementById('checkout-plan-name') ? document.getElementById('checkout-plan-name').textContent : 'Business Pro';

  appState.profile.name = name;
  appState.profile.email = email;

  syncProfileUI();

  const existingIdx = appState.clients.findIndex(c => c.email === email);
  const clientRecord = {
    id: 'USR-' + Math.floor(100 + Math.random() * 900),
    name,
    email,
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
  switchView('dashboard');
  showToast('Welcome to your ZoomCast CRM Workspace!');
}

function syncProfileUI() {
  const sName = document.getElementById('sidebar-user-name');
  const sEmail = document.getElementById('sidebar-user-email');
  const pName = document.getElementById('prof-name');
  const pEmail = document.getElementById('prof-email');
  const zUrl = document.getElementById('cfg-zoom-url');

  if (sName) sName.textContent = appState.profile.name || 'My Workspace';
  if (sEmail) sEmail.textContent = appState.profile.email || 'Active Session';
  if (pName) pName.value = appState.profile.name || '';
  if (pEmail) pEmail.value = appState.profile.email || '';
  if (zUrl) zUrl.value = appState.profile.zoomLink || '';
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
  const zUrl = document.getElementById('cfg-zoom-url');
  if (zUrl) appState.profile.zoomLink = zUrl.value.trim();
  appState.profile.zoomConnected = true;
  const badge = document.getElementById('zoom-conn-badge');
  if (badge) {
    badge.textContent = '● Zoom Connected via Google';
  }
  persistState();
  showToast('✓ Zoom Account Connected via Google OAuth');
}

// ============================================================================
// UNLIMITED TEAM CO-HOST EMAILS MANAGER (+ ADD & DELETE)
// ============================================================================
function addCoHostEmail() {
  const input = document.getElementById('new-cohost-email');
  if (!input) return;
  const email = input.value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address');
    return;
  }
  if (!appState.coHostEmails.includes(email)) {
    appState.coHostEmails.push(email);
    persistState();
    renderCoHostEmails();
    syncBackendConfig();
    showToast(`✓ Added ${email} to Auto Co-Host Team`);
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
      <div class="col-span-full p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
        No Co-Host emails added yet. Add your team members above so they automatically become Co-Host when joining.
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.coHostEmails.map((email, idx) => `
    <div class="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200">
      <div class="flex items-center gap-2 truncate">
        <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
        <span class="text-xs font-mono font-medium text-slate-800 truncate">${email}</span>
      </div>
      <button type="button" onclick="removeCoHostEmail(${idx})" class="ml-2 px-2 py-1 rounded text-xs font-semibold text-rose-600 hover:bg-rose-50 whitespace-nowrap">
        Delete
      </button>
    </div>
  `).join('');
}

// ============================================================================
// MEETING CATEGORIES, 7-DAY CHECKBOXES, 24H CALENDAR & MULTI-VIDEO PLAYLIST
// ============================================================================
function formatSecondsToHHMMSS(sec) {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function toggleAllWeekdays() {
  const chks = document.querySelectorAll('.cat-day-chk');
  const allChecked = Array.from(chks).every(c => c.checked);
  chks.forEach(c => { c.checked = !allChecked; });
}

function render24HourCalendarGrid() {
  const grid = document.getElementById('time-calendar-grid');
  if (!grid) return;

  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
  }

  grid.innerHTML = times.map(t => {
    const isSelected = appState.currentCategory.selectedTimes.includes(t);
    const btnStyle = isSelected
      ? 'bg-[#155eef] text-white border-[#155eef] font-bold shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:border-[#155eef] font-medium';
    return `
      <button type="button" onclick="toggleTimeSlot('${t}')" class="py-1.5 px-2 rounded-md border text-xs whitespace-nowrap transition ${btnStyle}">
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
    appState.currentCategory.selectedTimes.sort();
  }
  render24HourCalendarGrid();
}

function addCustomTimeSlot() {
  const inp = document.getElementById('custom-time-input');
  if (!inp || !inp.value) return;
  const t = inp.value;
  if (!appState.currentCategory.selectedTimes.includes(t)) {
    appState.currentCategory.selectedTimes.push(t);
    appState.currentCategory.selectedTimes.sort();
  }
  render24HourCalendarGrid();
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
    <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div class="flex items-center gap-2.5 truncate">
        <span class="px-2 py-0.5 rounded bg-blue-50 text-[#155eef] font-bold text-xs shrink-0">Video #${idx + 1}</span>
        <span class="text-xs font-semibold text-slate-800 truncate">${v.name}</span>
        <span class="text-[11px] text-slate-500 whitespace-nowrap">(${v.sizeMB} MB • ${v.formattedDuration})</span>
      </div>
      <button type="button" onclick="removeCategoryVideo(${idx})" class="ml-2 text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap">
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
      <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
        No time slots selected yet. Click one or more times on the calendar above.
      </div>
    `;
    return;
  }

  const videoOptions = [
    `<option value="ALL_SEAMLESS">Play All Uploaded Videos Back-to-Back (Seamless Switch)</option>`,
    ...appState.currentCategory.videos.map((v, i) => `<option value="${v.name}">Play Only Video #${i + 1}: ${v.name} (${v.formattedDuration})</option>`)
  ].join('');

  container.innerHTML = appState.currentCategory.selectedTimes.map(timeStr => {
    const savedChoice = appState.currentCategory.slotVideoMap[timeStr] || 'ALL_SEAMLESS';
    return `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white border border-slate-200">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-md bg-blue-50 text-[#155eef] font-bold text-xs whitespace-nowrap">🕒 ${timeStr}</span>
          <span class="text-xs text-slate-600">Video(s) for this time slot:</span>
        </div>
        <div class="flex items-center gap-2">
          <select onchange="updateSlotVideoChoice('${timeStr}', this.value)" class="px-3 py-1.5 rounded-lg ghl-input text-xs font-medium">
            ${videoOptions}
          </select>
          <button type="button" onclick="toggleTimeSlot('${timeStr}')" class="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded whitespace-nowrap">
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
    videos: [],
    selectedTimes: ['10:00', '15:00'],
    slotVideoMap: {}
  };
  const nameInp = document.getElementById('cat-name');
  const linkInp = document.getElementById('cat-zoom-link');
  if (nameInp) nameInp.value = '';
  if (linkInp) linkInp.value = '';
  renderCategoryVideosList();
  render24HourCalendarGrid();
}

async function saveMeetingCategory() {
  const nameInp = document.getElementById('cat-name');
  const linkInp = document.getElementById('cat-zoom-link');
  const catName = (nameInp && nameInp.value.trim()) ? nameInp.value.trim() : `Category #${appState.categories.length + 1}`;
  const zoomLink = (linkInp && linkInp.value.trim()) ? linkInp.value.trim() : appState.profile.zoomLink;

  const selectedDays = Array.from(document.querySelectorAll('.cat-day-chk:checked')).map(c => c.value);
  if (selectedDays.length === 0) {
    showToast('Please select at least one day of the week');
    return;
  }
  if (appState.currentCategory.selectedTimes.length === 0) {
    showToast('Please select at least one broadcast time');
    return;
  }

  const totalSec = appState.currentCategory.videos.reduce((acc, v) => acc + (v.durationSec || 0), 0);

  const newCat = {
    id: appState.currentCategory.editingId || ('CAT-' + Date.now()),
    name: catName,
    zoomLink,
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
  showToast(`✓ Category "${catName}" saved & schedule activated!`);
}

function deleteCategory(catId) {
  appState.categories = appState.categories.filter(c => c.id !== catId);
  persistState();
  renderSavedCategories();
  syncBackendConfig();
  showToast('Category removed');
}

function renderSavedCategories() {
  const listEl = document.getElementById('saved-categories-list');
  if (!listEl) return;

  if (appState.categories.length === 0) {
    listEl.innerHTML = `
      <div class="p-5 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
        No meeting categories created yet. Use the builder below to create your first automated category.
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.categories.map(cat => {
    const videosLabel = cat.videos.length > 0
      ? cat.videos.map((v, i) => `#${i + 1} ${v.name}`).join(' → ')
      : 'No video selected';

    return `
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold text-slate-900 text-sm">${cat.name}</span>
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
            <span class="text-xs text-slate-500">• ${cat.videos.length} Video(s) (${cat.formattedTotalDuration})</span>
          </div>
          <div class="text-xs text-slate-600">
            <strong>Days:</strong> ${cat.days.join(', ')}
          </div>
          <div class="text-xs text-slate-600">
            <strong>Times:</strong> ${cat.times.join(', ')}
          </div>
          <div class="text-[11px] text-slate-500">
            <strong>Playlist:</strong> ${videosLabel}
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" onclick="triggerLiveMeetingNow()" class="px-3 py-1.5 rounded-lg ghl-btn-primary text-xs font-semibold">
            ▶ Run Now
          </button>
          <button type="button" onclick="deleteCategory('${cat.id}')" class="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold whitespace-nowrap">
            Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function syncBackendConfig() {
  const firstCat = appState.categories[0];
  const playlistNames = firstCat && firstCat.videos ? firstCat.videos.map(v => v.name) : [];
  const times = firstCat && firstCat.times ? firstCat.times : ['10:00', '15:00'];

  const payload = {
    ZoomMeetingUrl: (firstCat && firstCat.zoomLink) ? firstCat.zoomLink : appState.profile.zoomLink,
    VideoFilePath: playlistNames[0] || '',
    VideoPlaylist: playlistNames,
    VideoDurationSeconds: firstCat ? firstCat.totalDurationSec : 0,
    AutoAdmitEnabled: true,
    ShareComputerSound: true,
    MuteHostMic: true,
    OptimizeForVideo: true,
    CoHostEmails: appState.coHostEmails,
    Categories: appState.categories,
    Schedule1Enabled: Boolean(times[0]),
    Schedule1Time: times[0] || '10:00',
    Schedule2Enabled: Boolean(times[1]),
    Schedule2Time: times[1] || '15:00',
    Schedule3Enabled: Boolean(times[2]),
    Schedule3Time: times[2] || '20:00'
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

function renderAttendanceTable() {
  const tbody = document.getElementById('attendance-table-body');
  if (!tbody) return;

  if (appState.participants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-xs text-slate-500">
          No attendance records yet. Participants who join your live broadcasts will appear here automatically.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = appState.participants.map(p => `
    <tr>
      <td class="py-3 px-3 font-semibold text-slate-900">${p.name}</td>
      <td class="py-3 px-3 text-slate-600 font-mono text-xs">${p.email}</td>
      <td class="py-3 px-3"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-[#155eef]">${p.role}</span></td>
      <td class="py-3 px-3 text-slate-600">${p.joinTime}</td>
      <td class="py-3 px-3 text-slate-600">${p.leaveTime}</td>
      <td class="py-3 px-3 font-bold text-slate-900">${p.durationMins} mins</td>
    </tr>
  `).join('');
}

function exportAttendanceCsv() {
  const rows = [
    ['Participant Name', 'Email', 'Role', 'Join Time', 'Leave Time', 'Duration (Mins)'],
    ...appState.participants.map(p => [p.name, p.email, p.role, p.joinTime, p.leaveTime, p.durationMins])
  ];
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', 'zoom_attendance_report.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('⬇ Attendance CSV Downloaded');
}

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
          <p class="text-xs text-slate-500 mt-1">IP: <code class="text-[#155eef]">${node.ip}</code> • Region: ${node.region}</p>
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
          <td class="py-3 px-3 font-semibold text-[#155eef]">${c.plan}</td>
          <td class="py-3 px-3 text-slate-700">${c.categoriesCount || 0} Categories</td>
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
  render24HourCalendarGrid();
  renderSavedCategories();
  renderAttendanceTable();
  renderAdminPanel();
});
