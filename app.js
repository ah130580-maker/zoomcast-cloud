let appState = {
  currency: 'PKR',
  selectedPlan: null,
  detectedDurationSec: 2535,
  plans: [
    {
      id: "starter",
      name: "Starter",
      pricePkr: 4500,
      priceUsd: 19,
      dailyMeetings: 2,
      maxVideoMinutes: 60,
      coHostEmails: 1,
      features: [
        "2 Automated Zoom Broadcasts / Day",
        "Up to 60 Min HD Video Playback",
        "Automatic Participant Admission",
        "1 Auto Co-Host Email Assignment",
        "Participant Attendance Tracking"
      ]
    },
    {
      id: "pro",
      name: "Business Pro",
      popular: true,
      pricePkr: 8500,
      priceUsd: 35,
      dailyMeetings: 3,
      maxVideoMinutes: 180,
      coHostEmails: 2,
      features: [
        "3 Automated Zoom Broadcasts / Day",
        "Up to 3 Hours Full HD Video & Audio",
        "2 Auto Co-Host Email Assignments",
        "Attendance Analytics & CSV Export",
        "Dedicated Cloud Worker Priority",
        "Auto-End Meeting on Video Completion"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      pricePkr: 16500,
      priceUsd: 65,
      dailyMeetings: 6,
      maxVideoMinutes: 300,
      coHostEmails: 2,
      features: [
        "Up to 6 Automated Broadcasts / Day",
        "Dedicated Cloud Broadcast Instance",
        "2 Auto Co-Host Emails per Session",
        "Real-Time Attendance Reports",
        "24/7 Priority Account Support"
      ]
    }
  ],
  awsNodes: [
    {
      id: "aws-node-1",
      name: "AWS EC2 Node #1 (t3.large - 8GB RAM)",
      ip: "13.212.84.109",
      region: "ap-south-1",
      status: "Online",
      activeClient: "Ahmed Raza (Scheduled)",
      authMode: "Zoom OAuth ZAK Token"
    },
    {
      id: "aws-node-2",
      name: "AWS EC2 Node #2 (t3.large - 8GB RAM)",
      ip: "13.214.19.201",
      region: "ap-south-1",
      status: "Broadcasting",
      activeClient: "Usman Digital Academy (Slot 2)",
      authMode: "Zoom OAuth ZAK Token"
    }
  ],
  clients: [
    {
      id: "USR-101",
      name: "Ahmed Raza",
      email: "ahmed.raza@gmail.com",
      plan: "Business Pro",
      amountPaid: "Rs. 8,500",
      status: "Active",
      coHost1: "trainer.ali@gmail.com",
      coHost2: "support.team@gmail.com",
      schedules: ["10:00", "15:00", "20:00"],
      assignedNode: "AWS EC2 Node #1"
    },
    {
      id: "USR-102",
      name: "Usman Digital Academy",
      email: "usman.academy@gmail.com",
      plan: "Business Pro",
      amountPaid: "Rs. 8,500",
      status: "Active",
      coHost1: "cohost.usman@gmail.com",
      coHost2: "moderator.pk@gmail.com",
      schedules: ["11:00", "15:00", "21:00"],
      assignedNode: "AWS EC2 Node #2"
    },
    {
      id: "USR-103",
      name: "Zainab Coaching Hub",
      email: "zainab.coaching@gmail.com",
      plan: "Starter",
      amountPaid: "Rs. 4,500",
      status: "Active",
      coHost1: "assistant.zainab@gmail.com",
      coHost2: "—",
      schedules: ["14:00", "19:30"],
      assignedNode: "AWS EC2 Node #1"
    }
  ],
  participants: [
    {
      name: "Trainer Ali",
      email: "trainer.ali@gmail.com",
      role: "Co-Host (Auto-Promoted)",
      joinTime: "10:00:12 AM",
      leaveTime: "10:42:15 AM",
      durationMins: 42
    },
    {
      name: "Support Team",
      email: "support.team@gmail.com",
      role: "Co-Host (Auto-Promoted)",
      joinTime: "10:01:05 AM",
      leaveTime: "10:42:15 AM",
      durationMins: 41
    },
    {
      name: "Bilal Khan",
      email: "bilal.khan99@gmail.com",
      role: "Participant",
      joinTime: "10:00:45 AM",
      leaveTime: "10:42:15 AM",
      durationMins: 42
    },
    {
      name: "Hamza Tariq",
      email: "hamza.tariq.pk@gmail.com",
      role: "Participant",
      joinTime: "10:03:20 AM",
      leaveTime: "10:42:15 AM",
      durationMins: 39
    },
    {
      name: "Ayesha Siddiqui",
      email: "ayesha.sidd@gmail.com",
      role: "Participant",
      joinTime: "10:05:10 AM",
      leaveTime: "10:38:00 AM",
      durationMins: 33
    }
  ]
};

// Load saved clients from localStorage if available
try {
  const savedClients = localStorage.getItem('zoomcast_clients');
  if (savedClients) appState.clients = JSON.parse(savedClients);
} catch (e) {}

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

  const isDashboard = viewName === 'dashboard';
  const authActions = document.getElementById('nav-auth-actions');
  const loggedActions = document.getElementById('nav-logged-in-actions');
  const pubLinks = document.getElementById('public-nav-links');

  if (authActions && loggedActions) {
    authActions.classList.toggle('hidden', isDashboard);
    loggedActions.classList.toggle('hidden', !isDashboard);
    loggedActions.classList.toggle('flex', isDashboard);
  }
  if (pubLinks) {
    pubLinks.classList.toggle(' md:flex', !isDashboard);
    pubLinks.classList.toggle('hidden', isDashboard);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function logoutClient() {
  switchView('landing');
  showToast('Signed out successfully.');
}

function switchDashboardTab(tab) {
  const isSetup = tab === 'setup';
  document.getElementById('dash-content-setup').classList.toggle('hidden', !isSetup);
  document.getElementById('dash-content-attendance').classList.toggle('hidden', isSetup);
  document.getElementById('dtab-setup').className = isSetup
    ? 'px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white'
    : 'px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-slate-300 hover:text-white';
  document.getElementById('dtab-attendance').className = !isSetup
    ? 'px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white'
    : 'px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-slate-300 hover:text-white';
}

function setCurrency(cur) {
  appState.currency = cur;
  const pkrBtn = document.getElementById('cur-pkr');
  const usdBtn = document.getElementById('cur-usd');
  if (pkrBtn && usdBtn) {
    pkrBtn.className = cur === 'PKR'
      ? 'px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white'
      : 'px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400';
    usdBtn.className = cur === 'USD'
      ? 'px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white'
      : 'px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400';
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
      ? 'border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 relative'
      : 'border border-slate-800';
    const badge = plan.popular
      ? `<span class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-extrabold vip-gradient text-white">MOST POPULAR</span>`
      : '';
    const featuresHtml = plan.features.map(f => `
      <li class="flex items-start gap-2.5 text-sm text-slate-300">
        <span class="text-emerald-400 font-bold">✓</span>
        <span>${f}</span>
      </li>
    `).join('');

    return `
      <div class="glass-card p-8 rounded-3xl flex flex-col justify-between ${borderClass}">
        ${badge}
        <div>
          <h3 class="text-xl font-extrabold text-white">${plan.name}</h3>
          <div class="mt-4 flex items-baseline gap-1">
            <span class="text-4xl font-extrabold text-white">${priceStr}</span>
            <span class="text-xs text-slate-400">/ month</span>
          </div>
          <p class="text-xs text-indigo-300 mt-2 font-semibold">
            ${plan.dailyMeetings} Automated Broadcasts/Day • ${plan.coHostEmails} Co-Host Emails
          </p>
          <ul class="mt-6 space-y-3 border-t border-slate-800/80 pt-6">
            ${featuresHtml}
          </ul>
        </div>
        <button onclick="selectPlanForCheckout('${plan.id}')" class="mt-8 w-full py-3.5 rounded-xl font-bold text-sm text-white transition ${plan.popular ? 'vip-gradient shadow-lg shadow-indigo-500/30' : 'bg-slate-800 hover:bg-slate-700'}">
          Get Started →
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
  showToast('✓ Google Account Connected');
}

function completeSubscriptionAndLogin() {
  const name = document.getElementById('signup-name').value || 'Ahmed Raza';
  const email = document.getElementById('signup-email').value || 'ahmed.raza@gmail.com';
  const planName = document.getElementById('checkout-plan-name').textContent;
  const price = document.getElementById('checkout-plan-price').textContent;

  document.getElementById('dash-client-name').textContent = name;
  document.getElementById('connected-zoom-email').textContent = email;

  const existingIdx = appState.clients.findIndex(c => c.email === email);
  const newClient = {
    id: 'USR-' + Math.floor(100 + Math.random() * 900),
    name,
    email,
    plan: planName,
    amountPaid: price,
    status: 'Active',
    coHost1: document.getElementById('cfg-cohost-1').value || 'trainer.ali@gmail.com',
    coHost2: document.getElementById('cfg-cohost-2').value || 'support.team@gmail.com',
    schedules: ['10:00', '15:00', '20:00'],
    assignedNode: 'AWS EC2 Node #1'
  };
  if (existingIdx >= 0) {
    appState.clients[existingIdx] = newClient;
  } else {
    appState.clients.unshift(newClient);
  }
  try {
    localStorage.setItem('zoomcast_clients', JSON.stringify(appState.clients));
  } catch (e) {}

  switchView('dashboard');
  showToast('Subscription Activated! Welcome to your Dashboard.');
}

function reconnectZoomOAuth() {
  const email = document.getElementById('signup-email') ? document.getElementById('signup-email').value : 'ahmed.raza@gmail.com';
  document.getElementById('connected-zoom-email').textContent = email;
  showToast('✓ Zoom Account Connected via Google OAuth');
}

function formatDurationSeconds(sec) {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function handleVideoFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById('cfg-video-path').value = file.name;
  const videoProbe = document.getElementById('hidden-video-probe');
  const objectUrl = URL.createObjectURL(file);
  videoProbe.src = objectUrl;
  videoProbe.onloadedmetadata = () => {
    const durationSec = Math.ceil(videoProbe.duration);
    appState.detectedDurationSec = durationSec;
    document.getElementById('detected-duration-badge').textContent = formatDurationSeconds(durationSec);
    showToast(`Video loaded (${formatDurationSeconds(durationSec)})`);
    URL.revokeObjectURL(objectUrl);
  };
}

async function saveClientAutomationSettings() {
  const payload = {
    ZoomMeetingUrl: document.getElementById('cfg-zoom-url').value.trim(),
    VideoFilePath: document.getElementById('cfg-video-path').value.trim(),
    VideoDurationSeconds: appState.detectedDurationSec,
    AutoAdmitEnabled: document.getElementById('cfg-auto-admit').checked,
    ShareComputerSound: document.getElementById('cfg-share-sound').checked,
    MuteHostMic: document.getElementById('cfg-mute-entry').checked,
    OptimizeForVideo: true,
    CoHostEmail1: document.getElementById('cfg-cohost-1').value.trim(),
    CoHostEmail2: document.getElementById('cfg-cohost-2').value.trim(),
    Schedule1Enabled: document.getElementById('cfg-s1-enabled').checked,
    Schedule1Time: document.getElementById('cfg-s1-time').value,
    Schedule2Enabled: document.getElementById('cfg-s2-enabled').checked,
    Schedule2Time: document.getElementById('cfg-s2-time').value,
    Schedule3Enabled: document.getElementById('cfg-s3-enabled').checked,
    Schedule3Time: document.getElementById('cfg-s3-time').value
  };

  try {
    await fetch('/api/save-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {}

  const banner = document.getElementById('save-status-banner');
  if (banner) {
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 3500);
  }
  showToast('✓ Broadcast Schedule Saved & Activated');
}

async function triggerLiveMeetingNow() {
  await saveClientAutomationSettings();
  try {
    const res = await fetch('/api/run-now', { method: 'POST' });
    if (res.ok) {
      showToast('🚀 Starting Automated Zoom Broadcast...');
      return;
    }
  } catch (e) {}
  showToast('🚀 Broadcast Triggered on Cloud Node');
}

function renderAttendanceTable() {
  const tbody = document.getElementById('attendance-table-body');
  if (!tbody) return;
  tbody.innerHTML = appState.participants.map(p => {
    const isCoHost = p.role.includes('Co-Host');
    const roleBadge = isCoHost
      ? `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">${p.role}</span>`
      : `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300">${p.role}</span>`;

    return `
      <tr class="hover:bg-slate-900/60 transition">
        <td class="py-3.5 px-4 font-bold text-white">${p.name}</td>
        <td class="py-3.5 px-4 text-slate-300 font-mono text-xs">${p.email}</td>
        <td class="py-3.5 px-4">${roleBadge}</td>
        <td class="py-3.5 px-4 text-slate-300">${p.joinTime}</td>
        <td class="py-3.5 px-4 text-slate-300">${p.leaveTime}</td>
        <td class="py-3.5 px-4 font-bold text-indigo-400">${p.durationMins} mins</td>
      </tr>
    `;
  }).join('');
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
      <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-white text-sm">${node.name}</h4>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300">● ${node.status}</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">IP: <code class="text-indigo-300">${node.ip}</code> • Region: ${node.region}</p>
          <p class="text-xs text-slate-300 mt-2"><strong>Assignment:</strong> ${node.activeClient}</p>
          <p class="text-[11px] text-emerald-400 mt-1">✓ ${node.authMode}</p>
        </div>
      </div>
    `).join('');
  }

  const clientsTbody = document.getElementById('admin-clients-tbody');
  if (clientsTbody) {
    clientsTbody.innerHTML = appState.clients.map((c, idx) => `
      <tr class="hover:bg-slate-900/60 transition">
        <td class="py-3.5 px-3">
          <div class="font-bold text-white">${c.name}</div>
          <div class="text-slate-400 font-mono text-[11px]">${c.email}</div>
        </td>
        <td class="py-3.5 px-3">
          <div class="font-bold text-indigo-400">${c.plan}</div>
          <div class="text-emerald-400 font-bold">${c.amountPaid}</div>
        </td>
        <td class="py-3.5 px-3 font-mono text-white">${c.schedules.join(', ')}</td>
        <td class="py-3.5 px-3 text-amber-300 font-mono text-[11px]">
          <div>1: ${c.coHost1 || '—'}</div>
          <div>2: ${c.coHost2 || '—'}</div>
        </td>
        <td class="py-3.5 px-3 text-slate-300">${c.assignedNode}</td>
        <td class="py-3.5 px-3">
          <button onclick="toggleClientStatus(${idx})" class="px-3 py-1 rounded-lg text-xs font-bold ${c.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">
            ${c.status}
          </button>
        </td>
      </tr>
    `).join('');
  }

  const statClients = document.getElementById('admin-stat-clients');
  const statNodes = document.getElementById('admin-stat-nodes');
  if (statClients) statClients.textContent = `${appState.clients.length} Clients`;
  if (statNodes) statNodes.textContent = `${appState.awsNodes.length} Online`;
}

function toggleClientStatus(idx) {
  const c = appState.clients[idx];
  c.status = c.status === 'Active' ? 'Paused' : 'Active';
  try {
    localStorage.setItem('zoomcast_clients', JSON.stringify(appState.clients));
  } catch (e) {}
  renderAdminPanel();
  showToast(`${c.name} status updated to ${c.status}`);
}

function addNewAwsNode() {
  const nextNum = appState.awsNodes.length + 1;
  const ip = prompt('Enter new AWS 8GB Instance IP Address:', `13.215.90.${100 + nextNum}`);
  if (!ip) return;
  appState.awsNodes.push({
    id: `aws-node-${nextNum}`,
    name: `AWS EC2 Node #${nextNum} (t3.large - 8GB RAM)`,
    ip,
    region: 'ap-south-1',
    status: 'Online',
    activeClient: 'Available',
    authMode: 'Zoom OAuth ZAK Token'
  });
  renderAdminPanel();
  showToast(`✓ Added AWS EC2 Node #${nextNum}`);
}

window.addEventListener('DOMContentLoaded', () => {
  renderPricingCards();
  renderAttendanceTable();
  renderAdminPanel();
});
