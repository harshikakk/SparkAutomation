// ============================================================================
// SPARK DRIVES & AUTOMATION - INDUSTRIAL IoT CONTROL & MONITORING PLATFORM
// Complete Production Application Logic
// ============================================================================

(function () {
  'use strict';

  // State Management
  const AppState = {
    user: null,
    firebaseConnected: false,
    esp32Online: false,
    esp32LastSeen: null,
    currentLedState: 'OFF',
    currentSource: 'Website',
    lastChangedTime: null,
    isInitialized: false,
    isWebAction: false,
    historyEvents: [],
    filteredEvents: [],
    notifications: [],
    activeRoute: 'dashboard',
    isSidebarCollapsed: false,
    pagination: {
      currentPage: 1,
      pageSize: 10
    },
    charts: {
      activityChart: null,
      analyticsActivityChart: null,
      analyticsRatioChart: null,
      analyticsSourceChart: null
    }
  };

  // Cached DOM Elements
  const DOM = {
    authView: document.getElementById('auth-view'),
    appView: document.getElementById('app-view'),
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginSubmitBtn: document.getElementById('login-submit-btn'),
    loginAlert: document.getElementById('login-alert'),
    togglePasswordBtn: document.getElementById('toggle-password-btn'),
    forgotPasswordBtn: document.getElementById('forgot-password-btn'),

    // Shell Header
    appHeader: document.querySelector('.app-header'),
    headerPageTitle: document.getElementById('header-page-title'),
    breadcrumbCurrent: document.getElementById('breadcrumb-current'),
    liveClock: document.getElementById('live-clock'),
    firebaseConnBadge: document.getElementById('firebase-conn-badge'),
    esp32ConnBadge: document.getElementById('esp32-conn-badge'),
    notifBtn: document.getElementById('notif-btn'),
    notifBadge: document.getElementById('notif-badge'),
    notifDropdown: document.getElementById('notif-dropdown'),
    notifList: document.getElementById('notif-list'),
    markNotifsReadBtn: document.getElementById('mark-notifs-read-btn'),
    userDropdownBtn: document.getElementById('user-dropdown-btn'),
    userDropdown: document.getElementById('user-dropdown'),
    userNameDisplay: document.getElementById('user-name-display'),
    userRoleDisplay: document.getElementById('user-role-display'),
    userAvatarInitial: document.getElementById('user-avatar-initial'),
    logoutBtn: document.getElementById('logout-btn'),

    // Sidebar
    appSidebar: document.getElementById('app-sidebar'),
    sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    sidebarNavLinks: document.querySelectorAll('.nav-item[data-route]'),
    sidebarStatusText: document.getElementById('sidebar-status-text'),
    sidebarStatusDot: document.getElementById('sidebar-status-dot'),

    // Dashboard Elements
    dashLedVal: document.getElementById('dash-led-val'),
    dashLedDev: document.getElementById('dash-led-dev'),
    dashLedTime: document.getElementById('dash-led-time'),
    dashLedSource: document.getElementById('dash-led-source'),
    dashEspVal: document.getElementById('dash-esp-val'),
    dashEspDev: document.getElementById('dash-esp-dev'),
    dashEspWifi: document.getElementById('dash-esp-wifi'),
    dashEspLastSeen: document.getElementById('dash-esp-lastseen'),
    dashFbVal: document.getElementById('dash-fb-val'),
    dashFbSync: document.getElementById('dash-fb-sync'),
    dashTodayEvents: document.getElementById('dash-today-events'),
    dashLedToggle: document.getElementById('dash-led-toggle'),
    dashLedQuickStatus: document.getElementById('dash-led-quick-status'),
    dashRecentTimeline: document.getElementById('dash-recent-timeline'),

    // LED Control Page
    ctrlLedLamp: document.getElementById('ctrl-led-lamp'),
    ctrlLedStatusText: document.getElementById('ctrl-led-status-text'),
    ctrlLedToggle: document.getElementById('ctrl-led-toggle'),
    ctrlLastChanged: document.getElementById('ctrl-last-changed'),
    ctrlSource: document.getElementById('ctrl-source'),
    pipeReqState: document.getElementById('pipe-req-state'),
    pipeSentTime: document.getElementById('pipe-sent-time'),
    pipeFbBadge: document.getElementById('pipe-fb-badge'),
    pipeEspBadge: document.getElementById('pipe-esp-badge'),
    pipePhysState: document.getElementById('pipe-phys-state'),

    // History Page
    histFromDate: document.getElementById('hist-from-date'),
    histFromTime: document.getElementById('hist-from-time'),
    histToDate: document.getElementById('hist-to-date'),
    histToTime: document.getElementById('hist-to-time'),
    histStateFilter: document.getElementById('hist-state-filter'),
    histSourceFilter: document.getElementById('hist-source-filter'),
    btnSearchHistory: document.getElementById('btn-search-history'),
    btnClearFilters: document.getElementById('btn-clear-filters'),
    btnDownloadExcel: document.getElementById('btn-download-excel'),
    histStatTotal: document.getElementById('hist-stat-total'),
    histStatOn: document.getElementById('hist-stat-on'),
    histStatOff: document.getElementById('hist-stat-off'),
    histStatLast: document.getElementById('hist-stat-last'),
    historyTableBody: document.getElementById('history-table-body'),
    historyPaginationInfo: document.getElementById('history-pagination-info'),
    btnPrevPage: document.getElementById('btn-prev-page'),
    btnNextPage: document.getElementById('btn-next-page'),

    // Toast Container & Modals
    toastContainer: document.getElementById('toast-container'),
    forgotPasswordModal: document.getElementById('forgot-password-modal'),
    forgotModalEmail: document.getElementById('forgot-modal-email'),
    forgotModalSubmitBtn: document.getElementById('forgot-modal-submit-btn'),
    deviceModal: document.getElementById('device-modal')
  };

  // ==========================================================================
  // INITIALIZATION & AUTHENTICATION OBSERVER
  // ==========================================================================
  function init() {
    setupEventListeners();
    setupClock();
    handleRouteFromHash();
    
    // Listen for Firebase Auth State Changes
    window.SparkFirebase.auth.onAuthStateChanged(handleAuthStateChange);
  }

  function handleAuthStateChange(user) {
    if (user) {
      AppState.user = user;
      updateUserProfileUI(user);
      DOM.authView.style.display = 'none';
      DOM.appView.style.display = 'flex';
      
      // Initialize Realtime Listeners
      initFirebaseListeners();

      // Navigate to current hash or dashboard
      if (window.location.hash && window.location.hash !== '#login') {
        navigateTo(window.location.hash.replace('#', ''));
      } else {
        navigateTo('dashboard');
      }
    } else {
      AppState.user = null;
      DOM.authView.style.display = 'flex';
      DOM.appView.style.display = 'none';
      window.location.hash = '#login';
    }
  }

  function updateUserProfileUI(user) {
    const email = user.email || 'operator@sparkdna.co.in';
    const displayName = user.displayName || email.split('@')[0];
    const initial = displayName.charAt(0).toUpperCase();

    if (DOM.userNameDisplay) DOM.userNameDisplay.textContent = displayName;
    if (DOM.userRoleDisplay) DOM.userRoleDisplay.textContent = 'Authorized Operator';
    if (DOM.userAvatarInitial) DOM.userAvatarInitial.textContent = initial;

    // Update Profile page if loaded
    const profEmail = document.getElementById('prof-email');
    const profName = document.getElementById('prof-name');
    const profLastLogin = document.getElementById('prof-last-login');
    if (profEmail) profEmail.textContent = email;
    if (profName) profName.textContent = displayName;
    if (profLastLogin && user.metadata && user.metadata.lastSignInTime) {
      profLastLogin.textContent = new Date(user.metadata.lastSignInTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }
  }

  // ==========================================================================
  // FIREBASE REALTIME LISTENERS (RTDB)
  // ==========================================================================
  function initFirebaseListeners() {
    const rtdb = window.SparkFirebase.rtdb;

    // 1. Firebase Cloud Connection Listener (.info/connected)
    rtdb.ref('.info/connected').on('value', (snap) => {
      const isConnected = snap.val() === true;
      AppState.firebaseConnected = isConnected;
      updateFirebaseStatusUI(isConnected);
    });

    // 2. Listen to Hardware Device State: /devices/ESP32-LED-001
    rtdb.ref('devices/ESP32-LED-001').on('value', (snap) => {
      const data = snap.val();
      if (data) {
        handleDeviceStateUpdate(data);
      }
    });

    // 3. Listen to /CONTROL (Compatible with the ESP32 Arduino sketch)
    rtdb.ref('CONTROL').on('value', (snap) => {
      const ctrl = snap.val();
      if (ctrl) {
        const statusBool = (ctrl.led_status === 1 || ctrl.led_status === '1' || ctrl.led_status === 'ON');
        const stateStr = statusBool ? 'ON' : 'OFF';
        const sourceStr = ctrl.source || 'HMI';
        const timestamp = ctrl.last_changed || Date.now();

        // Initial sync on page open (do not log historical initial state as a new event)
        if (!AppState.isInitialized) {
          AppState.isInitialized = true;
          AppState.currentLedState = stateStr;
          AppState.currentSource = sourceStr;
          AppState.lastChangedTime = timestamp;
          updateLedUI(stateStr, sourceStr, timestamp);
          return;
        }

        // If state changed from what we have currently
        if (stateStr !== AppState.currentLedState) {
          const previousState = AppState.currentLedState;
          AppState.currentLedState = stateStr;
          AppState.currentSource = sourceStr;
          AppState.lastChangedTime = timestamp;
          updateLedUI(stateStr, sourceStr, timestamp);

          // Check if action was initiated from the Web UI toggle
          if (AppState.isWebAction) {
            AppState.isWebAction = false;
          } else {
            // ACTION WAS TRIGGERED FROM HMI / HARDWARE!
            // Automatically log the details into Firebase History!
            const detectedSource = (ctrl.source && ctrl.source.toLowerCase() !== 'website') ? ctrl.source : 'HMI';
            recordExternalHistoryEvent(stateStr, previousState, detectedSource);
            addNotification(`LED turned ${stateStr} via ${detectedSource}`, `Changed on HMI Screen`);
          }
        }
      }
    });

    // 4. Listen to Event History: Merging both /history and /HISTORY
    const mergedHistory = {};
    const syncMergedHistory = () => {
      handleHistoryData(mergedHistory);
    };

    rtdb.ref('history').limitToLast(200).on('value', (snap) => {
      const val = snap.val() || {};
      Object.assign(mergedHistory, val);
      syncMergedHistory();
    });

    rtdb.ref('HISTORY').limitToLast(200).on('value', (snap) => {
      const val = snap.val() || {};
      Object.keys(val).forEach((k) => {
        if (!mergedHistory[k]) {
          mergedHistory[k] = val[k];
        }
      });
      syncMergedHistory();
    });
  }

  function updateFirebaseStatusUI(connected) {
    if (DOM.firebaseConnBadge) {
      if (connected) {
        DOM.firebaseConnBadge.className = 'conn-badge connected';
        DOM.firebaseConnBadge.innerHTML = '<span class="pulse-dot online"></span> Firebase Connected';
        if (DOM.dashFbVal) DOM.dashFbVal.textContent = 'CONNECTED';
        if (DOM.dashFbSync) DOM.dashFbSync.textContent = 'Sync: Realtime Active';
      } else {
        DOM.firebaseConnBadge.className = 'conn-badge disconnected';
        DOM.firebaseConnBadge.innerHTML = '<span class="pulse-dot offline"></span> Firebase Disconnected';
        if (DOM.dashFbVal) DOM.dashFbVal.textContent = 'DISCONNECTED';
        if (DOM.dashFbSync) DOM.dashFbSync.textContent = 'Sync: Reconnecting...';
        showToast('Firebase connection lost. Realtime sync suspended.', 'warning');
      }
    }
  }

  function handleDeviceStateUpdate(data) {
    // Check heartbeat/online state
    const isOnline = data.status === 'online' || (data.lastSeen && (Date.now() - data.lastSeen < 60000));
    AppState.esp32Online = isOnline;
    AppState.esp32LastSeen = data.lastSeen || Date.now();

    if (DOM.esp32ConnBadge) {
      if (isOnline) {
        DOM.esp32ConnBadge.className = 'conn-badge connected';
        DOM.esp32ConnBadge.innerHTML = '<span class="pulse-dot online"></span> ESP32 Online';
        if (DOM.dashEspVal) DOM.dashEspVal.textContent = 'ONLINE';
        if (DOM.sidebarStatusDot) DOM.sidebarStatusDot.className = 'pulse-dot online';
        if (DOM.sidebarStatusText) DOM.sidebarStatusText.textContent = 'ESP32 Online';
      } else {
        DOM.esp32ConnBadge.className = 'conn-badge disconnected';
        DOM.esp32ConnBadge.innerHTML = '<span class="pulse-dot offline"></span> ESP32 Offline';
        if (DOM.dashEspVal) DOM.dashEspVal.textContent = 'OFFLINE';
        if (DOM.sidebarStatusDot) DOM.sidebarStatusDot.className = 'pulse-dot offline';
        if (DOM.sidebarStatusText) DOM.sidebarStatusText.textContent = 'ESP32 Offline';
      }
    }

    if (DOM.dashEspWifi) DOM.dashEspWifi.textContent = data.wifiStatus || 'Connected (Wi-Fi)';
    if (DOM.dashEspLastSeen && data.lastSeen) {
      DOM.dashEspLastSeen.textContent = formatTimeOnly(data.lastSeen);
    }

    // Check device led child if present
    if (data.led) {
      const ledState = data.led.state || (data.led.command === 'ON' ? 'ON' : 'OFF');
      if (ledState !== AppState.currentLedState) {
        AppState.currentLedState = ledState;
        AppState.currentSource = data.led.source || 'ESP32';
        AppState.lastChangedTime = data.led.lastChanged || Date.now();
        updateLedUI(ledState, AppState.currentSource, AppState.lastChangedTime);
      }
    }

    // Update Status Page Hardware Telemetry if visible
    updateSystemStatusTelemetry(data);
  }

  function updateLedUI(state, source, timestamp) {
    const isOn = (state === 'ON');

    // Dashboard Elements
    if (DOM.dashLedVal) {
      DOM.dashLedVal.textContent = state;
      DOM.dashLedVal.style.color = isOn ? 'var(--status-green)' : 'var(--text-secondary)';
    }
    if (DOM.dashLedQuickStatus) {
      DOM.dashLedQuickStatus.innerHTML = isOn
        ? '<span style="color:var(--status-green);">● ON</span>'
        : '<span style="color:var(--text-muted);">● OFF</span>';
    }
    if (DOM.dashLedToggle) {
      DOM.dashLedToggle.checked = isOn;
    }
    if (DOM.dashLedTime) {
      DOM.dashLedTime.textContent = formatTimeOnly(timestamp);
    }
    if (DOM.dashLedSource) {
      DOM.dashLedSource.textContent = source || 'Website';
    }

    // LED Control Page Elements
    if (DOM.ctrlLedLamp) {
      if (isOn) {
        DOM.ctrlLedLamp.classList.add('on');
      } else {
        DOM.ctrlLedLamp.classList.remove('on');
      }
    }
    if (DOM.ctrlLedStatusText) {
      DOM.ctrlLedStatusText.textContent = state;
      DOM.ctrlLedStatusText.style.color = isOn ? 'var(--status-green)' : 'var(--text-secondary)';
    }
    if (DOM.ctrlLedToggle) {
      DOM.ctrlLedToggle.checked = isOn;
    }
    if (DOM.ctrlLastChanged) {
      DOM.ctrlLastChanged.textContent = formatDateTimeFull(timestamp);
    }
    if (DOM.ctrlSource) {
      DOM.ctrlSource.textContent = source || 'Website';
    }

    // Update Telemetry Pipeline
    if (DOM.pipeReqState) DOM.pipeReqState.textContent = state;
    if (DOM.pipeSentTime) DOM.pipeSentTime.textContent = formatTimeOnly(timestamp);
    if (DOM.pipeFbBadge) {
      DOM.pipeFbBadge.className = 'pipeline-step-badge success';
      DOM.pipeFbBadge.textContent = '✓';
    }
    if (DOM.pipeEspBadge) {
      DOM.pipeEspBadge.className = 'pipeline-step-badge success';
      DOM.pipeEspBadge.textContent = '✓';
    }
    if (DOM.pipePhysState) {
      DOM.pipePhysState.textContent = '✓ ' + state;
      DOM.pipePhysState.style.color = isOn ? 'var(--status-green)' : 'var(--text-secondary)';
    }

    // Update System Status Diagram Node
    const archLedNode = document.getElementById('arch-led-status');
    if (archLedNode) {
      archLedNode.className = isOn ? 'badge badge-on' : 'badge badge-off';
      archLedNode.textContent = state;
    }
  }

  // ==========================================================================
  // RECORD EXTERNAL HARDWARE / HMI HISTORY EVENT
  // ==========================================================================
  function recordExternalHistoryEvent(newState, prevState, source = 'HMI') {
    const now = Date.now();
    const eventDate = new Date(now).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const eventTime = new Date(now).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // Prevent duplicate logs if already recorded in the last 3.5 seconds
    const isDuplicate = AppState.historyEvents.some((e) =>
      e.state === newState && (now - e.timestamp < 3500)
    );
    if (isDuplicate) return;

    const rtdb = window.SparkFirebase.rtdb;

    // 1. Push to /history (Full Schema)
    rtdb.ref('history').push({
      deviceId: 'ESP32-LED-001',
      state: newState,
      previousState: prevState || (newState === 'ON' ? 'OFF' : 'ON'),
      source: source,
      timestamp: now,
      date: eventDate,
      time: eventTime,
      eventType: `LED State Changed (${source})`
    }).catch((err) => console.error('Error logging HMI event to /history:', err));

    // 2. Also push to /HISTORY for legacy report compatibility
    rtdb.ref('HISTORY').push({
      date: new Date(now).toISOString().split('T')[0],
      time: eventTime,
      status: newState,
      mode: source
    }).catch((err) => console.error('Error logging to /HISTORY:', err));

    // 3. Update device node state
    rtdb.ref('devices/ESP32-LED-001/led').update({
      state: newState,
      command: newState,
      source: source,
      lastChanged: now
    }).catch(() => {});

    showToast(`✓ LED switched ${newState} via ${source} (Saved in History)`, 'info');
  }

  // ==========================================================================
  // SEND LED COMMAND (BIDIRECTIONAL FIREBASE CONTROL)
  // ==========================================================================
  async function toggleLedCommand(targetState) {
    AppState.isWebAction = true;
    const isChecked = (targetState === 'ON');
    const newState = isChecked ? 'ON' : 'OFF';
    const newStatusInt = isChecked ? 1 : 0;
    const now = Date.now();
    const source = 'Website';

    // Disable switches briefly to avoid race conditions
    if (DOM.dashLedToggle) DOM.dashLedToggle.disabled = true;
    if (DOM.ctrlLedToggle) DOM.ctrlLedToggle.disabled = true;

    // Show initial requested state in pipeline
    if (DOM.pipeReqState) DOM.pipeReqState.textContent = newState;
    if (DOM.pipeSentTime) DOM.pipeSentTime.textContent = formatTimeOnly(now);
    if (DOM.pipeFbBadge) {
      DOM.pipeFbBadge.className = 'pipeline-step-badge pending';
      DOM.pipeFbBadge.textContent = '...';
    }

    try {
      const rtdb = window.SparkFirebase.rtdb;

      // 1. Update /CONTROL for the Arduino sketch
      await rtdb.ref('CONTROL').update({
        led_status: newStatusInt,
        mode: 'manual',
        last_changed: now,
        source: source
      });

      // 2. Update /devices/ESP32-LED-001/led for enterprise schema
      await rtdb.ref('devices/ESP32-LED-001/led').update({
        command: newState,
        state: newState,
        lastChanged: now,
        source: source
      });

      // 3. Push event to /history
      const eventDate = new Date(now).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const eventTime = new Date(now).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      await rtdb.ref('history').push({
        deviceId: 'ESP32-LED-001',
        state: newState,
        previousState: AppState.currentLedState,
        source: source,
        timestamp: now,
        date: eventDate,
        time: eventTime,
        eventType: 'LED State Changed'
      });

      // Also push to /HISTORY for compatibility
      rtdb.ref('HISTORY').push({
        date: new Date(now).toISOString().split('T')[0],
        time: eventTime,
        status: newState,
        mode: source
      }).catch(() => {});

      AppState.currentLedState = newState;
      AppState.currentSource = source;
      AppState.lastChangedTime = now;
      updateLedUI(newState, source, now);

      showToast(`✓ LED switched ${newState} successfully`, 'success');
      addNotification(`LED command sent: ${newState}`, 'Initiated from Web Control Center');
    } catch (err) {
      console.error('Failed to update Firebase:', err);
      showToast('✕ Error sending command to Firebase: ' + err.message, 'error');
      // Revert switches
      if (DOM.dashLedToggle) DOM.dashLedToggle.checked = (AppState.currentLedState === 'ON');
      if (DOM.ctrlLedToggle) DOM.ctrlLedToggle.checked = (AppState.currentLedState === 'ON');
    } finally {
      if (DOM.dashLedToggle) DOM.dashLedToggle.disabled = false;
      if (DOM.ctrlLedToggle) DOM.ctrlLedToggle.disabled = false;
    }
  }

  // ==========================================================================
  // HISTORY DATA PROCESSING & CHARTS
  // ==========================================================================
  function handleHistoryData(rawHistory) {
    if (!rawHistory) {
      AppState.historyEvents = [];
      AppState.filteredEvents = [];
      renderHistoryTable();
      renderRecentTimeline();
      updateDashboardTodayCount();
      updateAnalyticsCharts();
      return;
    }

    const events = [];
    Object.keys(rawHistory).forEach((key) => {
      const item = rawHistory[key];
      if (item && typeof item === 'object') {
        let stateVal = item.state || item.status || 'UNKNOWN';
        if (stateVal === 1 || stateVal === '1') stateVal = 'ON';
        if (stateVal === 0 || stateVal === '0') stateVal = 'OFF';

        let sourceVal = item.source || item.mode || 'HMI';
        if (sourceVal.toLowerCase() === 'manual') sourceVal = 'Website';

        events.push({
          id: key,
          deviceId: item.deviceId || 'ESP32-LED-001',
          state: stateVal,
          source: sourceVal,
          timestamp: item.timestamp || Date.now(),
          date: item.date || formatDateOnly(item.timestamp || Date.now()),
          time: item.time || formatTimeOnly(item.timestamp || Date.now()),
          eventType: item.eventType || `LED State Changed (${sourceVal})`
        });
      }
    });

    // Sort descending by timestamp
    events.sort((a, b) => b.timestamp - a.timestamp);
    AppState.historyEvents = events;
    AppState.filteredEvents = [...events];

    renderRecentTimeline();
    updateDashboardTodayCount();
    renderHistoryTable();
    updateHistoryStats();
    updateDashboardChart();
    updateAnalyticsCharts();
  }

  function updateDashboardTodayCount() {
    if (!DOM.dashTodayEvents) return;
    const todayStr = formatDateOnly(Date.now());
    const count = AppState.historyEvents.filter(e => e.date === todayStr).length;
    DOM.dashTodayEvents.textContent = count;
  }

  function renderRecentTimeline() {
    if (!DOM.dashRecentTimeline) return;
    const recent = AppState.historyEvents.slice(0, 6);

    if (recent.length === 0) {
      DOM.dashRecentTimeline.innerHTML = `
        <div class="empty-state-box" style="padding:24px 0;">
          <p class="empty-state-desc">No events recorded yet. Turn the LED ON/OFF to generate live history.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="timeline-list">';
    recent.forEach((ev) => {
      const isOn = ev.state === 'ON';
      const markerClass = isOn ? 'on' : 'off';
      html += `
        <div class="timeline-item">
          <div class="timeline-marker ${markerClass}"></div>
          <div class="timeline-content">
            <div class="timeline-title-row">
              <span class="timeline-title">LED turned <strong>${ev.state}</strong></span>
              <span class="timeline-time">${ev.time}</span>
            </div>
            <div class="timeline-details">${ev.source} • ${ev.deviceId}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    DOM.dashRecentTimeline.innerHTML = html;
  }

  // ==========================================================================
  // HISTORY TABLE, SEARCH & FILTERING
  // ==========================================================================
  function applyHistoryFilters() {
    const fromDate = DOM.histFromDate.value;
    const toDate = DOM.histToDate.value;
    const fromTime = DOM.histFromTime.value;
    const toTime = DOM.histToTime.value;
    const stateFilter = DOM.histStateFilter.value;
    const sourceFilter = DOM.histSourceFilter.value;

    AppState.filteredEvents = AppState.historyEvents.filter((ev) => {
      const evDateObj = new Date(ev.timestamp);

      // Date Range Filter
      if (fromDate) {
        const fromDateObj = new Date(fromDate);
        fromDateObj.setHours(0, 0, 0, 0);
        if (evDateObj < fromDateObj) return false;
      }
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        if (evDateObj > toDateObj) return false;
      }

      // Time Range Filter
      if (fromTime) {
        const [fh, fm] = fromTime.split(':').map(Number);
        const evH = evDateObj.getHours();
        const evM = evDateObj.getMinutes();
        if (evH < fh || (evH === fh && evM < fm)) return false;
      }
      if (toTime) {
        const [th, tm] = toTime.split(':').map(Number);
        const evH = evDateObj.getHours();
        const evM = evDateObj.getMinutes();
        if (evH > th || (evH === th && evM > tm)) return false;
      }

      // State Filter
      if (stateFilter !== 'ALL' && ev.state !== stateFilter) {
        return false;
      }

      // Source Filter
      if (sourceFilter !== 'ALL' && !ev.source.toLowerCase().includes(sourceFilter.toLowerCase())) {
        return false;
      }

      return true;
    });

    AppState.pagination.currentPage = 1;
    renderHistoryTable();
    updateHistoryStats();
    showToast(`Found ${AppState.filteredEvents.length} events matching filter criteria`, 'info');
  }

  function clearHistoryFilters() {
    if (DOM.histFromDate) DOM.histFromDate.value = '';
    if (DOM.histToDate) DOM.histToDate.value = '';
    if (DOM.histFromTime) DOM.histFromTime.value = '';
    if (DOM.histToTime) DOM.histToTime.value = '';
    if (DOM.histStateFilter) DOM.histStateFilter.value = 'ALL';
    if (DOM.histSourceFilter) DOM.histSourceFilter.value = 'ALL';

    AppState.filteredEvents = [...AppState.historyEvents];
    AppState.pagination.currentPage = 1;
    renderHistoryTable();
    updateHistoryStats();
    showToast('Filters cleared', 'info');
  }

  function updateHistoryStats() {
    const list = AppState.filteredEvents;
    const total = list.length;
    const onCount = list.filter(e => e.state === 'ON').length;
    const offCount = list.filter(e => e.state === 'OFF').length;
    const lastEvent = list.length > 0 ? list[0].time : 'N/A';

    if (DOM.histStatTotal) DOM.histStatTotal.textContent = total;
    if (DOM.histStatOn) DOM.histStatOn.textContent = onCount;
    if (DOM.histStatOff) DOM.histStatOff.textContent = offCount;
    if (DOM.histStatLast) DOM.histStatLast.textContent = lastEvent;
  }

  function renderHistoryTable() {
    if (!DOM.historyTableBody) return;

    const list = AppState.filteredEvents;
    const total = list.length;

    if (total === 0) {
      DOM.historyTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state-box">
              <div class="empty-state-title">No Activity Recorded</div>
              <p class="empty-state-desc">No events found matching your filter criteria or no hardware logs recorded yet.</p>
            </div>
          </td>
        </tr>
      `;
      if (DOM.historyPaginationInfo) DOM.historyPaginationInfo.textContent = 'Showing 0 of 0 events';
      if (DOM.btnPrevPage) DOM.btnPrevPage.disabled = true;
      if (DOM.btnNextPage) DOM.btnNextPage.disabled = true;
      return;
    }

    const { currentPage, pageSize } = AppState.pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = list.slice(startIdx, startIdx + pageSize);

    let html = '';
    pageItems.forEach((ev) => {
      const isOn = ev.state === 'ON';
      const badgeClass = isOn ? 'badge-on' : 'badge-off';
      html += `
        <tr>
          <td><strong>${ev.date}</strong></td>
          <td>${ev.time}</td>
          <td><code>${ev.deviceId}</code></td>
          <td><span class="badge ${badgeClass}">${ev.state}</span></td>
          <td><span class="badge badge-source">${ev.source}</span></td>
          <td>${ev.eventType}</td>
          <td style="color:var(--text-muted); font-size:12px;">${ev.timestamp}</td>
        </tr>
      `;
    });

    DOM.historyTableBody.innerHTML = html;

    const endIdx = Math.min(startIdx + pageSize, total);
    if (DOM.historyPaginationInfo) {
      DOM.historyPaginationInfo.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${total} events`;
    }
    if (DOM.btnPrevPage) DOM.btnPrevPage.disabled = (currentPage <= 1);
    if (DOM.btnNextPage) DOM.btnNextPage.disabled = (currentPage >= totalPages);
  }

  // ==========================================================================
  // EXPORT AS EXCEL (.XLSX via SheetJS)
  // ==========================================================================
  function exportHistoryToExcel() {
    const list = AppState.filteredEvents;
    if (list.length === 0) {
      showToast('No history data available to export', 'warning');
      return;
    }

    try {
      // Map to clean tabular format for Excel
      const excelRows = list.map((ev, index) => ({
        'S.No': index + 1,
        'Date': ev.date,
        'Time': ev.time,
        'Device ID': ev.deviceId,
        'LED State': ev.state,
        'Source / Interface': ev.source,
        'Event Type': ev.eventType,
        'Unix Timestamp': ev.timestamp
      }));

      // Create Worksheet using SheetJS
      const worksheet = XLSX.utils.json_to_sheet(excelRows);

      // Auto-size columns
      const colWidths = [
        { wch: 6 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 12 },
        { wch: 18 },
        { wch: 22 },
        { wch: 16 }
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'LED State History');

      // Export file
      const dateStamp = new Date().toISOString().slice(0, 10);
      const filename = `Spark_LED_History_${dateStamp}.xlsx`;
      XLSX.writeFile(workbook, filename);

      showToast('LED history exported successfully as Excel file (.xlsx)', 'success');
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('Failed to export Excel file: ' + err.message, 'error');
    }
  }

  // ==========================================================================
  // CHART.JS DATA VISUALIZATION
  // ==========================================================================
  function updateDashboardChart() {
    const canvas = document.getElementById('dash-activity-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const recentEvents = [...AppState.historyEvents].slice(0, 20).reverse();

    const labels = recentEvents.map(e => e.time);
    const dataPoints = recentEvents.map(e => (e.state === 'ON' ? 1 : 0));

    if (AppState.charts.activityChart) {
      AppState.charts.activityChart.destroy();
    }

    AppState.charts.activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['10:00 AM', '11:00 AM', '12:00 PM'],
        datasets: [{
          label: 'LED State (1 = ON, 0 = OFF)',
          data: dataPoints.length > 0 ? dataPoints : [0, 0, 0],
          stepped: true,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          fill: true,
          borderWidth: 2.5,
          pointBackgroundColor: '#0284c7',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `State: ${ctx.raw === 1 ? 'ON' : 'OFF'}`
            }
          }
        },
        scales: {
          y: {
            min: -0.1,
            max: 1.1,
            ticks: {
              stepSize: 1,
              callback: (val) => (val === 1 ? 'ON' : val === 0 ? 'OFF' : '')
            },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  function updateAnalyticsCharts() {
    const actCanvas = document.getElementById('analytics-activity-chart');
    const ratioCanvas = document.getElementById('analytics-ratio-chart');
    const srcCanvas = document.getElementById('analytics-source-chart');

    if (!actCanvas || !ratioCanvas || !srcCanvas) return;

    const list = AppState.historyEvents;
    const onCount = list.filter(e => e.state === 'ON').length;
    const offCount = list.filter(e => e.state === 'OFF').length;

    // Sources breakdown
    const webCount = list.filter(e => (e.source || '').toLowerCase().includes('web')).length;
    const hmiCount = list.filter(e => (e.source || '').toLowerCase().includes('hmi')).length;
    const espCount = list.length - webCount - hmiCount;

    // 1. Ratio Chart (Doughnut)
    if (AppState.charts.analyticsRatioChart) AppState.charts.analyticsRatioChart.destroy();
    AppState.charts.analyticsRatioChart = new Chart(ratioCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['ON Events', 'OFF Events'],
        datasets: [{
          data: [onCount || 1, offCount || 1],
          backgroundColor: ['#22c55e', '#94a3b8'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // 2. Source Breakdown Chart (Bar)
    if (AppState.charts.analyticsSourceChart) AppState.charts.analyticsSourceChart.destroy();
    AppState.charts.analyticsSourceChart = new Chart(srcCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Website', 'HMI Interface', 'ESP32 Hardware'],
        datasets: [{
          label: 'Triggered Actions',
          data: [webCount, hmiCount, Math.max(0, espCount)],
          backgroundColor: ['#0284c7', '#8b5cf6', '#f59e0b'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });

    // 3. Analytics Activity Line
    const recent = [...list].slice(0, 15).reverse();
    if (AppState.charts.analyticsActivityChart) AppState.charts.analyticsActivityChart.destroy();
    AppState.charts.analyticsActivityChart = new Chart(actCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: recent.map(e => e.time),
        datasets: [{
          label: 'State Transitions',
          data: recent.map(e => (e.state === 'ON' ? 1 : 0)),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          stepped: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: -0.1, max: 1.1,
            ticks: { callback: v => (v === 1 ? 'ON' : v === 0 ? 'OFF' : '') },
            grid: { color: '#f1f5f9' }
          },
          x: { grid: { display: false } }
        }
      }
    });

    // Update Analytics Top Stat Cards
    const anTotal = document.getElementById('an-total-events');
    const anOn = document.getElementById('an-on-events');
    const anOff = document.getElementById('an-off-events');
    if (anTotal) anTotal.textContent = list.length;
    if (anOn) anOn.textContent = onCount;
    if (anOff) anOff.textContent = offCount;
  }

  function updateSystemStatusTelemetry(data) {
    const statIp = document.getElementById('stat-ip');
    const statMac = document.getElementById('stat-mac');
    const statWifi = document.getElementById('stat-wifi');
    const statHeartbeat = document.getElementById('stat-heartbeat');
    const statFirmware = document.getElementById('stat-firmware');
    const archEspStatus = document.getElementById('arch-esp-status');

    if (statIp) statIp.textContent = data.ipAddress || '192.168.1.108';
    if (statMac) statMac.textContent = data.macAddress || '24:6F:28:B4:7A:1C';
    if (statWifi) statWifi.textContent = data.wifiStatus || 'Connected (SSID: H)';
    if (statHeartbeat && data.lastSeen) {
      statHeartbeat.textContent = formatDateTimeFull(data.lastSeen);
    }
    if (statFirmware) statFirmware.textContent = data.firmwareVersion || 'v1.4.2-industrial';

    if (archEspStatus) {
      const isOnline = (data.status === 'online' || (Date.now() - (data.lastSeen || 0) < 60000));
      archEspStatus.className = isOnline ? 'badge badge-on' : 'badge badge-off';
      archEspStatus.textContent = isOnline ? 'Online' : 'Offline';
    }
  }

  // ==========================================================================
  // ROUTING & NAVIGATION
  // ==========================================================================
  function handleRouteFromHash() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    if (hash === 'login' && AppState.user) {
      navigateTo('dashboard');
    } else if (hash !== 'login' && !AppState.user) {
      // Unauthenticated access attempt
      DOM.authView.style.display = 'flex';
      DOM.appView.style.display = 'none';
      window.location.hash = '#login';
    } else {
      navigateTo(hash);
    }
  }

  function navigateTo(route) {
    if (!AppState.user && route !== 'login') {
      route = 'login';
    }

    AppState.activeRoute = route;
    window.location.hash = '#' + route;

    // Toggle pages
    const pages = document.querySelectorAll('.page-view');
    pages.forEach((page) => {
      if (page.id === `page-${route}`) {
        page.style.display = 'block';
      } else {
        page.style.display = 'none';
      }
    });

    // Update active state in sidebar
    DOM.sidebarNavLinks.forEach((link) => {
      if (link.getAttribute('data-route') === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Header Breadcrumb and Title
    const titleMap = {
      dashboard: 'Dashboard',
      devices: 'Connected Devices',
      control: 'LED Control',
      history: 'LED History & Event Logs',
      analytics: 'System Analytics',
      status: 'System Communication Status',
      company: 'Spark Drives & Automation',
      profile: 'My Profile',
      settings: 'System Settings'
    };

    const friendlyTitle = titleMap[route] || 'Industrial IoT Center';
    if (DOM.headerPageTitle) DOM.headerPageTitle.textContent = friendlyTitle;
    if (DOM.breadcrumbCurrent) DOM.breadcrumbCurrent.textContent = friendlyTitle;

    // Trigger chart resize if navigated to dashboard or analytics
    if (route === 'dashboard') {
      setTimeout(updateDashboardChart, 100);
    } else if (route === 'analytics') {
      setTimeout(updateAnalyticsCharts, 100);
    }

    // Close mobile drawer on route change
    if (DOM.appSidebar) {
      DOM.appSidebar.classList.remove('mobile-open');
    }
  }

  // ==========================================================================
  // LIVE IST CLOCK (Asia/Kolkata)
  // ==========================================================================
  function setupClock() {
    function tick() {
      const now = new Date();
      const options = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      if (DOM.liveClock) {
        DOM.liveClock.textContent = now.toLocaleString('en-IN', options) + ' IST';
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  // ==========================================================================
  // NOTIFICATIONS SYSTEM
  // ==========================================================================
  function addNotification(title, message) {
    const notif = {
      id: Date.now(),
      title,
      message,
      time: formatTimeOnly(Date.now()),
      read: false
    };
    AppState.notifications.unshift(notif);
    renderNotificationList();
  }

  function renderNotificationList() {
    if (!DOM.notifList) return;
    const unread = AppState.notifications.filter(n => !n.read).length;

    if (DOM.notifBadge) {
      if (unread > 0) {
        DOM.notifBadge.style.display = 'flex';
        DOM.notifBadge.textContent = unread > 9 ? '9+' : unread;
      } else {
        DOM.notifBadge.style.display = 'none';
      }
    }

    if (AppState.notifications.length === 0) {
      DOM.notifList.innerHTML = `
        <div style="padding:16px; text-align:center; color:var(--text-muted); font-size:12px;">
          No notifications yet
        </div>
      `;
      return;
    }

    let html = '';
    AppState.notifications.slice(0, 10).forEach((n) => {
      html += `
        <div class="dropdown-item" style="display:flex; flex-direction:column; align-items:flex-start; border-bottom:1px solid var(--border-subtle); padding:10px 14px;">
          <div style="display:flex; justify-content:space-between; width:100%; font-size:12.5px; font-weight:600; color:var(--text-primary);">
            <span>${n.title}</span>
            <span style="font-size:10.5px; color:var(--text-muted); font-weight:normal;">${n.time}</span>
          </div>
          <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">${n.message}</div>
        </div>
      `;
    });
    DOM.notifList.innerHTML = html;
  }

  // ==========================================================================
  // TOAST NOTIFICATION UTILITY
  // ==========================================================================
  function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSymbol = 'ℹ';
    if (type === 'success') iconSymbol = '✓';
    if (type === 'error') iconSymbol = '✕';
    if (type === 'warning') iconSymbol = '⚠';

    toast.innerHTML = `
      <span class="toast-icon">${iconSymbol}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close-btn">&times;</button>
    `;

    DOM.toastContainer.appendChild(toast);

    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 200);
      }
    }, 4500);
  }

  // ==========================================================================
  // EVENT LISTENERS & UI INTERACTIONS
  // ==========================================================================
  function setupEventListeners() {
    // 1. Login Form Submit
    if (DOM.loginForm) {
      DOM.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = DOM.loginEmail.value.trim();
        const password = DOM.loginPassword.value;

        if (!email || !password) {
          showAuthAlert('Please enter both email and password.', 'error');
          return;
        }

        DOM.loginSubmitBtn.disabled = true;
        DOM.loginSubmitBtn.innerHTML = '<span>Verifying credentials...</span>';
        hideAuthAlert();

        try {
          await window.SparkFirebase.auth.signInWithEmailAndPassword(email, password);
          showToast('Welcome to Spark Drives & Automation Control Center', 'success');
        } catch (err) {
          console.error('Login error:', err);
          let userMsg = 'Invalid email or password. Please try again.';
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            userMsg = 'Invalid email or password.';
          } else if (err.code === 'auth/too-many-requests') {
            userMsg = 'Access temporarily locked due to too many failed attempts. Try again later.';
          } else if (err.code === 'auth/network-request-failed') {
            userMsg = 'Network error. Please check your internet connection.';
          }
          showAuthAlert(userMsg, 'error');
        } finally {
          DOM.loginSubmitBtn.disabled = false;
          DOM.loginSubmitBtn.innerHTML = '<span>Sign In to Control Center</span>';
        }
      });
    }

    // 2. Password Visibility Toggle
    if (DOM.togglePasswordBtn && DOM.loginPassword) {
      DOM.togglePasswordBtn.addEventListener('click', () => {
        const isPassword = DOM.loginPassword.type === 'password';
        DOM.loginPassword.type = isPassword ? 'text' : 'password';
        DOM.togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
      });
    }

    // 3. Forgot Password Modal
    if (DOM.forgotPasswordBtn && DOM.forgotPasswordModal) {
      DOM.forgotPasswordBtn.addEventListener('click', () => {
        if (DOM.forgotModalEmail && DOM.loginEmail.value) {
          DOM.forgotModalEmail.value = DOM.loginEmail.value;
        }
        DOM.forgotPasswordModal.classList.add('active');
      });
    }

    if (DOM.forgotModalSubmitBtn) {
      DOM.forgotModalSubmitBtn.addEventListener('click', async () => {
        const email = DOM.forgotModalEmail.value.trim();
        if (!email) {
          showToast('Please enter your account email address', 'warning');
          return;
        }
        try {
          await window.SparkFirebase.auth.sendPasswordResetEmail(email);
          DOM.forgotPasswordModal.classList.remove('active');
          showToast('Password reset link sent to ' + email, 'success');
        } catch (err) {
          showToast('Failed to send reset email: ' + err.message, 'error');
        }
      });
    }

    // Close Modals
    document.querySelectorAll('.modal-close-trigger').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    // 4. Logout Action
    if (DOM.logoutBtn) {
      DOM.logoutBtn.addEventListener('click', async () => {
        try {
          await window.SparkFirebase.auth.signOut();
          showToast('Session ended. You have been logged out.', 'info');
        } catch (err) {
          showToast('Logout error: ' + err.message, 'error');
        }
      });
    }

    // 5. LED Control Toggles
    if (DOM.dashLedToggle) {
      DOM.dashLedToggle.addEventListener('change', (e) => {
        toggleLedCommand(e.target.checked ? 'ON' : 'OFF');
      });
    }
    if (DOM.ctrlLedToggle) {
      DOM.ctrlLedToggle.addEventListener('change', (e) => {
        toggleLedCommand(e.target.checked ? 'ON' : 'OFF');
      });
    }

    // 6. Navigation Link Clicks
    DOM.sidebarNavLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        navigateTo(route);
      });
    });

    window.addEventListener('hashchange', handleRouteFromHash);

    // 7. Sidebar Collapsing & Mobile Drawer
    if (DOM.sidebarToggleBtn && DOM.appSidebar) {
      DOM.sidebarToggleBtn.addEventListener('click', () => {
        AppState.isSidebarCollapsed = !AppState.isSidebarCollapsed;
        DOM.appSidebar.classList.toggle('collapsed', AppState.isSidebarCollapsed);
        if (AppState.charts.activityChart) AppState.charts.activityChart.resize();
      });
    }
    if (DOM.mobileMenuBtn && DOM.appSidebar) {
      DOM.mobileMenuBtn.addEventListener('click', () => {
        DOM.appSidebar.classList.toggle('mobile-open');
      });
    }

    // 8. Header Dropdowns Toggle
    if (DOM.notifBtn && DOM.notifDropdown) {
      DOM.notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.notifDropdown.classList.toggle('active');
        if (DOM.userDropdown) DOM.userDropdown.classList.remove('active');
      });
    }
    if (DOM.userDropdownBtn && DOM.userDropdown) {
      DOM.userDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.userDropdown.classList.toggle('active');
        if (DOM.notifDropdown) DOM.notifDropdown.classList.remove('active');
      });
    }
    document.addEventListener('click', () => {
      if (DOM.notifDropdown) DOM.notifDropdown.classList.remove('active');
      if (DOM.userDropdown) DOM.userDropdown.classList.remove('active');
    });

    // Mark Notifs Read
    if (DOM.markNotifsReadBtn) {
      DOM.markNotifsReadBtn.addEventListener('click', () => {
        AppState.notifications.forEach(n => n.read = true);
        renderNotificationList();
      });
    }

    // 9. History Search, Filters & Excel Download
    if (DOM.btnSearchHistory) {
      DOM.btnSearchHistory.addEventListener('click', applyHistoryFilters);
    }
    if (DOM.btnClearFilters) {
      DOM.btnClearFilters.addEventListener('click', clearHistoryFilters);
    }
    if (DOM.btnDownloadExcel) {
      DOM.btnDownloadExcel.addEventListener('click', exportHistoryToExcel);
    }

    // Pagination
    if (DOM.btnPrevPage) {
      DOM.btnPrevPage.addEventListener('click', () => {
        if (AppState.pagination.currentPage > 1) {
          AppState.pagination.currentPage--;
          renderHistoryTable();
        }
      });
    }
    if (DOM.btnNextPage) {
      DOM.btnNextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(AppState.filteredEvents.length / AppState.pagination.pageSize);
        if (AppState.pagination.currentPage < totalPages) {
          AppState.pagination.currentPage++;
          renderHistoryTable();
        }
      });
    }

    // Quick View Details Button on Devices Page
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('btn-view-device-modal')) {
        if (DOM.deviceModal) DOM.deviceModal.classList.add('active');
      }
    });
  }

  function showAuthAlert(msg, type) {
    if (!DOM.loginAlert) return;
    DOM.loginAlert.className = `auth-alert ${type}`;
    DOM.loginAlert.textContent = msg;
    DOM.loginAlert.style.display = 'block';
  }

  function hideAuthAlert() {
    if (!DOM.loginAlert) return;
    DOM.loginAlert.style.display = 'none';
  }

  // ==========================================================================
  // HELPER FORMATTING FUNCTIONS
  // ==========================================================================
  function formatDateOnly(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatTimeOnly(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  function formatDateTimeFull(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }

  // Self-execute initialization on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
