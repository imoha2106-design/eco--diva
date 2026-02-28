/* =========================================
   AR Eco-Scanner — WebAR Logic (A-Frame + AR.js)
   Location-based AR for EcoCity / ECODIVA
   ========================================= */

let arSceneActive = false;
let arScanCooldown = false;

/* -----------------------------------------
   Color & Label Helpers (match dashboard)
   ----------------------------------------- */
function getAqiColor(aqi) {
    if (aqi <= 50) return '#10b981';   // Green — Safe
    if (aqi <= 100) return '#f59e0b';  // Yellow — Moderate
    if (aqi <= 150) return '#ef4444';  // Red — Unhealthy
    if (aqi <= 200) return '#dc2626';  // Dark Red — Very Unhealthy
    return '#7f1d1d';                   // Maroon — Hazardous
}

function getAqiLabel(aqi) {
    if (aqi <= 50) return 'Отлично';
    if (aqi <= 100) return 'Умеренно';
    if (aqi <= 150) return 'Вредно для чувствительных';
    if (aqi <= 200) return 'Вредно';
    return 'Опасно';
}

function getAqiEmoji(aqi) {
    if (aqi <= 50) return '🟢';
    if (aqi <= 100) return '🟡';
    if (aqi <= 150) return '🟠';
    return '🔴';
}

/* -----------------------------------------
   Petropavl AR Hotspot Locations
   ----------------------------------------- */
const arHotspots = [
    { name: 'Центр города', lat: 54.8753, lng: 69.1490, offset: 0 },
    { name: 'Центральный парк', lat: 54.8720, lng: 69.1350, offset: -15 },
    { name: 'Промышленная зона', lat: 54.8650, lng: 69.1550, offset: +40 },
    { name: 'Жилой район', lat: 54.8800, lng: 69.1420, offset: +5 },
    { name: 'Набережная Ишима', lat: 54.8710, lng: 69.1480, offset: -10 },
];

/* -----------------------------------------
   Start AR Scanner
   ----------------------------------------- */
function startARScanner() {
    if (arSceneActive) return;
    arSceneActive = true;

    const container = document.getElementById('ar-scene-container');
    if (!container) return;

    // Get live AQI from main app
    const liveAqi = (typeof currentAqiVal !== 'undefined' && currentAqiVal > 0) ? currentAqiVal : 32;

    // Build A-Frame scene dynamically
    const scene = document.createElement('a-scene');
    scene.setAttribute('id', 'ar-aframe-scene');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('arjs', 'sourceType: webcam; videoTexture: true; debugUIEnabled: false;');
    scene.setAttribute('renderer', 'antialias: true; alpha: true; logarithmicDepthBuffer: true;');
    scene.setAttribute('embedded', '');
    scene.style.position = 'absolute';
    scene.style.top = '0';
    scene.style.left = '0';
    scene.style.width = '100%';
    scene.style.height = '100%';
    scene.style.zIndex = '1';

    // Camera entity with GPS
    const camera = document.createElement('a-camera');
    camera.setAttribute('gps-camera', 'simulateLatitude: 54.8753; simulateLongitude: 69.1490; simulateAltitude: 10;');
    camera.setAttribute('rotation-reader', '');
    camera.setAttribute('look-controls-enabled', 'false');
    scene.appendChild(camera);

    // Create AR markers for each hotspot
    arHotspots.forEach((spot) => {
        const spotAqi = Math.max(10, Math.min(300, liveAqi + spot.offset));
        const color = getAqiColor(spotAqi);
        const label = getAqiLabel(spotAqi);
        const emoji = getAqiEmoji(spotAqi);

        const entity = document.createElement('a-entity');
        entity.setAttribute('gps-entity-place', `latitude: ${spot.lat}; longitude: ${spot.lng};`);

        // Background panel
        const panel = document.createElement('a-plane');
        panel.setAttribute('width', '4');
        panel.setAttribute('height', '2.5');
        panel.setAttribute('color', '#0f172a');
        panel.setAttribute('opacity', '0.92');
        panel.setAttribute('side', 'double');
        panel.setAttribute('position', '0 3 0');
        panel.setAttribute('look-at', '[gps-camera]');
        entity.appendChild(panel);

        // Colored accent bar at top
        const accent = document.createElement('a-plane');
        accent.setAttribute('width', '4');
        accent.setAttribute('height', '0.3');
        accent.setAttribute('color', color);
        accent.setAttribute('opacity', '0.95');
        accent.setAttribute('position', '0 4.1 0.01');
        accent.setAttribute('look-at', '[gps-camera]');
        entity.appendChild(accent);

        // AQI value text
        const aqiText = document.createElement('a-text');
        aqiText.setAttribute('value', `${emoji} ${spotAqi} AQI`);
        aqiText.setAttribute('color', color);
        aqiText.setAttribute('align', 'center');
        aqiText.setAttribute('width', '6');
        aqiText.setAttribute('position', '0 3.5 0.02');
        aqiText.setAttribute('look-at', '[gps-camera]');
        entity.appendChild(aqiText);

        // Status label
        const statusText = document.createElement('a-text');
        statusText.setAttribute('value', label);
        statusText.setAttribute('color', '#94a3b8');
        statusText.setAttribute('align', 'center');
        statusText.setAttribute('width', '4');
        statusText.setAttribute('position', '0 3.0 0.02');
        statusText.setAttribute('look-at', '[gps-camera]');
        entity.appendChild(statusText);

        // Location name
        const nameText = document.createElement('a-text');
        nameText.setAttribute('value', spot.name);
        nameText.setAttribute('color', '#e2e8f0');
        nameText.setAttribute('align', 'center');
        nameText.setAttribute('width', '3.5');
        nameText.setAttribute('position', '0 2.4 0.02');
        nameText.setAttribute('look-at', '[gps-camera]');
        entity.appendChild(nameText);

        // Floating dot marker below card
        const marker = document.createElement('a-sphere');
        marker.setAttribute('radius', '0.3');
        marker.setAttribute('color', color);
        marker.setAttribute('opacity', '0.8');
        marker.setAttribute('position', '0 1 0');
        marker.setAttribute('animation', 'property: position; to: 0 1.3 0; dir: alternate; dur: 1500; loop: true; easing: easeInOutSine;');
        entity.appendChild(marker);

        scene.appendChild(entity);
    });

    container.appendChild(scene);

    // Update the overlay HUD with live AQI
    updateARHud(liveAqi);

    // Show the overlay controls
    const overlay = document.getElementById('ar-hud-overlay');
    if (overlay) overlay.style.display = 'block';
}

