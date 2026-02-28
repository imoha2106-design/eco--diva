/* =========================================
   EcoCity — Main Application Script
   Integrated with Firebase (Auth + Firestore) & EmailJS
   ========================================= */

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: 'AIzaSyDpSV4v7KLxL4nLXanCOuk_aCpcn0-_T9Q',
    authDomain: 'hakaton-f8974.firebaseapp.com',
    projectId: 'hakaton-f8974',
    storageBucket: 'hakaton-f8974.firebasestorage.app',
    messagingSenderId: '763754459609',
    appId: '1:763754459609:web:d36ce68de8bb76229929c8',
    measurementId: 'G-3YDN3ZSC4C'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- EMAILJS CONFIGURATION ---
(function () {
    emailjs.init("1nXarMmeTeR1S8jAH");
})();

let currentUserDoc = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Dashboard AQI Chart
    initAQIChart();

    // 2. Initialize Trend Section Chart (Moved up so fetchAQI can use it immediately)
    initTrendChart();

    // 3. Fetch Real-time AQI for Petropavl
    fetchAQI();
    setInterval(fetchAQI, 30 * 60 * 1000); // Auto-update every 30 min

    // 4. Setup Interactions (tabs, modals, buttons)
    setupInteractions();

    // 5. Render Smart Bins
    renderBins();

    // 6. Initialize Eco-Sim Grid (main page version)
    initEcoSimGridMain();

    // 7. Setup AR Camera
    setupARCamera();

    // 8. Setup Leaflet Map observer for route section
    setupRouteMapObserver();

    // 9. Setup logout
    setupLogout();

    // 10. Dynamic alerts initial render
    updateDynamicAlerts();

    // 11. Auth State Observer
    auth.onAuthStateChanged(user => {
        const overlay = document.getElementById('auth-overlay');
        const appContainer = document.querySelector('.app-container');

        if (user) {
            // Logged in
            if (overlay) overlay.style.display = 'none';
            if (appContainer) appContainer.style.display = '';

            // Show Dashboard initially
            showSection('dashboard');

            // Fetch User Data from Firestore
            fetchUserData(user);
        } else {
            // Not logged in
            if (overlay) overlay.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
        }
    });
});

/* =========================================
   Global State
   ========================================= */
let aqiChartInstance = null;
let trendChartInstance = null;
let currentForecastData = null;
let currentAqiVal = 0;

let data24h = { labels: [], points: [], insightText: '' };
let data7d = { labels: [], points: [], insightText: '' };

const WAQI_TOKEN = 'cd77e4f2b354fa58c2bf2727593b2da07c391e06';

/* =========================================
   SPA Navigation Logic
   ========================================= */
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => sec.classList.remove('active'));

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => item.classList.remove('active'));

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const targetLink = Array.from(navItems).find(item =>
        item.getAttribute('onclick') && item.getAttribute('onclick').includes(sectionId)
    );
    if (targetLink) {
        targetLink.classList.add('active');
    }

    const targetMobileLink = Array.from(mobileNavItems).find(item =>
        item.getAttribute('onclick') && item.getAttribute('onclick').includes(sectionId)
    );
    if (targetMobileLink) {
        targetMobileLink.classList.add('active');
    }
}

/* =========================================
   1. Dashboard AQI Chart (Chart.js)
   ========================================= */
function initAQIChart() {
    const canvas = document.getElementById('aqiChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now', '+4h'];
    const dataPoints = [35, 30, 48, 62, 58, 45, 42, 55];

    aqiChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'PM2.5 Level',
                data: dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (context) {
                            return context.parsed.y + ' AQI';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    border: { display: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' }, stepSize: 20 }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    border: { display: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' } }
                }
            }
        }
    });
}

/* =========================================
   Trend Section Chart (7-day PM2.5)
   ========================================= */
function initTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 380);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'PM2.5 Forecast',
                data: [42, 38, 30, 25, 28, 45, 50],
                borderColor: '#10b981',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#10b981',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (context) {
                            return context.parsed.y + ' µg/m³ PM2.5';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    border: { display: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' }, stepSize: 20 }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    border: { display: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' } }
                }
            }
        }
    });
}

/* =========================================
   2. Real-time AQI (WAQI API)
   ========================================= */
async function fetchAQI() {
    const aqiNumberEl = document.getElementById('aqi-number');
    if (!aqiNumberEl) return;

    try {
        const fetchUrl = `https://api.waqi.info/feed/geo:54.87;69.15/?token=${WAQI_TOKEN}`;
        const res = await fetch(fetchUrl);
        const json = await res.json();

        if (json.status === 'ok') {
            const aqi = json.data.aqi;
            const pm10 = json.data.iaqi.pm10 ? json.data.iaqi.pm10.v : '--';
            const no2 = json.data.iaqi.no2 ? json.data.iaqi.no2.v : '--';
            const o3 = json.data.iaqi.o3 ? json.data.iaqi.o3.v : '--';

            // Cache
            localStorage.setItem('cached_aqi_data', JSON.stringify({ aqi, pm10, no2, o3, time: Date.now() }));

            currentAqiVal = aqi;

            // Store forecast data for AI Charts
            if (json.data.forecast && json.data.forecast.daily) {
                currentForecastData = json.data.forecast.daily;

                // 1) Build data7d (Real WAQI Data)
                const forecastPM25 = currentForecastData.pm25;
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                let maxVal = 0, minVal = 999;

                data7d.labels = [];
                data7d.points = [];

                for (let i = 0; i < Math.min(7, forecastPM25.length); i++) {
                    let d = forecastPM25[i];
                    let dateObj = new Date(d.day);
                    let dayName = i === 0 ? 'Today' : days[dateObj.getDay()];
                    let icon = '☀️';
                    if (d.avg > 50) icon = '⛅';
                    if (d.avg > 100) icon = '🌫️';
                    data7d.labels.push(`${dayName} ${icon}`);
                    data7d.points.push(d.avg);
                    if (d.avg > maxVal) maxVal = d.avg;
                    if (d.avg < minVal) minVal = d.avg;
                }

                if (maxVal > 100) {
                    data7d.insightText = `<strong>ИИ-прогноз:</strong> Ожидается смог на этой неделе, средние значения достигнут <span class="text-red">${maxVal} AQI</span>.`;
                } else if (minVal <= 50 && maxVal <= 50) {
                    data7d.insightText = `<strong>ИИ-прогноз:</strong> Неделя чистого воздуха впереди, стабильно <span class="text-green">ниже 50 ИКВ</span>.`;
                } else {
                    data7d.insightText = `<strong>ИИ-прогноз:</strong> Обычная неделя, колеблется между ${minVal} and ${maxVal} AQI.`;
                }

                // 2) Build data24h (Hourly Simulation using Current AQI)
                const todayAvg = forecastPM25[0] ? forecastPM25[0].avg : aqi;
                const tomorrowAvg = forecastPM25[1] ? forecastPM25[1].avg : todayAvg;
                const nowTime = new Date();
                const currentHour = nowTime.getHours();

                data24h.labels = [];
                data24h.points = [];

                for (let i = -6; i <= 1; i++) {
                    let h = (currentHour + (i * 3)) % 24;
                    if (h < 0) h += 24;
                    let timeStr = i === 0 ? 'Now' : (i === 1 ? '+3h' : `${h.toString().padStart(2, '0')}:00`);
                    data24h.labels.push(timeStr);

                    let rushHourSpike = 0;
                    if (h >= 7 && h <= 9) rushHourSpike = 15;
                    if (h >= 17 && h <= 19) rushHourSpike = 20;
                    if (h >= 0 && h <= 5) rushHourSpike = -10;

                    let blend = aqi;
                    if (i > 0) blend = (aqi + tomorrowAvg) / 2;
                    if (i < 0) blend = todayAvg;

                    let val = Math.max(0, Math.round(blend + rushHourSpike + (Math.random() * 5 - 2.5)));
                    if (i === 0) val = aqi;
                    data24h.points.push(val);
                }

                let diff = data24h.points[7] - aqi;
                let percent = Math.round(Math.abs(diff) / (aqi || 1) * 100);
                if (diff > 5) {
                    data24h.insightText = `<strong>ИИ-прогноз:</strong> Ожидается, что <span class="text-orange">загрязнение вырастет на ${percent}%</span> в течение следующих 3-4 часов.`;
                } else if (diff < -5) {
                    data24h.insightText = `<strong>ИИ-прогноз:</strong> Улучшение условий, ожидается <span class="text-green">падение на ${percent}%</span> вскоре.`;
                } else {
                    data24h.insightText = `<strong>ИИ-прогноз:</strong> Ожидается, что качество воздуха останется стабильным в течение нескольких часов.`;
                }

                // Read active tab to persist view mode when API pulls fresh data
                const activeTab = document.querySelector('.tab.active');
                const view = activeTab && activeTab.innerText.includes('На 7 дней') ? '7d' : '24h';
                updateChart(view);
            }

            updateAQIUI(aqi, pm10, no2, o3, false);
        } else {
            throw new Error('API Response not ok');
        }
    } catch (err) {
        console.warn('AQI Fetch Failed. Using fallback data.', err);
        const cached = localStorage.getItem('cached_aqi_data');
        if (cached) {
            const parsed = JSON.parse(cached);
            currentAqiVal = parsed.aqi;
            updateAQIUI(parsed.aqi, parsed.pm10, parsed.no2, parsed.o3, true);
        } else {
            if (aqiNumberEl) aqiNumberEl.textContent = '--';
            const aqiStatusTextEl = document.getElementById('aqi-status-text');
            const aqiStatusDescEl = document.getElementById('aqi-status-desc');
            if (aqiStatusTextEl) aqiStatusTextEl.textContent = 'Data Unavailable';
            if (aqiStatusDescEl) aqiStatusDescEl.innerHTML = '<span style="color:#ef4444;"><i class="ph-fill ph-warning-circle"></i> Данные в реальном времени временно недоступны.</span>';
        }
    }
}

function updateAQIUI(aqi, pm10, no2, o3, isFallback) {
    const aqiNumberEl = document.getElementById('aqi-number');
    const aqiStatusTextEl = document.getElementById('aqi-status-text');
    const aqiStatusDescEl = document.getElementById('aqi-status-desc');
    const circleChartEl = document.getElementById('aqi-circle-chart');
    const circleFillEl = document.getElementById('aqi-circle-fill');
    const statusBadgeEl = document.querySelector('.status-badge');

    const pm10El = document.getElementById('aqi-val-pm10');
    const no2El = document.getElementById('aqi-val-no2');
    const o3El = document.getElementById('aqi-val-o3');

    if (aqiNumberEl) aqiNumberEl.textContent = aqi;
    if (pm10El) pm10El.innerHTML = `${pm10} <small>µg/m³</small>`;
    if (no2El) no2El.innerHTML = `${no2} <small>µg/m³</small>`;
    if (o3El) o3El.innerHTML = `${o3} <small>µg/m³</small>`;

    if (circleChartEl) {
        circleChartEl.classList.remove('green', 'yellow', 'red');
        let statusText = '', statusDesc = '', badgeText = 'Безопасный режим', badgeClass = 'safe';

        if (aqi <= 50) {
            circleChartEl.classList.add('green');
            statusText = 'Хорошее качество воздуха';
            statusDesc = "Динамика загрязнения оптимальна. Отличное время открыть окна или пойти на пробежку.";
            badgeText = 'Безопасный режим'; badgeClass = 'safe';
        } else if (aqi <= 100) {
            circleChartEl.classList.add('yellow');
            statusText = 'Умеренное качество воздуха';
            statusDesc = "Качество воздуха приемлемо. Чувствительны люди должны ограничить долгое пребывание на улице.";
            badgeText = 'Moderate'; badgeClass = 'moderate';
        } else {
            circleChartEl.classList.add('red');
            statusText = 'Нездоровое качество воздуха';
            statusDesc = "Возможны последствия для здоровья чувствительных групп. Обычные люди менее подвержены.";
            badgeText = 'Unhealthy'; badgeClass = 'danger';
        }

        if (aqiStatusTextEl) aqiStatusTextEl.textContent = statusText;
        if (aqiStatusDescEl) {
            if (isFallback) {
                aqiStatusDescEl.innerHTML = '<span style="color:#ef4444;"><i class="ph-fill ph-warning-circle"></i> Показано последнее кэшированное значение.</span>';
            } else {
                aqiStatusDescEl.textContent = statusDesc;
            }
        }
        if (statusBadgeEl) {
            statusBadgeEl.textContent = badgeText;
            statusBadgeEl.className = 'status-badge ' + badgeClass;
        }
    }

    if (circleFillEl) {
        const boundedAqi = Math.min(300, Math.max(0, aqi));
        const percentage = (boundedAqi / 300) * 100;
        circleFillEl.setAttribute('stroke-dasharray', `${percentage}, 100`);
    }

    // Update dynamic alerts based on new AQI
    updateDynamicAlerts(aqi);
}