/* -----------------------------------------
   Stop AR Scanner
   ----------------------------------------- */
function stopARScanner() {
    arSceneActive = false;
    const scene = document.getElementById('ar-aframe-scene');
    if (scene) {
        // Stop all video tracks
        const video = scene.querySelector('video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        scene.parentElement.removeChild(scene);
    }
    const overlay = document.getElementById('ar-hud-overlay');
    if (overlay) overlay.style.display = 'none';
}

/* -----------------------------------------
   Update AR HUD overlay
   ----------------------------------------- */
function updateARHud(aqi) {
    const badge = document.getElementById('ar-aqi-badge');
    if (badge) {
        const color = getAqiColor(aqi);
        const label = getAqiLabel(aqi);
        badge.textContent = `${aqi} AQI — ${label}`;
        badge.style.background = color + '22';
        badge.style.color = color;
        badge.style.borderColor = color + '55';
    }
}

/* -----------------------------------------
   Scan Environment → +10 XP
   ----------------------------------------- */
function scanEnvironment() {
    if (arScanCooldown) return;
    arScanCooldown = true;

    const user = (typeof auth !== 'undefined') ? auth.currentUser : null;
    if (!user) {
        alert('Пожалуйста, войдите в аккаунт, чтобы получить XP.');
        arScanCooldown = false;
        return;
    }

    const scanBtn = document.getElementById('ar-scan-btn');
    if (scanBtn) {
        scanBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Сканирование...';
        scanBtn.disabled = true;
    }

    // Award +10 XP for environmental monitoring
    const db = firebase.firestore();
    db.collection('users').doc(user.uid).update({
        xp: firebase.firestore.FieldValue.increment(10)
    }).then(() => {
        // Update local state
        if (typeof currentUserDoc !== 'undefined' && currentUserDoc) {
            currentUserDoc.xp = (currentUserDoc.xp || 0) + 10;
            if (typeof updatePassportProgress === 'function') updatePassportProgress();
        }
        if (typeof fetchUserData === 'function') fetchUserData(user);

        // Show success feedback
        showARToast('Сканирование завершено! +10 XP за экомониторинг 🌿');

        if (scanBtn) {
            scanBtn.innerHTML = '<i class="ph-fill ph-check-circle"></i> Готово! +10 XP';
            scanBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }

        // Reset button after delay
        setTimeout(() => {
            if (scanBtn) {
                scanBtn.innerHTML = '<i class="ph-bold ph-scan"></i> Сканировать среду';
                scanBtn.style.background = '';
                scanBtn.disabled = false;
            }
            arScanCooldown = false;
        }, 5000);

    }).catch(err => {
        console.error('Error awarding AR XP:', err);
        arScanCooldown = false;
        if (scanBtn) {
            scanBtn.innerHTML = '<i class="ph-bold ph-scan"></i> Сканировать среду';
            scanBtn.disabled = false;
        }
    });
}

/* -----------------------------------------
   AR Toast Notification
   ----------------------------------------- */
function showARToast(message) {
    const toast = document.getElementById('ar-toast');
    if (!toast) return;
    toast.querySelector('span').textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(30px)';
    }, 4000);
}

/* -----------------------------------------
   Section Navigation Hook
   ----------------------------------------- */
// Start / stop AR when navigating in/out of the ar-scanner section
const _originalShowSection = window.showSection;
window.showSection = function (sectionId) {
    // If leaving AR, stop it
    if (arSceneActive && sectionId !== 'ar-scanner') {
        stopARScanner();
    }
    // Call original navigation
    if (typeof _originalShowSection === 'function') {
        _originalShowSection(sectionId);
    }
};

/* -----------------------------------------
   Global Exports
   ----------------------------------------- */
window.startARScanner = startARScanner;
window.stopARScanner = stopARScanner;
window.scanEnvironment = scanEnvironment;