/* =========================================
   3. AI Predictions — Update Trend Chart
   ========================================= */

/* =========================================
   Tab Switching for AI Chart
   ========================================= */
function updateChart(view) {
    let targetData = view === '24h' ? data24h : data7d;

    // Fallback if data hasn't loaded yet
    if (targetData.labels.length === 0) {
        if (view === '24h') {
            targetData = {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now', '+4h'],
                points: [35, 30, 48, 62, 58, 45, 42, 55],
                insightText: '<strong>ИИ-прогноз:</strong> Загрузка данных в реальном времени...'
            };
        } else {
            targetData = {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                points: [42, 38, 30, 25, 28, 45, 50],
                insightText: '<strong>ИИ-прогноз:</strong> Загрузка прогноза...'
            };
        }
    }

    if (aqiChartInstance) {
        aqiChartInstance.data.labels = targetData.labels;
        aqiChartInstance.data.datasets[0].data = targetData.points;
        aqiChartInstance.update();
    }

    if (trendChartInstance) {
        trendChartInstance.data.labels = targetData.labels;
        trendChartInstance.data.datasets[0].data = targetData.points;
        trendChartInstance.update();
    }

    // Update ALL insight texts on the page
    const insightEls = document.querySelectorAll('.ai-insight span');
    insightEls.forEach(el => el.innerHTML = targetData.insightText);
}

/* =========================================
   4. Interactions & Modals
   ========================================= */
function setupInteractions() {
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) activeTab.classList.remove('active');
            tab.classList.add('active');
            if (tab.innerText.includes('24h')) {
                updateChart('24h');
            } else if (tab.innerText.includes('На 7 дней')) {
                updateChart('7d');
            }
        });
    });

    // Modal Logic
    const modalOverlay = document.getElementById('modal-overlay');
    const closeBtns = document.querySelectorAll('.close-modal');
    const modals = document.querySelectorAll('.modal-card');

    function openModal(modalId) {
        if (modalOverlay) {
            modalOverlay.classList.add('active');
            modals.forEach(m => m.classList.remove('active'));
            const target = document.getElementById(modalId);
            if (target) target.classList.add('active');
        }
    }

    function closeModal() {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            setTimeout(() => {
                modals.forEach(m => m.classList.remove('active'));
            }, 300);
        }
    }

    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // Leaderboard modal
    const btnLeaderboard = document.getElementById('btn-leaderboard');
    if (btnLeaderboard) {
        btnLeaderboard.addEventListener('click', (e) => {
            e.preventDefault();
            renderLeaderboard();
            openModal('modal-leaderboard');
        });
    }

    // Shortcut Buttons → Navigate to sections
    const btnReport = document.getElementById('btn-report');
    if (btnReport) btnReport.addEventListener('click', () => showSection('reports'));

    const btnGreenRoute = document.getElementById('btn-green-route');
    if (btnGreenRoute) btnGreenRoute.addEventListener('click', () => showSection('route'));

    const btnEcoSim = document.getElementById('btn-eco-sim');
    if (btnEcoSim) btnEcoSim.addEventListener('click', () => showSection('heatmap'));

    const btnArHud = document.getElementById('btn-ar-hud');
    if (btnArHud) btnArHud.addEventListener('click', () => showSection('ar'));
}

/* =========================================
   Leaderboard Renderer
   ========================================= */
function renderLeaderboard() {
    const listContainer = document.getElementById('leaderboard-list');
    if (!listContainer) return;

    const volunteers = [
        { name: "Elena R.", score: 2450, avatar: "Aneka" },
        { name: "David Popov", score: 2100, avatar: "Jocelyn" },
        { name: "Maria Chen", score: 1840, avatar: "Nolan" },
        { name: "Sarah Connor", score: 1520, avatar: "Avery" },
        { name: "Ivan Smirnov", score: 1100, avatar: "Mia" },
    ];

    // Insert current user at rank 2
    const rawUser = localStorage.getItem('userAccount');
    if (rawUser) {
        try {
            const user = JSON.parse(rawUser);
            const xp = parseInt(localStorage.getItem('userXP') || '0');
            volunteers.splice(1, 0, { name: user.name || 'Вы', score: xp, avatar: "Felix", isMe: true });
        } catch (e) { /* skip */ }
    }

    listContainer.innerHTML = '';
    volunteers.forEach((user, index) => {
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        const crownHTML = index === 0 ? '<i class="ph-fill ph-crown" style="color:#f59e0b; font-size:12px; position:absolute; top:-5px; left:14px;"></i>' : '';
        const meMarker = user.isMe ? ' <small style="color:#10b981;">(You)</small>' : '';

        const item = document.createElement('div');
        item.className = 'list-view-item';
        item.innerHTML = `
            <div class="list-rank ${rankClass}">#${index + 1}</div>
            <div style="position:relative;">
                ${crownHTML}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}&backgroundColor=b6e3f4" class="list-avatar" alt="avatar">
            </div>
            <div class="list-info">
                <span class="list-name">${user.name}${meMarker}</span>
                <span class="list-score">${user.score} Эко-Баллов</span>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

/* =========================================
   5. Smart Bins Logic
   ========================================= */
const cityBins = [
    { id: 102, name: 'Bin #102 — School Area', fill: 92, location: 'District 3, Block 7', type: 'General' },
    { id: 204, name: 'Bin #204 — Central Park East', fill: 85, location: 'District 1, Park Road', type: 'Recyclable' },
    { id: 315, name: 'Bin #315 — Market Street', fill: 60, location: 'District 5, Market', type: 'Organic' },
    { id: 118, name: 'Bin #118 — Hospital Zone', fill: 45, location: 'District 2, Med Ave', type: 'Medical Waste' },
    { id: 421, name: 'Bin #421 — Residential Block C', fill: 20, location: 'District 7, Block C', type: 'General' },
];

function getBinStatusInfo(fill, scheduled) {
    if (scheduled) return { text: '🚛 Вывоз запланирован', cls: 'scheduled' };
    if (fill >= 90) return { text: '🔴 Критично — Полная!', cls: 'critical' };
    if (fill >= 80) return { text: '🟠 Почти полная', cls: 'warning' };
    if (fill >= 50) return { text: '🟡 Средне', cls: 'safe' };
    return { text: '🟢 Мало', cls: 'safe' };
}

function getBinBarColor(fill) {
    if (fill >= 90) return '#ef4444';
    if (fill >= 80) return '#f59e0b';
    if (fill >= 50) return '#3b82f6';
    return '#10b981';
}

function renderBins() {
    const container = document.getElementById('bins-container');
    if (!container) return;
    container.innerHTML = '';

    cityBins.forEach((bin, idx) => {
        const status = getBinStatusInfo(bin.fill, bin.scheduled);
        const needsPickup = bin.fill >= 80 && !bin.scheduled;

        container.innerHTML += `
            <div class="bin-card" style="background: var(--bg-card, rgba(30, 41, 59, 0.5)); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; padding: 24px; margin-bottom: 16px; transition: all 0.3s ease;">
                <div class="bin-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <span class="bin-name" style="font-size: 16px; font-weight: 600;"><i class="ph-fill ph-trash"></i> ${bin.name}</span>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                            <i class="ph ph-map-pin"></i> ${bin.location} &nbsp;·&nbsp; <i class="ph ph-tag"></i> ${bin.type}
                        </div>
                    </div>
                    <span class="bin-status ${status.cls}" style="font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;
                        ${status.cls === 'scheduled' ? 'background: rgba(59, 130, 246, 0.15); color: #3b82f6;' : ''}
                        ${status.cls === 'critical' ? 'background: rgba(239, 68, 68, 0.15); color: #ef4444;' : ''}
                        ${status.cls === 'warning' ? 'background: rgba(245, 158, 11, 0.15); color: #f59e0b;' : ''}
                        ${status.cls === 'safe' ? 'background: rgba(16, 185, 129, 0.15); color: #10b981;' : ''}
                        ">${status.text}</span>
                </div>
                <div class="bin-progress-track" style="height: 10px; background: rgba(255, 255, 255, 0.06); border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
                    <div class="bin-progress-fill" style="height: 100%; border-radius: 8px; transition: width 0.8s ease, background 0.3s ease; width: ${bin.fill}%; background: ${getBinBarColor(bin.fill)};"></div>
                </div>
                <div class="bin-meta" style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #94a3b8;">
                    <span>${bin.fill}% заполнено</span>
                    ${needsPickup
                ? `<button class="pickup-btn" onclick="requestBinPickup(${idx})" style="padding: 8px 20px; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; border-radius: 10px; color: white; cursor: pointer; font-weight: 600;"><i class="ph-bold ph-truck"></i> Запросить вывоз</button>`
                : bin.scheduled
                    ? `<button class="pickup-btn done" disabled style="padding: 8px 20px; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 10px; color: white; cursor: default; font-weight: 600;"><i class="ph-fill ph-check-circle"></i> Запланировано</button>`
                    : `<span style="color: #10b981;">✓ В норме</span>`
            }
                </div>
            </div>
        `;
    });

    // Update dynamic alerts based on bin capacities
    updateDynamicAlerts();
}

// Pickup Request — awards XP
function requestBinPickup(idx) {
    cityBins[idx].scheduled = true;
    addXP(15);
    renderBins();
}
// Make globally available
window.requestBinPickup = requestBinPickup;

/* =========================================
   6. Report Violation Handlers
   ========================================= */
function simulateCapture() {
    const area = document.getElementById('camera-area');
    if (!area) return;

    area.style.borderColor = 'rgba(16, 185, 129, 0.8)';
    area.style.background = 'rgba(16, 185, 129, 0.08)';
    area.innerHTML = `
        <i class="ph-fill ph-check-circle" style="font-size: 56px; color: #10b981;"></i>
        <p style="color: #10b981; margin-top: 16px; font-size: 16px; font-weight: 600;">Фото сделано!</p>
        <small style="color: #94a3b8;">ИИ классификация: Незаконная свалка — уверенность 94%</small>
    `;
}
window.simulateCapture = simulateCapture;

function submitReport(event) {
    event.preventDefault();
    const form = document.getElementById('report-form');
    if (!form) return;

    addXP(25);

    // Show success feedback
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="ph-fill ph-check-circle"></i> Отчет отправлен! +25 Опыта';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.disabled = false;
            form.reset();
            // Reset camera area
            const area = document.getElementById('camera-area');
            if (area) {
                area.style.borderColor = '';
                area.style.background = '';
                area.innerHTML = `
                    <i class="ph ph-camera-plus" style="font-size: 56px; color: #64748b;"></i>
                    <p style="color: #64748b; margin-top: 16px; font-size: 16px;">Нажмите, чтобы сделать фото</p>
                    <small style="color: #475569;">AI will auto-classify: Trash, Smoke, or Road violation</small>
                `;
            }
        }, 2500);
    }
}
window.submitReport = submitReport;

/* =========================================
   7. XP & Achievements System
   ========================================= */
function addXP(amount) {
    if (!auth.currentUser) return; // Must be logged in

    const userRef = db.collection('users').doc(auth.currentUser.uid);
    userRef.update({
        xp: firebase.firestore.FieldValue.increment(amount)
    }).then(() => {
        // Update local doc so UI updates immediately
        if (currentUserDoc) {
            currentUserDoc.xp += amount;
            updatePassportProgress();
        }
    }).catch(err => console.error("Error updating XP", err));
}

function updatePassportProgress() {
    let xp = 0;
    if (currentUserDoc && currentUserDoc.xp) {
        xp = currentUserDoc.xp;
    }

    const maxXP = 1000; // 1000 XP = 100%
    const pct = Math.min(100, Math.round((xp / maxXP) * 100));

    const pctEl = document.getElementById('passport-progress-pct');
    const fillEl = document.getElementById('passport-progress-fill');

    if (pctEl) pctEl.textContent = pct + '%';
    if (fillEl) fillEl.style.width = pct + '%';

    // Update level text
    const levelEl = document.querySelector('.passport-level');
    if (levelEl) {
        let level = 1, title = 'Эко-Новичок';
        if (pct >= 20) { level = 2; title = 'Мастер сортировки'; }
        if (pct >= 40) { level = 3; title = 'Эко-гражданин'; }
        if (pct >= 60) { level = 4; title = 'Эко-Воин'; }
        if (pct >= 80) { level = 5; title = 'Вело-Ниндзя'; }
        if (pct >= 100) { level = 6; title = 'Капитан Эко-Патруля'; }
        levelEl.innerHTML = `<i class="ph-fill ph-star"></i> Level ${level} — ${title}`;
    }

    // Also update the small dashboard eco-card progress bar (if visible)
    const dashPctEl = document.querySelector('.progress-pct');
    const dashFillEl = document.querySelector('.progress-fill.gradient-green');
    if (dashPctEl) dashPctEl.textContent = pct + '%';
    if (dashFillEl) dashFillEl.style.width = pct + '%';
}

/* =========================================
   8. Dynamic System Alerts
   ========================================= */
function updateDynamicAlerts(currentAqi) {
    const alertsContainer = document.querySelector('.alerts-list');
    if (!alertsContainer) return;

    if (currentAqi === undefined || currentAqi === null) {
        const cached = localStorage.getItem('cached_aqi_data');
        if (cached) {
            currentAqi = JSON.parse(cached).aqi;
        } else {
            currentAqi = 0;
        }
    }

    let showBlackDay = currentAqi > 150;
    if (currentForecastData && currentForecastData.pm25) {
        // If any forecast day's max/avg PM2.5 > 150, trigger Black Day warning
        showBlackDay = currentForecastData.pm25.some(d => d.max > 150 || d.avg > 150);
    }

    let showSmartBin = cityBins && cityBins.some(bin => bin.fill >= 90);

    // "Park Air" (Green) alert: AQI dropped back below 50 after being high
    const lastAqiState = localStorage.getItem('last_known_aqi_state');
    let showParkAir = false;
    if (currentAqi < 50) {
        if (lastAqiState === 'high') showParkAir = true;
        localStorage.setItem('last_known_aqi_state', 'low');
    } else if (currentAqi >= 50) {
        localStorage.setItem('last_known_aqi_state', 'high');
    }

    alertsContainer.innerHTML = '';

    if (showBlackDay) {
        alertsContainer.innerHTML += `
            <div class="alert-item hazard cursor-pointer hover-lift">
                <div class="alert-icon"><i class="ph-fill ph-mask-face"></i></div>
                <div class="alert-content">
                    <h4>Прогноз «Черного неба»</h4>
                    <p>ИКВ превышает 150. Уровень PM2.5 критичен. Рекомендуются маски.</p>
                    <span class="alert-time">Активное уведомление</span>
                </div>
            </div>`;
    }

    if (showSmartBin) {
        const fullBin = cityBins.find(b => b.fill >= 90);
        const msg = fullBin ? `${fullBin.name} на ${fullBin.fill}% полна. Маршрут оптимизирован.` : 'Урна достигла 90% заполненности.';
        alertsContainer.innerHTML += `
            <div class="alert-item info cursor-pointer hover-lift">
                <div class="alert-icon"><i class="ph-fill ph-trash"></i></div>
                <div class="alert-content">
                    <h4>Маршрут умных урн оптимизирован</h4>
                    <p>${msg}</p>
                    <span class="alert-time">Только что</span>
                </div>
            </div>`;
    }

    if (showParkAir) {
        alertsContainer.innerHTML += `
            <div class="alert-item safe cursor-pointer hover-lift">
                <div class="alert-icon"><i class="ph-fill ph-leaf"></i></div>
                <div class="alert-content">
                    <h4>Воздух в парке в норме</h4>
                    <p>ИКВ вернулся к безопасным уровням.</p>
                    <span class="alert-time">Активное уведомление</span>
                </div>
            </div>`;
    }

    // Default: System Status Normal
    if (!showBlackDay && !showSmartBin && !showParkAir) {
        alertsContainer.innerHTML = `
            <div class="alert-item safe cursor-pointer hover-lift" style="cursor: default; background: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.1);">
                <div class="alert-icon"><i class="ph-fill ph-check-circle"></i></div>
                <div class="alert-content">
                    <h4>Статус системы: Норма</h4>
                    <p>Все городские системы работают в безопасных пределах.</p>
                    <span class="alert-time">Недавно обновлено</span>
                </div>
            </div>`;
    }
}

/* =========================================
   9. Eco-Sim Grid (Main Page Version)
   ========================================= */
const SIM_ROWS = 10, SIM_COLS = 10;
let simGridData = [];
let simEntityData = [];
let activeSimTool = 'tree';

function selectSimTool(btnEl, tool) {
    document.querySelectorAll('.sim-tool-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    activeSimTool = tool;
}
window.selectSimTool = selectSimTool;

function resetSimGrid() {
    initEcoSimGridMain();
}
window.resetSimGrid = resetSimGrid;

function initEcoSimGridMain() {
    const simGrid = document.getElementById('sim-grid-main');
    if (!simGrid) return;

    simGrid.innerHTML = '';
    simGridData = Array(SIM_ROWS).fill(null).map(() => Array(SIM_COLS).fill(30));
    simEntityData = Array(SIM_ROWS).fill(null).map(() => Array(SIM_COLS).fill(null));

    for (let r = 0; r < SIM_ROWS; r++) {
        for (let c = 0; c < SIM_COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'sim-cell';
            cell.id = `sim-cell-main-${r}-${c}`;
            cell.addEventListener('click', () => handleSimCellClickMain(r, c));
            simGrid.appendChild(cell);
        }
    }
    updateSimRenderMain();
}

function handleSimCellClickMain(r, c) {
    if (simEntityData[r][c] === activeSimTool) return;
    simEntityData[r][c] = activeSimTool;
    recalculateSimAQI();
    updateSimRenderMain();
}

function recalculateSimAQI() {
    for (let r = 0; r < SIM_ROWS; r++) {
        for (let c = 0; c < SIM_COLS; c++) {
            simGridData[r][c] = 30;
        }
    }
    for (let r = 0; r < SIM_ROWS; r++) {
        for (let c = 0; c < SIM_COLS; c++) {
            const entity = simEntityData[r][c];
            if (entity === 'factory') applySimEffect(r, c, 120, 3);
            else if (entity === 'tree') applySimEffect(r, c, -40, 2);
        }
    }
}

function applySimEffect(centerR, centerC, amount, radius) {
    for (let r = Math.max(0, centerR - radius); r <= Math.min(SIM_ROWS - 1, centerR + radius); r++) {
        for (let c = Math.max(0, centerC - radius); c <= Math.min(SIM_COLS - 1, centerC + radius); c++) {
            const dist = Math.max(Math.abs(r - centerR), Math.abs(c - centerC));
            const effect = amount * (1 - (dist / (radius + 1)));
            simGridData[r][c] += effect;
            simGridData[r][c] = Math.max(10, Math.min(300, simGridData[r][c]));
        }
    }
}

function updateSimRenderMain() {
    let sumV = 0;
    let treeCount = 0, factoryCount = 0;

    for (let r = 0; r < SIM_ROWS; r++) {
        for (let c = 0; c < SIM_COLS; c++) {
            const val = simGridData[r][c];
            sumV += val;

            const cell = document.getElementById(`sim-cell-main-${r}-${c}`);
            if (!cell) continue;

            let bgColor = '#10b981';
            if (val > 50) bgColor = '#f59e0b';
            if (val > 100) bgColor = '#ef4444';
            if (val > 150) bgColor = '#7f1d1d';
            cell.style.backgroundColor = bgColor;

            const entity = simEntityData[r][c];
            cell.innerHTML = '';
            if (entity) {
                const el = document.createElement('div');
                el.className = 'sim-entity';
                if (entity === 'tree') { el.innerHTML = '🌲'; treeCount++; }
                if (entity === 'factory') { el.innerHTML = '🏭'; factoryCount++; }
                cell.appendChild(el);
            }
        }
    }

    const avgV = Math.round(sumV / (SIM_ROWS * SIM_COLS));
    const valEl = document.getElementById('sim-avg-v');
    if (valEl) {
        valEl.innerHTML = `${avgV} <small>AQI</small>`;
        valEl.className = 'stat-value';
        if (avgV <= 50) valEl.classList.add('text-green');
        else if (avgV <= 100) valEl.classList.add('text-orange');
        else valEl.classList.add('text-red');
    }

    const treeEl = document.getElementById('tree-count');
    if (treeEl) treeEl.textContent = treeCount;
    const factoryEl = document.getElementById('factory-count');
    if (factoryEl) factoryEl.textContent = factoryCount;

    const alertEl = document.getElementById('sim-alert-main');
    if (alertEl) alertEl.style.display = avgV > 80 ? 'flex' : 'none';
}

/* =========================================
   10. AR Camera Setup
   ========================================= */
function setupARCamera() {
    const btnAr = document.getElementById('btn-start-ar');
    if (!btnAr) return;

    btnAr.addEventListener('click', async () => {
        const video = document.getElementById('ar-video-feed');
        const labels = document.getElementById('ar-labels-container');
        if (!video || !labels) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            video.style.opacity = '1';
            labels.style.display = 'block';
            btnAr.innerHTML = '<i class="ph-bold ph-check text-green"></i> Система активна';
            btnAr.style.background = 'rgba(16,185,129,0.2)';
            btnAr.style.borderColor = 'rgba(16,185,129,0.5)';
            btnAr.style.color = '#10b981';
        } catch (err) {
            console.error('Camera access denied:', err);
            alert('Требуется доступ к камере для AR-просмотра улиц.');
        }
    });
}

/* =========================================
   11. Route Map Observer (Leaflet)
   ========================================= */
function setupRouteMapObserver() {
    const routeSection = document.getElementById('route');
    if (!routeSection) return;

    let mapInitialized = false;
    const observer = new MutationObserver(() => {
        if (routeSection.classList.contains('active') && !mapInitialized) {
            mapInitialized = true;
            setTimeout(() => initRouteMap(), 200);
        }
    });
    observer.observe(routeSection, { attributes: true, attributeFilter: ['class'] });
}

function initRouteMap() {
    const mapEl = document.getElementById('route-map');
    if (!mapEl) return;
    if (mapEl._leaflet_id) return; // Already initialized

    const map = L.map('route-map', {
        zoomControl: false,
        attributionControl: false
    }).setView([54.87, 69.15], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Routes
    const fastRoute = [[54.875, 69.14], [54.870, 69.145], [54.865, 69.15]];
    const greenRoute = [[54.875, 69.14], [54.872, 69.135], [54.868, 69.138], [54.865, 69.15]];

    L.polyline(fastRoute, { color: '#ef4444', weight: 4, opacity: 0.6, dashArray: '8, 8' }).addTo(map);
    L.polyline(greenRoute, { color: '#10b981', weight: 6, opacity: 0.9 }).addTo(map);

    const startIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background:#3b82f6; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>',
        iconSize: [16, 16], iconAnchor: [8, 8]
    });
    const endIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background:#10b981; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow: 0 0 15px rgba(16,185,129,0.8);"></div>',
        iconSize: [20, 20], iconAnchor: [10, 10]
    });

    L.marker(fastRoute[0], { icon: startIcon }).addTo(map);
    L.marker(fastRoute[fastRoute.length - 1], { icon: endIcon }).addTo(map);
}

/* =========================================
   12. Logout
   ========================================= */
function setupLogout() {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                location.reload();
            });
        });
    }
}

/* =========================================
   13. Firebase Auth & EmailJS Flows
   ========================================= */

// Unlock achievements based on Firestore data thresholds
function updateAchievements(data) {
    // Determine unlocks based on specific statistical boundaries
    const unlocks = {
        sorting: data.recycled >= 30,         // Sorting Master
        velo: data.greenKm >= 100,            // Velo-Ninja
        eagle: data.reportsSent >= 5,         // Eagle Eye / Eco-Patrol
        tree: data.treesPlanted >= 5          // Tree Hugger
    };

    // Mapping of DOM Badge IDs to unlock conditions
    const badgeMappings = {
        'dash-badge-sorting': unlocks.sorting,
        'badge-sorting': unlocks.sorting,
        'dash-badge-velo': unlocks.velo,
        'badge-velo': unlocks.velo,
        'dash-badge-patrol': unlocks.eagle,
        'badge-eagle': unlocks.eagle,
        'badge-tree': unlocks.tree
    };

    // Apply classes securely
    for (const [id, isUnlocked] of Object.entries(badgeMappings)) {
        const el = document.getElementById(id);
        if (el) {
            if (isUnlocked) el.classList.remove('locked');
            else el.classList.add('locked');
        }
    }
}

// Function to safely update innerText or src of elements if they exist
function updateUIElement(id, value, isSrc = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isSrc) el.src = value;
    else el.textContent = value;
}

// Called when auth state changes to logged in
function fetchUserData(user) {
    // 1. Immediately update UI to prevent flicker of fallback text
    document.querySelectorAll('.current-user-name').forEach(el => {
        el.textContent = user.displayName || 'Эко-гражданин';
    });

    // 2. Fetch extended data (XP, etc.) from Firestore
    db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists) {
            currentUserDoc = doc.data();

            // Map Firestore Data to dashboard Eco-Passport summary
            updateUIElement('dash-co2', currentUserDoc.co2Saved || 0);
            updateUIElement('dash-recycled', currentUserDoc.recycled || 0);

            // Map Firestore Data to main Eco-Passport view
            updateUIElement('stat-co2', currentUserDoc.co2Saved || 0);
            updateUIElement('stat-recycled', currentUserDoc.recycled || 0);
            updateUIElement('stat-reports', currentUserDoc.reportsSent || 0);
            updateUIElement('stat-greenkm', currentUserDoc.greenKm || 0);

            // Profile info
            const seed = currentUserDoc.avatarSeed || 'EcoUser';
            syncAllAvatars(seed);
            updateUIElement('passport-bio', currentUserDoc.bio || 'Новый участник');

            document.querySelectorAll('.passport-level').forEach(el => {
                el.innerHTML = `<i class="ph-fill ph-star"></i> Level ${currentUserDoc.level || 1}`;
            });

            // Unlock achievements
            updateAchievements(currentUserDoc);

            updatePassportProgress();

            // If displayName was missing, try falling back to the document name
            if (!user.displayName && currentUserDoc.name) {
                document.querySelectorAll('.current-user-name').forEach(el => {
                    el.textContent = currentUserDoc.name;
                });
            }
        }
    }).catch(err => {
        console.error("Error fetching user data", err);
    });
}

// Profile Editing Logic
function setupProfileEditing() {
    const btnEdit = document.getElementById('btn-edit-profile');
    const panel = document.getElementById('edit-profile-panel');
    const form = document.getElementById('edit-profile-form');
    const avatarInput = document.getElementById('edit-avatar');
    const passportAvatarImg = document.getElementById('passport-avatar');

    if (!btnEdit || !panel || !form || !avatarInput || !passportAvatarImg) return;

    btnEdit.addEventListener('click', () => {
        if (panel.style.display === 'none') {
            if (currentUserDoc) {
                avatarInput.value = currentUserDoc.avatarSeed || 'EcoUser';
                document.getElementById('edit-bio').value = currentUserDoc.bio || 'Новый участник';
            }
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
            // Reset live preview if cancelled
            if (currentUserDoc) {
                const seed = currentUserDoc.avatarSeed || 'EcoUser';
                syncAllAvatars(seed);
            }
        }
    });

    // Live Preview
    avatarInput.addEventListener('input', (e) => {
        const val = e.target.value.trim() || 'EcoUser';
        syncAllAvatars(val);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const newSeed = avatarInput.value.trim() || 'EcoUser';
        const newBio = document.getElementById('edit-bio').value.trim();
        const btnSave = document.getElementById('btn-save-profile');
        const spinner = document.getElementById('save-spinner');

        btnSave.disabled = true;
        spinner.style.display = 'inline-block';

        db.collection('users').doc(user.uid).update({
            avatarSeed: newSeed,
            bio: newBio || 'Новый участник'
        }).then(() => {
            panel.style.display = 'none';
            fetchUserData(user); // Force refresh of DOM
        }).catch(err => {
            console.error("Error updating profile:", err);
            alert("Failed to save changes. Check console.");
        }).finally(() => {
            btnSave.disabled = false;
            spinner.style.display = 'none';
        });
    });
}

// Attach modal edit listeners on load
document.addEventListener('DOMContentLoaded', () => {
    // ... wait a short tick to ensure DOM is ready
    setTimeout(setupProfileEditing, 500);
});

window.toggleAuthMode = function (mode) {
    var loginBox = document.getElementById('login-container');
    var signupBox = document.getElementById('signup-container');
    var errMsg = document.getElementById('auth-msg-error');
    var okMsg = document.getElementById('auth-msg-success');
    if (errMsg) errMsg.style.display = 'none';
    if (okMsg) okMsg.style.display = 'none';
    if (mode === 'signup') {
        loginBox.style.display = 'none';
        signupBox.style.display = 'block';
    } else {
        loginBox.style.display = 'block';
        signupBox.style.display = 'none';
    }
};

window.showAuthError = function (msg) {
    var el = document.getElementById('auth-msg-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    var ok = document.getElementById('auth-msg-success');
    if (ok) ok.style.display = 'none';
};

window.showAuthSuccess = function (msg) {
    var el = document.getElementById('auth-msg-success');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    var err = document.getElementById('auth-msg-error');
    if (err) err.style.display = 'none';
};

function clearAuthErrors() {
    ['login-email', 'login-password', 'signup-email', 'signup-password', 'signup-name', 'verify-code'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.borderColor = 'rgba(255,255,255,0.1)';
    });
}

function getFriendlyErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-login-credentials':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Неверные учетные данные. Пожалуйста, попробуйте снова.';
        case 'auth/email-already-in-use':
            return 'Аккаунт с таким email уже существует.';
        case 'auth/weak-password':
            return 'Пароль слишком слабый. Минимум 6 символов.';
        case 'auth/invalid-email':
            return 'Пожалуйста, введите корректный email.';
        case 'auth/network-request-failed':
            return 'Ошибка сети. Проверьте подключение.';
        default:
            return error.message || 'Произошла непредвиденная ошибка.';
    }
}

window.tempAuthData = null;

window.handleInitialSignup = async function (e) {
    e.preventDefault();
    clearAuthErrors();
    var nameEl = document.getElementById('signup-name');
    var emailEl = document.getElementById('signup-email');
    var passwordEl = document.getElementById('signup-password');

    var name = nameEl.value.trim();
    var email = emailEl.value.trim();
    var password = passwordEl.value;

    if (!name || !email || !password) {
        showAuthError('Пожалуйста, заполните все поля.');
        if (!name) nameEl.style.borderColor = '#ef4444';
        if (!email) emailEl.style.borderColor = '#ef4444';
        if (!password) passwordEl.style.borderColor = '#ef4444';
        return;
    }
    if (password.length < 6) {
        showAuthError('Пароль должен быть минимум 6 символов.');
        passwordEl.style.borderColor = '#ef4444';
        return;
    }

    try {
        // Pre-check if email is already in use before sending code
        const methods = await auth.fetchSignInMethodsForEmail(email);
        if (methods.length > 0) {
            showAuthError('Аккаунт с таким email уже существует.');
            emailEl.style.borderColor = '#ef4444';
            return;
        }

        var code = Math.floor(100000 + Math.random() * 900000).toString();
        window.tempAuthData = { name, email, password, code };

        var btn = document.getElementById('btn-signup-submit');
        var originalText = btn.innerHTML;
        btn.innerText = "Отправка кода...";
        btn.disabled = true;
        showAuthSuccess("Код подтверждения отправлен");

        emailjs.send("service_h68p3x4", "template_q9kghrm", {
            user_name: name,
            user_email: email,
            verification_code: code
        }).then(() => {
            document.getElementById('auth-signup-form').style.display = 'none';
            document.getElementById('auth-verify-form').style.display = 'block';
            showAuthSuccess("Код подтверждения отправлен на email.");
        }).catch(err => {
            console.error(err);
            showAuthError("Ошибка отправки кода.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    } catch (error) {
        showAuthError(getFriendlyErrorMessage(error));
        emailEl.style.borderColor = '#ef4444';
    }
};

window.handleVerifyCode = function (e) {
    e.preventDefault();
    clearAuthErrors();
    var codeEl = document.getElementById('verify-code');
    var codeInput = codeEl.value.trim();
    if (!window.tempAuthData || codeInput !== window.tempAuthData.code) {
        showAuthError("Неверный код подтверждения. Проверьте email.");
        codeEl.style.borderColor = '#ef4444';
        return;
    }

    var { name, email, password } = window.tempAuthData;
    var btn = document.getElementById('btn-verify-submit');
    btn.innerText = "Создание аккаунта...";
    btn.disabled = true;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            var user = userCredential.user;
            user.updateProfile({ displayName: name });

            db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                xp: 0,
                level: 1,
                reportsSent: 0,
                co2Saved: 0,
                recycled: 0,
                greenKm: 0,
                treesPlanted: 0,
                avatarSeed: name || 'EcoUser', // Avatar string matching Dicebear API generator
                bio: 'Новый участник',
                achievements: [], // Explicitly empty achievements array
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showAuthSuccess('Аккаунт создан! Добро пожаловать в EcoCity.');
        })
        .catch((error) => {
            showAuthError(getFriendlyErrorMessage(error));
            btn.innerText = "Verify & Create Account";
            btn.disabled = false;
        });
};

window.handleInlineLogin = function (e) {
    e.preventDefault();
    clearAuthErrors();
    var emailEl = document.getElementById('login-email');
    var passwordEl = document.getElementById('login-password');
    var email = emailEl.value.trim();
    var password = passwordEl.value;

    if (!email || !password) {
        showAuthError('Пожалуйста, заполните email и пароль.');
        if (!email) emailEl.style.borderColor = '#ef4444';
        if (!password) passwordEl.style.borderColor = '#ef4444';
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            showAuthSuccess('Доступ разрешен. Создание панели управления...');
            // state observer will hide the overlay and fetch info
        })
        .catch((error) => {
            showAuthError(getFriendlyErrorMessage(error));
            emailEl.style.borderColor = '#ef4444';
            passwordEl.style.borderColor = '#ef4444';
        });
};

/* =========================================
   Report Violation AI Processing Logic
   ========================================= */
window.handlePhotoSelect = function (e) {
    const file = e.target.files[0];
    if (file) {
        const preview = document.getElementById('photo-preview');
        const placeholder = document.getElementById('camera-placeholder');
        if (preview && placeholder) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
    }
};

window.syncAllAvatars = function (seed) {
    const safeSeed = encodeURIComponent(seed || 'EcoUser');
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${safeSeed}&backgroundColor=b6e3f4`;
    document.querySelectorAll('.user-avatar').forEach(img => {
        img.src = url;
    });
};

window.submitReport = function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Обработка ИИ...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;

        const preview = document.getElementById('photo-preview');
        const placeholder = document.getElementById('camera-placeholder');
        if (preview) preview.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        e.target.reset();

        const user = auth.currentUser;
        if (user && currentUserDoc) {
            const newXp = (currentUserDoc.xp || 0) + 20;
            const newReports = (currentUserDoc.reportsSent || 0) + 1;
            db.collection('users').doc(user.uid).update({
                xp: newXp,
                reportsSent: newReports
            }).then(() => {
                alert("Проверено ИИ: Нарушение зафиксировано! +20 Опыта начислено.");
                fetchUserData(user); // refresh UI
            }).catch(console.error);
        } else {
            alert("Проверено ИИ: Нарушение зафиксировано! (Войдите, чтобы увидеть опыт)");
        }
    }, 2000);
};

/* =========================================
   PWA & Service Worker Logic
   ========================================= */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then((reg) => console.log('Service Worker registered', reg))
        .catch((err) => console.error('Service Worker registration failed', err));
}

let deferredPrompt;
const btnInstallPwa = document.getElementById('btn-install-pwa');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    if (btnInstallPwa) {
        btnInstallPwa.style.display = 'flex';
    }
});

if (btnInstallPwa) {
    btnInstallPwa.addEventListener('click', async () => {
        // Show the install prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, throw it away
            deferredPrompt = null;
            btnInstallPwa.style.display = 'none';
        }
    });
}

window.addEventListener('appinstalled', () => {
    // Clear the deferredPrompt so it can be garbage collected
    deferredPrompt = null;
    console.log('PWA was installed');
    if (btnInstallPwa) {
        btnInstallPwa.style.display = 'none';
    }
});
